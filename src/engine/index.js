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

        for (var w = 0; w < blockstemp.length; w++) {
          if (blockstemp[w].id != draggedBlock.id) {
            const currentBlock = blocksManager.findBlock(blockstemp[w].id)
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

            blockstemp[w].x =
              currentBlock.position().left + currentBlock.element.offsetWidth / 2 + blocksManager.position().scrollLeft
            blockstemp[w].y =
              currentBlock.position().top + currentBlock.element.offsetHeight / 2 + blocksManager.position().scrollTop
          }
        }

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
        var blocko = blocks.map(a => a.id)

        for (var i = 0; i < blocks.length; i++) {
          const { x, y, height, width } = blocks.find(a => a.id == blocko[i])

          if (
            xpos >= x - width / 2 - paddingX &&
            xpos <= x + width / 2 + paddingX &&
            ypos >= y - height / 2 &&
            ypos <= y + height
          ) {
            dragManager.toggleDragging(false)

            if (
              dragManager.isRearranging ||
              onBlockSnapped(
                draggedBlock.element,
                false,
                blocks.find(id => id.id == blocko[i])
              )
            ) {
              snap(draggedBlock, i, blocko)
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

    function snap(draggedBlock, i, blocko) {
      if (!dragManager.isRearranging) {
        blocksManager.appendChild(draggedBlock.element)
      }

      var totalwidth = 0
      var totalremove = 0
      var maxheight = 0

      const snapBlocks = blocks.filter(({ parent }) => parent == blocko[i])

      for (var w = 0; w < snapBlocks.length; w++) {
        var { childwidth, width } = snapBlocks[w]
        totalwidth += Math.max(childwidth, width) + paddingX
      }

      totalwidth += draggedBlock.position().width

      for (var w = 0; w < snapBlocks.length; w++) {
        const children = snapBlocks[w]
        const { id, childwidth, width } = children
        const currentBlock = blocksManager.findBlock(id)
        const { x } = blocks.find(({ id }) => id == blocko[i])

        if (childwidth > width) {
          currentBlock.styles({
            left: x - totalwidth / 2 + totalremove + childwidth / 2 - width / 2 + 'px'
          })
          children.x = blocks.find(id => id.parent == blocko[i]).x - totalwidth / 2 + totalremove + childwidth / 2
        } else {
          currentBlock.styles({
            left: x - totalwidth / 2 + totalremove + 'px'
          })
          children.x = blocks.find(({ parent }) => parent == blocko[i]).x - totalwidth / 2 + totalremove + width / 2
        }

        totalremove += Math.max(childwidth, width) + paddingX
      }

      draggedBlock.styles({
        left:
          blocks.find(id => id.id == blocko[i]).x -
          totalwidth / 2 +
          totalremove -
          (blocksManager.position().left + window.scrollX) +
          blocksManager.position().scrollLeft +
          'px',
        top:
          blocks.find(id => id.id == blocko[i]).y +
          blocks.find(id => id.id == blocko[i]).height / 2 +
          paddingY -
          (blocksManager.position().top + window.scrollY) +
          'px'
      })

      if (dragManager.isRearranging) {
        blockstemp.find(a => a.id == draggedBlock.id).x =
          draggedBlock.position().left + draggedBlock.position().width / 2 + blocksManager.position().scrollLeft * 2
        blockstemp.find(a => a.id == draggedBlock.id).y =
          draggedBlock.position().top + draggedBlock.position().height / 2 + blocksManager.position().scrollTop
        blockstemp.find(({ id }) => id == draggedBlock.id).parent = blocko[i]

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
          parent: blocko[i],
          id: draggedBlock.id,
          x: draggedBlock.position().left + draggedBlock.position().width / 2 + blocksManager.position().scrollLeft,
          y: draggedBlock.position().top + draggedBlock.position().height / 2 + blocksManager.position().scrollTop,
          width: draggedBlock.position().width,
          height: draggedBlock.position().height
        })
      }

      var { x, y, height } = blocks.find(({ id }) => id == draggedBlock.id)
      var arrowX = x - blocks.find(({ id }) => id == blocko[i]).x + 20
      var arrowY = parseFloat(
        y -
          height / 2 -
          (blocks.find(({ parent }) => parent == blocko[i]).y +
            blocks.find(({ parent }) => parent == blocko[i]).height / 2) +
          blocksManager.position().scrollTop
      )

      if (arrowX < 0) {
        blocksManager.appendHtml(`
          <div class="arrowblock">
            <input type="hidden" class="arrowid" value="${draggedBlock.id}">
            <svg preserveaspectratio="none" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="
                M${blocks.find(a => a.id == blocko[i]).x - x + 5}
                0L${blocks.find(a => a.id == blocko[i]).x - x + 5}
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
          left: `${blocks.find(({ id }) => id == blocko[i]).x -
            20 -
            (blocksManager.position().left + window.scrollX) +
            blocksManager.position().scrollLeft}px`
        })
      }
      draggedBlock.arrow().styles({
        top: `${blocks.find(({ id }) => id == blocko[i]).y + blocks.find(({ id }) => id == blocko[i]).height / 2}px`
      })

      if (blocks.find(({ id }) => id == blocko[i]).parent != -1) {
        var flag = false
        var idval = blocko[i]

        while (!flag) {
          if (blocks.find(({ id }) => id == idval).parent == -1) {
            flag = true
          } else {
            var zwidth = 0

            for (var w = 0; w < blocks.filter(id => id.parent == idval).length; w++) {
              var children = blocks.filter(id => id.parent == idval)[w]

              zwidth += Math.max(children.childwidth, children.width)

              if (w !== blocks.filter(id => id.parent == idval).length - 1) {
                zwidth += paddingX
              }
            }

            blocks.find(({ id }) => id == idval).childwidth = zwidth
            idval = blocks.find(({ id }) => id == idval).parent
          }
        }

        blocks.find(id => id.id == idval).childwidth = totalwidth
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

        var layer = blocks.filter(a => a.parent == blockid)
        var flag = false
        var foundids = []
        var allids = []

        while (!flag) {
          for (var i = 0; i < layer.length; i++) {
            // TODO: layer[i] should be layer[i].id
            if (layer[i] == blockid) {
              continue
            }

            blockstemp.push(blocks.find(a => a.id == layer[i].id))
            const currentBlock = blocksManager.findBlock(layer[i].id)
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
            foundids.push(layer[i].id)
            allids.push(layer[i].id)
          }

          if (foundids.length == 0) {
            flag = true
          } else {
            layer = blocks.filter(a => foundids.includes(a.parent))
            foundids = []
          }
        }

        for (var i = 0; i < blocks.filter(a => a.parent == blockid).length; i++) {
          var blocknumber = blocks.filter(a => a.parent == blockid)[i]
          blocksManager.replaceBlocks(blocks.filter(({ id }) => id != blocknumber))
        }

        for (var i = 0; i < allids.length; i++) {
          var blocknumber = allids[i]
          blocksManager.replaceBlocks(blocks.filter(({ id }) => id != blocknumber))
        }

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
      var blocko = blocks.map(({ id }) => id)

      for (var i = 0; i < blocks.length; i++) {
        const indicator = document.querySelector('.indicator')
        const { x, y, width, height } = blocks.find(({ id }) => id == blocko[i])

        if (
          xpos >= x - width / 2 - paddingX &&
          xpos <= x + width / 2 + paddingX &&
          ypos >= y - height / 2 &&
          ypos <= y + height
        ) {
          const currentBlock = blocksManager.findBlock(blocko[i])
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
        var blocko = blocks.map(a => a.id)

        for (var w = 0; w < blocks.length; w++) {
          const { id, x, width, parent } = blocks.find(({ id }) => id == blocko[w])
          const currentBlock = blocksManager.findBlock(id)
          const currentArrow = currentBlock.arrow()

          currentBlock.styles({
            left: x - width / 2 - currentOffsetLeft + 20
          })

          if (parent != -1) {
            var parentX = blocks.find(({ id }) => id == parent).x
            var arrowX = x - parentX

            currentArrow.styles({
              left: arrowX < 0 ? `${x - currentOffsetLeft + 20 - 5}px` : `${parentX - 20 - currentOffsetLeft + 20}px`
            })
          }
        }

        for (var w = 0; w < blocks.length; w++) {
          const currentBlock = blocksManager.findBlock(blocks[w].id)

          blocks[w].x =
            currentBlock.position().left +
            (blocksManager.position().left + blocksManager.position().scrollLeft) -
            draggedBlock.position().width / 2 -
            40
        }

        dragManager.setState({ previousOffsetLeft: currentOffsetLeft })
      }
    }

    function fixOffset() {
      const { previousOffsetLeft } = dragManager.state

      if (previousOffsetLeft >= blocksManager.position().left + window.scrollX) {
        return
      }

      dragManager.toggleLastEvent(false)
      var blocko = blocks.map(a => a.id)

      for (var w = 0; w < blocks.length; w++) {
        var arrowhelp = blocks.find(({ id }) => id == blocko[w])
        const { id, x, width, parent } = arrowhelp
        const currentBlock = blocksManager.findBlock(id)
        const currentArrow = currentBlock.arrow()

        currentBlock.styles({
          left: x - width / 2 - previousOffsetLeft - 20
        })
        arrowhelp.x = currentBlock.position().left + width / 2

        if (parent != -1) {
          const parentX = blocks.find(({ id }) => id == parent).x
          var arrowX = x - parentX

          currentArrow.styles({
            left:
              arrowX < 0
                ? `${x - 5 - (blocksManager.position().left + window.scrollX)}px`
                : parentX - 20 - (blocksManager.position().left + window.scrollX) + 'px'
          })
        }
      }

      dragManager.setState({ previousOffsetLeft: 0 })
    }

    function rearrangeMe() {
      var result = blocks.map(a => a.parent)

      for (var z = 0; z < result.length; z++) {
        if (result[z] == -1) {
          z++
        }

        var totalwidth = 0
        var totalremove = 0
        var maxheight = 0

        for (var w = 0; w < blocks.filter(id => id.parent == result[z]).length; w++) {
          var children = blocks.filter(id => id.parent == result[z])[w]

          if (blocks.filter(id => id.parent == children.id).length == 0) {
            children.childwidth = 0
          }

          totalwidth += Math.max(children.childwidth, children.width)

          if (w !== blocks.filter(id => id.parent == result[z]).length - 1) {
            totalwidth += paddingX
          }
        }

        if (result[z] != -1) {
          blocks.find(a => a.id == result[z]).childwidth = totalwidth
        }

        for (var w = 0; w < blocks.filter(({ parent }) => parent == result[z]).length; w++) {
          const children = blocks.filter(({ parent }) => parent == result[z])[w]
          const currentBlock = blocksManager.findBlock(children.id)
          const currentArrow = currentBlock.arrow()
          const r_block = currentBlock.element
          const r_array = blocks.filter(({ id }) => id == result[z])
          r_block.style.top = `${r_array.y + paddingY}px`
          r_array.y = r_array.y + paddingY

          if (children.childwidth > children.width) {
            r_block.style.left =
              r_array[0].x -
              totalwidth / 2 +
              totalremove +
              children.childwidth / 2 -
              children.width / 2 -
              (blocksManager.position().left + window.scrollX) +
              'px'
            children.x = r_array[0].x - totalwidth / 2 + totalremove + children.childwidth / 2
            totalremove += children.childwidth + paddingX
          } else {
            r_block.style.left =
              r_array[0].x - totalwidth / 2 + totalremove - (blocksManager.position().left + window.scrollX) + 'px'
            children.x = r_array[0].x - totalwidth / 2 + totalremove + children.width / 2
            totalremove += children.width + paddingX
          }

          const { x, y, height } = blocks.find(({ id }) => id == children.id)
          const { x: parentX, y: parentY, height: parentHeight } = blocks.find(({ id }) => id == children.parent)
          const arrowX = x - parentX + 20
          const arrowY =
            y -
            height / 2 -
            (blocks.find(a => a.id == children.parent).y + blocks.find(a => a.id == children.parent).height / 2)

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
        }
      }
    }
  }

  flowy.load()
}

export default shim
