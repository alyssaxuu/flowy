import Canvas from './Canvas'
import Manager from './Manager'

function shim(canvas, drag, release, snapping, spacing_x, spacing_y) {
  return flowy({
    window: window,
    document: document,
    canvas: new Canvas({ canvas, spacingX: spacing_x, spacingY: spacing_y, window, document }),
    manager: new Manager({ window, document }),
    onBlockGrabbed: drag,
    onBlockReleased: release,
    onBlockSnapped: snapping
  })
}

function flowy({
  window,
  document,
  canvas,
  manager,
  onBlockGrabbed = void 0,
  onBlockReleased = void 0,
  onBlockSnapped = void 0
}) {
  flowy.load = function() {
    if (canvas.isInitialized) {
      return
    }

    var blocks = canvas.blocks
    var blockstemp = []
    const paddingX = canvas.spacingX
    const paddingY = canvas.spacingY

    canvas.initialize()
    manager.setState({
      currentOffsetLeft: 0,
      previousOffsetLeft: 0
    })

    flowy.import = canvas.import
    flowy.output = canvas.output
    flowy.deleteBlocks = canvas.reset

    flowy.beginDrag = function(event) {
      const { clientX, clientY } = event.targetTouches ? event.targetTouches[0] : event

      manager.setState({
        mouseX: clientX,
        mouseY: clientY
      })

      const { target, which } = event
      const grabbedElement = target.closest('.create-flowy')

      if (which === 3 || !grabbedElement) {
        return
      }

      manager.createDragger(grabbedElement, canvas)
      manager.toggleDragging(true)

      onBlockGrabbed(grabbedElement)
    }

    document.addEventListener('mousedown', touchblock, false)
    document.addEventListener('touchstart', touchblock, false)
    document.addEventListener('mouseup', touchblock, false)

    flowy.touchDone = () => {
      manager.toggleDraggingBlock(false)
    }

    document.addEventListener('mousedown', flowy.beginDrag)
    document.addEventListener('touchstart', flowy.beginDrag)

    flowy.endDrag = function(event) {
      if (event.which === 3 || !(manager.isDragging || manager.isRearranging)) {
        return
      }

      manager.toggleDraggingBlock(false)

      onBlockReleased()

      canvas.showIndicator(true)

      const { draggedBlock } = manager

      if (manager.isDragging) {
        manager.toggleDragger(false)
      }

      if (draggedBlock.id === 0 && manager.isRearranging) {
        manager.toggleDragger(false)
        manager.toggleRearranging(false)

        blockstemp.forEach(block => {
          if (block.id !== draggedBlock.id) {
            return
          }

          const currentBlock = canvas.findBlock(block.id)
          const currentArrow = currentBlock.arrow()

          currentBlock.styles({
            left:
              currentBlock.position().left - (canvas.position().left + window.scrollX) + canvas.position().scrollLeft,
            top: currentBlock.position().top - (canvas.position().top + window.scrollY) + canvas.position().scrollTop
          })

          currentArrow.styles({
            left:
              currentArrow.position().left - (canvas.position().left + window.scrollX) + canvas.position().scrollLeft,
            top: currentArrow.position().top - (canvas.position().top + canvas.position().scrollTop) + 'px'
          })

          canvas.appendChild(currentBlock.element, currentArrow.element)

          block.x = currentBlock.position().left + currentBlock.element.offsetWidth / 2 + canvas.position().scrollLeft
          block.y = currentBlock.position().top + currentBlock.element.offsetHeight / 2 + canvas.position().scrollTop
        })

        for (var w = 0; w < blockstemp.length; w++) {}

        blockstemp.find(a => a.id == 0).x = draggedBlock.position().left + draggedBlock.position().width / 2
        blockstemp.find(a => a.id == 0).y = draggedBlock.position().top + draggedBlock.position().height / 2

        canvas.appendBlocks(blockstemp)
        blockstemp = []
      } else if (
        manager.isDragging &&
        blocks.length == 0 &&
        draggedBlock.position().top > canvas.position().top + window.scrollY &&
        draggedBlock.position().left > canvas.position().left + window.scrollX
      ) {
        onBlockSnapped(draggedBlock.element, true, undefined)

        manager.toggleDragging(false)

        draggedBlock.styles({
          top:
            draggedBlock.position().top - (canvas.position().top + window.scrollY) + canvas.position().scrollTop + 'px',
          left:
            draggedBlock.position().left -
            (canvas.position().left + window.scrollX) +
            canvas.position().scrollLeft +
            'px'
        })

        canvas.appendChild(draggedBlock.element)

        blocks.push({
          parent: -1,
          childwidth: 0,
          id: draggedBlock.id,
          x: draggedBlock.position().left + draggedBlock.position().width / 2 + canvas.position().scrollLeft,
          y: draggedBlock.position().top + draggedBlock.position().height / 2 + canvas.position().scrollTop,
          width: draggedBlock.position().width,
          height: draggedBlock.position().height
        })
      } else if (manager.isDragging && blocks.length == 0) {
        canvas.appendChild(document.querySelector('.indicator'))
        manager.toggleDragger(false, { remove: true })
      } else if (manager.isDragging || manager.isRearranging) {
        var xpos = draggedBlock.position().left + draggedBlock.position().width / 2 + canvas.position().scrollLeft
        var ypos = draggedBlock.position().top + canvas.position().scrollTop

        for (var i = 0; i < blocks.length; i++) {
          const block = blocks[i]
          const { x, y, height, width } = block

          if (
            xpos >= x - width / 2 - paddingX &&
            xpos <= x + width / 2 + paddingX &&
            ypos >= y - height / 2 &&
            ypos <= y + height
          ) {
            manager.toggleDragging(false)

            if (manager.isRearranging || onBlockSnapped(draggedBlock.element, false, block)) {
              snap(draggedBlock, block)
            }

            break
          } else if (i == blocks.length - 1) {
            if (manager.isRearranging) {
              manager.toggleRearranging(false)
              blockstemp = []
            }

            manager.toggleDragging(false)
            canvas.appendChild(document.querySelector('.indicator'))
            manager.toggleDragger(false, { remove: true })
          }
        }
      }
    }

    document.addEventListener('mouseup', flowy.endDrag, false)
    document.addEventListener('touchend', flowy.endDrag, false)

    function snap(draggedBlock, block) {
      if (!manager.isRearranging) {
        canvas.appendChild(draggedBlock.element)
      }

      var totalwidth = 0
      var totalremove = 0
      var maxheight = 0

      const snapBlocks = blocks.filter(({ parent }) => parent == block.id)

      for (var w = 0; w < snapBlocks.length; w++) {
        var { childwidth, width } = snapBlocks[w]
        totalwidth += Math.max(childwidth, width) + paddingX
      }

      totalwidth += draggedBlock.position().width

      for (var w = 0; w < snapBlocks.length; w++) {
        const children = snapBlocks[w]
        const { id, childwidth, width } = children
        const currentBlock = canvas.findBlock(id)
        const { x } = block

        if (childwidth > width) {
          currentBlock.styles({
            left: x - totalwidth / 2 + totalremove + childwidth / 2 - width / 2 + 'px'
          })
          children.x = blocks.find(id => id.parent == block.id).x - totalwidth / 2 + totalremove + childwidth / 2
        } else {
          currentBlock.styles({
            left: x - totalwidth / 2 + totalremove + 'px'
          })
          children.x = blocks.find(({ parent }) => parent == block.id).x - totalwidth / 2 + totalremove + width / 2
        }

        totalremove += Math.max(childwidth, width) + paddingX
      }

      draggedBlock.styles({
        left:
          blocks.find(id => id.id == block.id).x -
          totalwidth / 2 +
          totalremove -
          (canvas.position().left + window.scrollX) +
          canvas.position().scrollLeft +
          'px',
        top:
          blocks.find(id => id.id == block.id).y +
          blocks.find(id => id.id == block.id).height / 2 +
          paddingY -
          (canvas.position().top + window.scrollY) +
          'px'
      })

      if (manager.isRearranging) {
        const dragtemp = blockstemp.find(({ id }) => id == draggedBlock.id)
        dragtemp.x = draggedBlock.position().left + draggedBlock.position().width / 2 + canvas.position().scrollLeft * 2
        dragtemp.y = draggedBlock.position().top + draggedBlock.position().height / 2 + canvas.position().scrollTop
        dragtemp.parent = block.id

        for (var w = 0; w < blockstemp.length; w++) {
          if (parseInt(blockstemp[w].id) === draggedBlock.id) {
            continue
          }

          const currentBlock = canvas.findBlock(blockstemp[w].id)
          const currentArrow = currentBlock.arrow()
          const blockParent = currentBlock.element
          const arrowParent = currentArrow.element

          currentBlock.styles({
            left:
              currentBlock.position().left - (canvas.position().left + window.scrollX) + canvas.position().scrollLeft,
            top: currentBlock.position().top - (canvas.position().top + window.scrollY) + canvas.position().scrollTop
          })
          currentArrow.styles({
            left:
              currentArrow.position().left -
              (canvas.position().left + window.scrollX) +
              canvas.position().scrollLeft +
              20,
            top: currentArrow.position().top - (canvas.position().top + window.scrollY) + canvas.position().scrollTop
          })

          canvas.appendChild(blockParent, arrowParent)

          blockstemp[w].x =
            currentBlock.position().left + draggedBlock.position().width / 2 + canvas.position().scrollLeft
          blockstemp[w].y =
            currentBlock.position().top + draggedBlock.position().height / 2 + canvas.position().scrollTop
        }

        canvas.appendBlocks(blockstemp)
        blockstemp = []
      } else {
        blocks.push({
          childwidth: 0,
          parent: block.id,
          id: draggedBlock.id,
          x: draggedBlock.position().left + draggedBlock.position().width / 2 + canvas.position().scrollLeft,
          y: draggedBlock.position().top + draggedBlock.position().height / 2 + canvas.position().scrollTop,
          width: draggedBlock.position().width,
          height: draggedBlock.position().height
        })
      }

      var { x, y, height } = blocks.find(({ id }) => id == draggedBlock.id)
      var arrowX = x - block.x + 20
      var arrowY = parseFloat(
        y -
          height / 2 -
          (blocks.find(({ parent }) => parent == block.id).y +
            blocks.find(({ parent }) => parent == block.id).height / 2) +
          canvas.position().scrollTop
      )

      if (arrowX < 0) {
        canvas.appendHtml(`
          <div class="arrowblock">
            <input type="hidden" class="arrowid" value="${draggedBlock.id}">
            <svg preserveaspectratio="none" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="
                M${blocks.find(a => a.id == block.id).x - x + 5}
                0L${blocks.find(a => a.id == block.id).x - x + 5}
                ${paddingY / 2}L5
                ${paddingY / 2}L5
                ${arrowY}" stroke="#C5CCD0" stroke-width="2px"/>
              <path d="M0 ${arrowY - 5}H10L5
                ${arrowY}L0
                ${arrowY - 5}Z" fill="#C5CCD0"/>
            </svg>
          </div>
        `)
        draggedBlock.arrow().styles({
          left: `${x - 5 - (canvas.position().left + window.scrollX) + canvas.position().scrollLeft}px`
        })
      } else {
        canvas.appendHtml(`
          <div class="arrowblock">
            <input type="hidden" class="arrowid" value="${draggedBlock.id}">
            <svg preserveaspectratio="none" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M20 0L20
                ${paddingY / 2}L${arrowX}
                ${paddingY / 2}L${arrowX}
                ${arrowY}" stroke="#C5CCD0" stroke-width="2px"/>
              <path d="M${arrowX - 5}
                ${arrowY - 5}H${arrowX + 5}L${arrowX}
                ${arrowY}L${arrowX - 5}
                ${arrowY - 5}Z" fill="#C5CCD0"/>
            </svg>
          </div>
        `)
        draggedBlock.arrow().styles({
          left: `${block.x - 20 - (canvas.position().left + window.scrollX) + canvas.position().scrollLeft}px`
        })
      }
      draggedBlock.arrow().styles({
        top: `${block.y + block.height / 2}px`
      })

      if (block.parent != -1) {
        let idval = block.id
        let loopBlock

        while (true) {
          loopBlock = blocks.find(({ id }) => id == idval)

          if (loopBlock.parent == -1) {
            break
          }

          let zwidth = 0
          const parents = blocks.filter(({ parent }) => parent == idval)

          parents.forEach(({ childwidth, width }, w) => {
            zwidth += Math.max(childwidth, width)

            if (w !== parents.length - 1) {
              zwidth += paddingX
            }
          })

          loopBlock.childwidth = zwidth
          idval = loopBlock.parent
        }

        loopBlock.childwidth = totalwidth
      }

      if (manager.isRearranging) {
        manager.toggleRearranging(false)
        manager.toggleDragger(false)
      }

      rearrangeMe()
      checkOffset()
    }

    function touchblock(event) {
      manager.toggleDraggingBlock(false)

      if (!hasParentClass(event.target, 'block')) {
        return
      }

      var theblock = event.target.closest('.block')

      const { clientX, clientY } = event.targetTouches ? event.targetTouches[0] : event

      manager.setState({
        mouseX: clientX,
        mouseY: clientY
      })

      if (
        event.type !== 'mouseup' &&
        hasParentClass(event.target, 'block') &&
        event.which != 3 &&
        !manager.isDragging &&
        !manager.isRearranging
      ) {
        manager.toggleDraggingBlock(true)
        manager.registerDragger(theblock)

        const { draggedBlock } = manager

        manager.setState({
          dragX: clientX - draggedBlock.position().left,
          dragY: clientY - draggedBlock.position().top
        })
      }
    }

    function hasParentClass(element, classname) {
      if (element.className && element.className.split(' ').indexOf(classname) >= 0) {
        return true
      }

      return element.parentNode && hasParentClass(element.parentNode, classname)
    }

    flowy.moveBlock = function(event) {
      const { clientX, clientY } = event.targetTouches ? event.targetTouches[0] : event

      manager.setState({
        mouseX: clientX,
        mouseY: clientY
      })

      const { draggedBlock } = manager

      if (manager.isDraggingBlock) {
        manager.toggleRearranging(true)
        manager.toggleDragger(true)

        var blockid = draggedBlock.id
        blockstemp.push(blocks.find(({ id }) => id == blockid))
        canvas.replaceBlocks(blocks.filter(({ id }) => id != blockid))

        if (blockid !== 0) {
          draggedBlock.arrow().remove()
        }

        const filteredBlocks = blocks.filter(({ parent }) => parent == blockid)
        let layer = filteredBlocks
        let foundids = []
        const allids = []

        do {
          layer.forEach(block => {
            // TODO: layer[i] should be layer[i].id
            if (block.id == blockid) {
              return
            }

            blockstemp.push(block)

            const currentBlock = canvas.findBlock(block.id)
            const currentArrow = currentBlock.arrow()

            currentBlock.styles({
              left: currentBlock.position().left - draggedBlock.position().left,
              top: currentBlock.position().top - draggedBlock.position().top
            })
            currentArrow.styles({
              left: currentArrow.position().left - draggedBlock.position().left,
              top: currentArrow.position().top - draggedBlock.position().top
            })

            draggedBlock.element.appendChild(currentBlock.element)
            draggedBlock.element.appendChild(currentArrow.element)

            foundids.push(block.id)
            allids.push(block.id)
          })

          layer = blocks.filter(({ parent }) => foundids.includes(parent))
          foundids = []
        } while (layer.length)

        filteredBlocks.forEach(blocknumber => {
          canvas.replaceBlocks(blocks.filter(({ id }) => id != blocknumber))
        })

        allids.forEach(blocknumber => {
          canvas.replaceBlocks(blocks.filter(({ id }) => id != blocknumber))
        })

        if (blocks.length > 1) {
          rearrangeMe()
        }

        if (manager.isLastEvent) {
          fixOffset()
        }

        manager.toggleDraggingBlock(false)
      }

      const { dragX, dragY } = manager.state

      if (manager.isDragging) {
        draggedBlock.styles({
          left: `${clientX - dragX}px`,
          top: `${clientY - dragY}px`
        })
      } else if (manager.isRearranging) {
        draggedBlock.styles({
          left: `${clientX - dragX - (canvas.position().left + window.scrollX) + canvas.position().scrollLeft}px`,
          top: `${clientY - dragY - (canvas.position().top + window.scrollY) + canvas.position().scrollTop}px`
        })

        // TODO: Doesn't look like setting `x` and `y` does anything here - remove?
        blockstemp.filter(({ id }) => id == draggedBlock.id).x =
          draggedBlock.position().left + draggedBlock.position().width / 2 + canvas.position().scrollLeft
        blockstemp.filter(({ id }) => id == draggedBlock.id).y =
          draggedBlock.position().left + draggedBlock.position().height / 2 + canvas.position().scrollTop
      }

      if (!manager.isDragging && !manager.isRearranging) {
        return
      }

      var xpos = draggedBlock.position().left + draggedBlock.position().width / 2 + canvas.position().scrollLeft
      var ypos = draggedBlock.position().top + canvas.position().scrollTop

      for (var i = 0; i < blocks.length; i++) {
        const block = blocks[i]
        const indicator = canvas.indicator()
        const { x, y, width, height } = block

        if (
          xpos >= x - width / 2 - paddingX &&
          xpos <= x + width / 2 + paddingX &&
          ypos >= y - height / 2 &&
          ypos <= y + height
        ) {
          const currentBlock = canvas.findBlock(block.id)
          currentBlock.element.appendChild(indicator)

          indicator.style.left = `${draggedBlock.position().width / 2 - 5}px`
          indicator.style.top = currentBlock.position().height

          canvas.showIndicator(false)

          break
        } else if (i == blocks.length - 1) {
          canvas.showIndicator(true)
        }
      }
    }

    document.addEventListener('mousemove', flowy.moveBlock, false)
    document.addEventListener('touchmove', flowy.moveBlock, false)

    function checkOffset() {
      var widths = blocks.map(a => a.width)
      const currentOffsetLeft = Math.min(...blocks.map(({ x }, index) => x - widths[index] / 2))

      manager.setState({ currentOffsetLeft })

      if (currentOffsetLeft < canvas.position().left + window.scrollX) {
        manager.toggleLastEvent(true)

        blocks.forEach(({ id, x, width, parent }) => {
          const currentBlock = canvas.findBlock(id)

          currentBlock.styles({
            left: x - width / 2 - currentOffsetLeft + 20
          })

          if (parent === -1) {
            return
          }

          const currentArrow = currentBlock.arrow()
          const parentX = blocks.find(({ id }) => id == parent).x
          const arrowX = x - parentX

          currentArrow.styles({
            left: arrowX < 0 ? `${x - currentOffsetLeft + 20 - 5}px` : `${parentX - 20 - currentOffsetLeft + 20}px`
          })
        })

        blocks.forEach(block => {
          const currentBlock = canvas.findBlock(block.id)

          block.x =
            currentBlock.position().left +
            (canvas.position().left + canvas.position().scrollLeft) -
            manager.draggedBlock.position().width / 2 -
            40
        })

        manager.setState({ previousOffsetLeft: currentOffsetLeft })
      }
    }

    function fixOffset() {
      const { previousOffsetLeft } = manager.state

      if (previousOffsetLeft >= canvas.position().left + window.scrollX) {
        return
      }

      manager.toggleLastEvent(false)

      blocks.forEach(block => {
        const { id, x, width, parent } = block
        const currentBlock = canvas.findBlock(id)
        const currentArrow = currentBlock.arrow()

        currentBlock.styles({
          left: x - width / 2 - previousOffsetLeft - 20
        })
        block.x = currentBlock.position().left + width / 2

        if (parent === -1) {
          return
        }

        const parentX = blocks.find(({ id }) => id == parent).x
        var arrowX = x - parentX

        currentArrow.styles({
          left:
            arrowX < 0
              ? `${x - 5 - (canvas.position().left + window.scrollX)}px`
              : parentX - 20 - (canvas.position().left + window.scrollX) + 'px'
        })
      })

      manager.setState({ previousOffsetLeft: 0 })
    }

    function rearrangeMe() {
      var parents = blocks.map(({ parent }) => parent)

      for (var z = 0; z < parents.length; z++) {
        if (parents[z] == -1) {
          z++
        }

        var totalwidth = 0
        var totalremove = 0
        var maxheight = 0

        const filteredBlocks = blocks.filter(({ parent }) => parent == parents[z])

        filteredBlocks.forEach((children, w) => {
          if (blocks.filter(({ parent }) => parent == children.id).length == 0) {
            children.childwidth = 0
          }

          totalwidth += Math.max(children.childwidth, children.width)

          if (w !== filteredBlocks.length - 1) {
            totalwidth += paddingX
          }
        })

        if (parents[z] != -1) {
          blocks.find(a => a.id == parents[z]).childwidth = totalwidth
        }

        filteredBlocks.forEach(children => {
          const currentBlock = canvas.findBlock(children.id)
          const currentArrow = currentBlock.arrow()
          const r_array = blocks.filter(({ id }) => id == parents[z])

          currentBlock.styles({
            top: `${r_array.y + paddingY}px`
          })
          r_array.y = r_array.y + paddingY

          if (children.childwidth > children.width) {
            currentBlock.styles({
              left:
                r_array[0].x -
                totalwidth / 2 +
                totalremove +
                children.childwidth / 2 -
                children.width / 2 -
                (canvas.position().left + window.scrollX) +
                'px'
            })
          } else {
            currentBlock.styles({
              left: r_array[0].x - totalwidth / 2 + totalremove - (canvas.position().left + window.scrollX) + 'px'
            })
          }

          children.x = r_array[0].x - totalwidth / 2 + totalremove + Math.max(children.childwidth, children.width) / 2
          totalremove += Math.max(children.childwidth, children.width) + paddingX

          const { x, y, height } = blocks.find(({ id }) => id == children.id)
          const { x: parentX, y: parentY, height: parentHeight } = blocks.find(({ id }) => id == children.parent)
          const arrowX = x - parentX + 20
          const arrowY = y - height / 2 - (parentY + parentHeight / 2)

          currentArrow.styles({
            top: parentY + parentHeight / 2 - (canvas.position().top + window.scrollY) + 'px'
          })

          if (arrowX < 0) {
            currentArrow.styles({
              left: x - 5 - (canvas.position().left + window.scrollX) + 'px'
            })
            currentArrow.html(`
              <input type="hidden" class="arrowid" value="${children.id}">
              <svg preserveaspectratio="none" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M${parentX - x + 5}
                  0L${blocks.find(id => id.id == children.parent).x - x + 5} ${paddingY / 2}L5
                  ${paddingY / 2}L5
                  ${arrowY}" stroke="#C5CCD0" stroke-width="2px"/>
                <path d="M0
                  ${arrowY - 5}H10L5
                  ${arrowY}L0
                  ${arrowY - 5}Z" fill="#C5CCD0"/>
              </svg>
            `)
          } else {
            currentArrow.styles({
              left: parentX - 20 - (canvas.position().left + window.scrollX) + 'px'
            })
            currentArrow.html(`
              <input type="hidden" class="arrowid" value="${children.id}">
              <svg preserveaspectratio="none" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M20 0L20
                  ${paddingY / 2}L${arrowX}
                  ${paddingY / 2}L${arrowX}
                  ${arrowY}" stroke="#C5CCD0" stroke-width="2px"/>
                <path d="M${arrowX - 5}
                  ${arrowY - 5}H${arrowX + 5}L${arrowX}
                  ${arrowY}L${arrowX - 5}
                  ${arrowY - 5}Z" fill="#C5CCD0"/>
              </svg>
            `)
          }
        })
      }
    }
  }

  flowy.load()
}

export default shim
