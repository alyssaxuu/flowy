import Blocks from './Blocks'
import Dragger from './Dragger'

function shim(canvas, drag, release, snapping, spacing_x, spacing_y) {
  return flowy({
    window: window,
    document: document,
    blocksManager: new Blocks({ canvas, spacingX: spacing_x, spacingY: spacing_y, window, document }),
    dragManager: new Dragger({ window, document }),
    onBlockGrabbed: drag,
    onBlockReleased: release,
    onBlockSnapped: snapping
  })
}

function flowy({
  window,
  document,
  blocksManager,
  dragManager,
  onBlockGrabbed = void 0,
  onBlockReleased = void 0,
  onBlockSnapped = void 0
}) {
  flowy.load = function() {
    if (blocksManager.isInitialized) {
      return
    }

    var blocks = blocksManager.blocks
    var blockstemp = []
    const paddingX = blocksManager.spacingX
    const paddingY = blocksManager.spacingY

    blocksManager.initialize()
    dragManager.setState({
      currentOffsetLeft: 0,
      previousOffsetLeft: 0
    })

    flowy.import = blocksManager.import
    flowy.output = blocksManager.output
    flowy.deleteBlocks = blocksManager.reset

    flowy.beginDrag = function(event) {
      const { clientX, clientY } = event.targetTouches ? event.targetTouches[0] : event

      dragManager.setState({
        mouseX: clientX,
        mouseY: clientY
      })

      const { target, which } = event
      const grabbedElement = target.closest('.create-flowy')

      if (which === 3 || !grabbedElement) {
        return
      }

      dragManager.createDragger(grabbedElement, blocksManager)
      dragManager.toggleDragging(true)

      onBlockGrabbed(grabbedElement)
    }

    document.addEventListener('mousedown', touchblock, false)
    document.addEventListener('touchstart', touchblock, false)
    document.addEventListener('mouseup', touchblock, false)

    flowy.touchDone = () => {
      dragManager.toggleDraggingBlock(false)
    }

    document.addEventListener('mousedown', flowy.beginDrag)
    document.addEventListener('touchstart', flowy.beginDrag)

    flowy.endDrag = function(event) {
      if (event.which === 3 || !(dragManager.isDragging || dragManager.isRearranging)) {
        return
      }

      dragManager.toggleDraggingBlock(false)

      onBlockReleased()

      blocksManager.showIndicator(true)

      const { draggedBlock } = dragManager

      if (dragManager.isDragging) {
        dragManager.toggleDragger(false)
      }

      if (draggedBlock.id === 0 && dragManager.isRearranging) {
        dragManager.toggleDragger(false)
        dragManager.toggleRearranging(false)

        blockstemp.forEach(block => {
          if (block.id !== draggedBlock.id) {
            return
          }

          const currentBlock = blocksManager.findBlock(block.id)
          const currentArrow = currentBlock.arrow()

          currentBlock.styles({
            left:
              currentBlock.position().left -
              (blocksManager.position().left + window.scrollX) +
              blocksManager.position().scrollLeft,
            top:
              currentBlock.position().top -
              (blocksManager.position().top + window.scrollY) +
              blocksManager.position().scrollTop
          })

          currentArrow.styles({
            left:
              currentArrow.position().left -
              (blocksManager.position().left + window.scrollX) +
              blocksManager.position().scrollLeft,
            top:
              currentArrow.position().top - (blocksManager.position().top + blocksManager.position().scrollTop) + 'px'
          })

          blocksManager.appendChild(currentBlock.element, currentArrow.element)

          block.x =
            currentBlock.position().left + currentBlock.element.offsetWidth / 2 + blocksManager.position().scrollLeft
          block.y =
            currentBlock.position().top + currentBlock.element.offsetHeight / 2 + blocksManager.position().scrollTop
        })

        for (var w = 0; w < blockstemp.length; w++) {}

        blockstemp.find(a => a.id == 0).x = draggedBlock.position().left + draggedBlock.position().width / 2
        blockstemp.find(a => a.id == 0).y = draggedBlock.position().top + draggedBlock.position().height / 2

        blocksManager.appendBlocks(blockstemp)
        blockstemp = []
      } else if (
        dragManager.isDragging &&
        blocks.length == 0 &&
        draggedBlock.position().top > blocksManager.position().top + window.scrollY &&
        draggedBlock.position().left > blocksManager.position().left + window.scrollX
      ) {
        onBlockSnapped(draggedBlock.element, true, undefined)

        dragManager.toggleDragging(false)

        draggedBlock.styles({
          top:
            draggedBlock.position().top -
            (blocksManager.position().top + window.scrollY) +
            blocksManager.position().scrollTop +
            'px',
          left:
            draggedBlock.position().left -
            (blocksManager.position().left + window.scrollX) +
            blocksManager.position().scrollLeft +
            'px'
        })

        blocksManager.appendChild(draggedBlock.element)

        blocks.push({
          parent: -1,
          childwidth: 0,
          id: draggedBlock.id,
          x: draggedBlock.position().left + draggedBlock.position().width / 2 + blocksManager.position().scrollLeft,
          y: draggedBlock.position().top + draggedBlock.position().height / 2 + blocksManager.position().scrollTop,
          width: draggedBlock.position().width,
          height: draggedBlock.position().height
        })
      } else if (dragManager.isDragging && blocks.length == 0) {
        blocksManager.appendChild(document.querySelector('.indicator'))
        dragManager.toggleDragger(false, { remove: true })
      } else if (dragManager.isDragging || dragManager.isRearranging) {
        var xpos =
          draggedBlock.position().left + draggedBlock.position().width / 2 + blocksManager.position().scrollLeft
        var ypos = draggedBlock.position().top + blocksManager.position().scrollTop

        for (var i = 0; i < blocks.length; i++) {
          const block = blocks[i]
          const { x, y, height, width } = block

          if (
            xpos >= x - width / 2 - paddingX &&
            xpos <= x + width / 2 + paddingX &&
            ypos >= y - height / 2 &&
            ypos <= y + height
          ) {
            dragManager.toggleDragging(false)

            if (dragManager.isRearranging || onBlockSnapped(draggedBlock.element, false, block)) {
              snap(draggedBlock, block)
            }

            break
          } else if (i == blocks.length - 1) {
            if (dragManager.isRearranging) {
              dragManager.toggleRearranging(false)
              blockstemp = []
            }

            dragManager.toggleDragging(false)
            blocksManager.appendChild(document.querySelector('.indicator'))
            dragManager.toggleDragger(false, { remove: true })
          }
        }
      }
    }

    document.addEventListener('mouseup', flowy.endDrag, false)
    document.addEventListener('touchend', flowy.endDrag, false)

    function snap(draggedBlock, block) {
      if (!dragManager.isRearranging) {
        blocksManager.appendChild(draggedBlock.element)
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
        const currentBlock = blocksManager.findBlock(id)
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
          (blocksManager.position().left + window.scrollX) +
          blocksManager.position().scrollLeft +
          'px',
        top:
          blocks.find(id => id.id == block.id).y +
          blocks.find(id => id.id == block.id).height / 2 +
          paddingY -
          (blocksManager.position().top + window.scrollY) +
          'px'
      })

      if (dragManager.isRearranging) {
        const dragtemp = blockstemp.find(({ id }) => id == draggedBlock.id)
        dragtemp.x =
          draggedBlock.position().left + draggedBlock.position().width / 2 + blocksManager.position().scrollLeft * 2
        dragtemp.y =
          draggedBlock.position().top + draggedBlock.position().height / 2 + blocksManager.position().scrollTop
        dragtemp.parent = block.id

        for (var w = 0; w < blockstemp.length; w++) {
          if (parseInt(blockstemp[w].id) === draggedBlock.id) {
            continue
          }

          const currentBlock = blocksManager.findBlock(blockstemp[w].id)
          const currentArrow = currentBlock.arrow()
          const blockParent = currentBlock.element
          const arrowParent = currentArrow.element

          currentBlock.styles({
            left:
              currentBlock.position().left -
              (blocksManager.position().left + window.scrollX) +
              blocksManager.position().scrollLeft,
            top:
              currentBlock.position().top -
              (blocksManager.position().top + window.scrollY) +
              blocksManager.position().scrollTop
          })
          currentArrow.styles({
            left:
              currentArrow.position().left -
              (blocksManager.position().left + window.scrollX) +
              blocksManager.position().scrollLeft +
              20,
            top:
              currentArrow.position().top -
              (blocksManager.position().top + window.scrollY) +
              blocksManager.position().scrollTop
          })

          blocksManager.appendChild(blockParent, arrowParent)

          blockstemp[w].x =
            currentBlock.position().left + draggedBlock.position().width / 2 + blocksManager.position().scrollLeft
          blockstemp[w].y =
            currentBlock.position().top + draggedBlock.position().height / 2 + blocksManager.position().scrollTop
        }

        blocksManager.appendBlocks(blockstemp)
        blockstemp = []
      } else {
        blocks.push({
          childwidth: 0,
          parent: block.id,
          id: draggedBlock.id,
          x: draggedBlock.position().left + draggedBlock.position().width / 2 + blocksManager.position().scrollLeft,
          y: draggedBlock.position().top + draggedBlock.position().height / 2 + blocksManager.position().scrollTop,
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
          blocksManager.position().scrollTop
      )

      if (arrowX < 0) {
        blocksManager.appendHtml(`
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
          left: `${x - 5 - (blocksManager.position().left + window.scrollX) + blocksManager.position().scrollLeft}px`
        })
      } else {
        blocksManager.appendHtml(`
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
          left: `${block.x -
            20 -
            (blocksManager.position().left + window.scrollX) +
            blocksManager.position().scrollLeft}px`
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

      if (dragManager.isRearranging) {
        dragManager.toggleRearranging(false)
        dragManager.toggleDragger(false)
      }

      rearrangeMe()
      checkOffset()
    }

    function touchblock(event) {
      dragManager.toggleDraggingBlock(false)

      if (!hasParentClass(event.target, 'block')) {
        return
      }

      var theblock = event.target.closest('.block')

      const { clientX, clientY } = event.targetTouches ? event.targetTouches[0] : event

      dragManager.setState({
        mouseX: clientX,
        mouseY: clientY
      })

      if (
        event.type !== 'mouseup' &&
        hasParentClass(event.target, 'block') &&
        event.which != 3 &&
        !dragManager.isDragging &&
        !dragManager.isRearranging
      ) {
        dragManager.toggleDraggingBlock(true)
        dragManager.registerDragger(theblock)

        const { draggedBlock } = dragManager

        dragManager.setState({
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

      dragManager.setState({
        mouseX: clientX,
        mouseY: clientY
      })

      const { draggedBlock } = dragManager

      if (dragManager.isDraggingBlock) {
        dragManager.toggleRearranging(true)
        dragManager.toggleDragger(true)

        var blockid = draggedBlock.id
        blockstemp.push(blocks.find(({ id }) => id == blockid))
        blocksManager.replaceBlocks(blocks.filter(({ id }) => id != blockid))

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

            const currentBlock = blocksManager.findBlock(block.id)
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
          blocksManager.replaceBlocks(blocks.filter(({ id }) => id != blocknumber))
        })

        allids.forEach(blocknumber => {
          blocksManager.replaceBlocks(blocks.filter(({ id }) => id != blocknumber))
        })

        if (blocks.length > 1) {
          rearrangeMe()
        }

        if (dragManager.isLastEvent) {
          fixOffset()
        }

        dragManager.toggleDraggingBlock(false)
      }

      const { dragX, dragY } = dragManager.state

      if (dragManager.isDragging) {
        draggedBlock.styles({
          left: `${clientX - dragX}px`,
          top: `${clientY - dragY}px`
        })
      } else if (dragManager.isRearranging) {
        draggedBlock.styles({
          left: `${clientX -
            dragX -
            (blocksManager.position().left + window.scrollX) +
            blocksManager.position().scrollLeft}px`,
          top: `${clientY -
            dragY -
            (blocksManager.position().top + window.scrollY) +
            blocksManager.position().scrollTop}px`
        })

        // TODO: Doesn't look like setting `x` and `y` does anything here - remove?
        blockstemp.filter(({ id }) => id == draggedBlock.id).x =
          draggedBlock.position().left + draggedBlock.position().width / 2 + blocksManager.position().scrollLeft
        blockstemp.filter(({ id }) => id == draggedBlock.id).y =
          draggedBlock.position().left + draggedBlock.position().height / 2 + blocksManager.position().scrollTop
      }

      if (!dragManager.isDragging && !dragManager.isRearranging) {
        return
      }

      var xpos = draggedBlock.position().left + draggedBlock.position().width / 2 + blocksManager.position().scrollLeft
      var ypos = draggedBlock.position().top + blocksManager.position().scrollTop

      for (var i = 0; i < blocks.length; i++) {
        const block = blocks[i]
        const indicator = blocksManager.indicator()
        const { x, y, width, height } = block

        if (
          xpos >= x - width / 2 - paddingX &&
          xpos <= x + width / 2 + paddingX &&
          ypos >= y - height / 2 &&
          ypos <= y + height
        ) {
          const currentBlock = blocksManager.findBlock(block.id)
          currentBlock.element.appendChild(indicator)

          indicator.style.left = `${draggedBlock.position().width / 2 - 5}px`
          indicator.style.top = currentBlock.position().height

          blocksManager.showIndicator(false)

          break
        } else if (i == blocks.length - 1) {
          blocksManager.showIndicator(true)
        }
      }
    }

    document.addEventListener('mousemove', flowy.moveBlock, false)
    document.addEventListener('touchmove', flowy.moveBlock, false)

    function checkOffset() {
      var widths = blocks.map(a => a.width)
      const currentOffsetLeft = Math.min(...blocks.map(({ x }, index) => x - widths[index] / 2))

      dragManager.setState({ currentOffsetLeft })

      if (currentOffsetLeft < blocksManager.position().left + window.scrollX) {
        dragManager.toggleLastEvent(true)

        blocks.forEach(({ id, x, width, parent }) => {
          const currentBlock = blocksManager.findBlock(id)

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
          const currentBlock = blocksManager.findBlock(block.id)

          block.x =
            currentBlock.position().left +
            (blocksManager.position().left + blocksManager.position().scrollLeft) -
            dragManager.draggedBlock.position().width / 2 -
            40
        })

        dragManager.setState({ previousOffsetLeft: currentOffsetLeft })
      }
    }

    function fixOffset() {
      const { previousOffsetLeft } = dragManager.state

      if (previousOffsetLeft >= blocksManager.position().left + window.scrollX) {
        return
      }

      dragManager.toggleLastEvent(false)

      blocks.forEach(block => {
        const { id, x, width, parent } = block
        const currentBlock = blocksManager.findBlock(id)
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
              ? `${x - 5 - (blocksManager.position().left + window.scrollX)}px`
              : parentX - 20 - (blocksManager.position().left + window.scrollX) + 'px'
        })
      })

      dragManager.setState({ previousOffsetLeft: 0 })
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
          const currentBlock = blocksManager.findBlock(children.id)
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
                (blocksManager.position().left + window.scrollX) +
                'px'
            })
          } else {
            currentBlock.styles({
              left:
                r_array[0].x - totalwidth / 2 + totalremove - (blocksManager.position().left + window.scrollX) + 'px'
            })
          }

          children.x = r_array[0].x - totalwidth / 2 + totalremove + Math.max(children.childwidth, children.width) / 2
          totalremove += Math.max(children.childwidth, children.width) + paddingX

          const { x, y, height } = blocks.find(({ id }) => id == children.id)
          const { x: parentX, y: parentY, height: parentHeight } = blocks.find(({ id }) => id == children.parent)
          const arrowX = x - parentX + 20
          const arrowY = y - height / 2 - (parentY + parentHeight / 2)

          currentArrow.styles({
            top: parentY + parentHeight / 2 - (blocksManager.position().top + window.scrollY) + 'px'
          })

          if (arrowX < 0) {
            currentArrow.styles({
              left: x - 5 - (blocksManager.position().left + window.scrollX) + 'px'
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
              left: parentX - 20 - (blocksManager.position().left + window.scrollX) + 'px'
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
