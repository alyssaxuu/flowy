import Canvas from './Canvas'

let loaded = false

function shim(canvas, onGrab, onRelease, onSnap, spacingX, spacingY) {
  return flowy({
    document: document,
    canvas: new Canvas({ node: canvas, spacingX, spacingY, window, document }),
    onGrab,
    onRelease,
    onSnap
  })
}

function flowy({ document, canvas, onGrab = void 0, onRelease = void 0, onSnap = void 0 }) {
  // NOTE: set callbacks even when initialized to allow React rerenders
  flowy.onGrab = onGrab
  flowy.onRelease = onRelease
  flowy.onSnap = onSnap

  if (loaded) {
    return
  }

  loaded = true

  canvas.initialize()
  canvas.setState({
    currentOffsetLeft: 0,
    previousOffsetLeft: 0
  })

  const handleCoordinates = event => {
    const { clientX, clientY } = event.targetTouches ? event.targetTouches[0] : event
    return canvas.setState({
      mouseX: clientX,
      mouseY: clientY
    })
  }

  flowy.import = canvas.import
  flowy.output = canvas.output
  flowy.deleteBlocks = canvas.reset

  flowy.beginDrag = function(event) {
    handleCoordinates(event)

    const { target, which } = event
    const grabbedNode = target.closest('.create-flowy')

    if (which === 3 || !grabbedNode) {
      return
    }

    canvas.grab(grabbedNode)
    canvas.toggleDragging(true)

    flowy.onGrab(grabbedNode)
  }

  document.addEventListener('mousedown', touchblock, false)
  document.addEventListener('touchstart', touchblock, false)
  document.addEventListener('mouseup', touchblock, false)

  flowy.touchDone = () => {
    canvas.toggleDraggingBlock(false)
  }

  document.addEventListener('mousedown', flowy.beginDrag)
  document.addEventListener('touchstart', flowy.beginDrag)

  flowy.endDrag = function(event) {
    if (event.which === 3 || !(canvas.isDragging || canvas.isRearranging)) {
      return
    }

    canvas.toggleDraggingBlock(false)

    flowy.onRelease()

    canvas.showIndicator(false)

    const { draggedElement } = canvas

    if (canvas.isDragging) {
      canvas.toggleDragger(false)
    }

    if (draggedElement.id === 0 && canvas.isRearranging) {
      canvas.toggleDragger(false)
      canvas.toggleRearranging(false)
      canvas.ungroupDraggedTree()
    } else if (canvas.isDragging && canvas.blocks.length == 0) {
      if (canvas.inDropZone()) {
        flowy.onSnap(draggedElement.node, true, undefined)

        canvas.toggleDragging(false)
        canvas.drop()
      } else {
        canvas.cancelDrop()
      }
    } else if (canvas.isDragging || canvas.isRearranging) {
      const snapped = canvas.blocks.find((block, i) => {
        if (canvas.inSnapZoneFor(block)) {
          canvas.toggleDragging(false)

          if (canvas.isRearranging || flowy.onSnap(draggedElement.node, false, block)) {
            snap(block)
          }

          return true
        }
      })

      if (!snapped) {
        if (canvas.isRearranging) {
          canvas.toggleRearranging(false)
          // TODO: Determine if we need to do more than clear out `draggedTree`
          // blocksTemp = []
          canvas.draggedTree.splice(0)
        }

        canvas.toggleDragging(false)
        canvas.cancelDrop()
      }
    }
  }

  document.addEventListener('mouseup', flowy.endDrag, false)
  document.addEventListener('touchend', flowy.endDrag, false)

  function snap(block) {
    const { draggedElement } = canvas
    if (!canvas.isRearranging) {
      // TODO: replace with `canvas.drop()`?
      canvas.appendChild(draggedElement.node)
    }

    var totalRemove = 0

    const childBlocks = canvas.findChildBlocks(block.id)

    const totalWidth = childBlocks.reduce(
      (total, { maxWidth }) => total + maxWidth + canvas.spacingX,
      canvas.draggedElement.position().width
    )

    childBlocks.forEach(childBlock => {
      const { id, childWidth, width, maxWidth } = childBlock
      const childElement = canvas.findBlockElement(id)
      let left = block.x - totalWidth / 2 + totalRemove

      childBlock.x = left + maxWidth / 2 + 200
      totalRemove += maxWidth + canvas.spacingX

      if (childWidth > width) {
        left += childWidth / 2 - width / 2
      }

      childElement.styles({ left })
    })

    const { top, left, scrollTop, scrollLeft } = canvas.position()

    canvas.draggedElement.styles({
      left: block.x - totalWidth / 2 + totalRemove - left + scrollLeft,
      top: block.y + block.height / 2 + canvas.spacingY - top
    })

    if (canvas.isRearranging) {
      const { height, width } = draggedElement.position()
      const draggedTreeBlock = canvas.findBlock(draggedElement.id, { tree: true })

      draggedTreeBlock.x = draggedElement.position().left + width / 2 + scrollLeft * 2
      draggedTreeBlock.y = draggedElement.position().top + height / 2 + scrollTop
      draggedTreeBlock.parent = block.id

      canvas.draggedTree.forEach(treeBlock => {
        if (treeBlock.id === draggedElement.id) {
          return
        }

        const blockElement = canvas.findBlockElement(treeBlock.id)
        const arrowElement = blockElement.arrow()
        const blockParent = blockElement.node
        const arrowParent = arrowElement.node

        blockElement.styles({
          left: blockElement.position().left - left + scrollLeft,
          top: blockElement.position().top - top + scrollTop
        })
        arrowElement.styles({
          left: arrowElement.position().left - left + scrollLeft + 20,
          top: arrowElement.position().top - top + scrollTop
        })

        canvas.appendChild(blockParent, arrowParent)

        treeBlock.x = blockElement.position().left + width / 2 + scrollLeft
        treeBlock.y = blockElement.position().top + height / 2 + scrollTop
      })

      canvas.appendBlocks(canvas.draggedTree)
      canvas.draggedTree.splice(0)
    } else {
      canvas.addBlockForElement(draggedElement, { parent: block.id })
    }

    const draggedBlock = canvas.findBlock(draggedElement.id)
    const { x, y, height } = draggedBlock
    const arrowX = x - block.x + 20
    // TODO: should this be using the first match?
    const arrowY = parseFloat(
      y -
        height / 2 -
        (canvas.blocks.find(({ parent }) => parent == block.id).y +
          canvas.blocks.find(({ parent }) => parent == block.id).height / 2) +
        scrollTop
    )

    if (arrowX < 0) {
      canvas.appendHtml(`
        <div class="arrowblock">
          <input type="hidden" class="arrowid" value="${draggedElement.id}">
          <svg preserveaspectratio="none" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="
              M ${block.x - x + 5} 0
              L ${block.x - x + 5} ${canvas.spacingY / 2}
              L 5 ${canvas.spacingY / 2}
              L 5 ${arrowY}" stroke="#C5CCD0" stroke-width="2px"/>
            <path d="
              M 0 ${arrowY - 5}
              H 10
              L 5 ${arrowY}
              L 0 ${arrowY - 5}
              Z" fill="#C5CCD0"/>
          </svg>
        </div>
      `)
      draggedElement.arrow().styles({
        left: x - 5 - left + scrollLeft
      })
    } else {
      canvas.appendHtml(`
        <div class="arrowblock">
          <input type="hidden" class="arrowid" value="${draggedElement.id}">
          <svg preserveaspectratio="none" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="
              M 20 0
              L 20 ${canvas.spacingY / 2}
              L ${arrowX} ${canvas.spacingY / 2}
              L ${arrowX} ${arrowY}" stroke="#C5CCD0" stroke-width="2px"/>
            <path d="
              M ${arrowX - 5} ${arrowY - 5}
              H ${arrowX + 5}
              L ${arrowX} ${arrowY}
              L ${arrowX - 5} ${arrowY - 5}
              Z" fill="#C5CCD0"/>
          </svg>
        </div>
      `)
      draggedElement.arrow().styles({
        left: block.x - 20 - left + scrollLeft
      })
    }
    draggedElement.arrow().styles({
      top: block.y + block.height / 2
    })

    if (block.parent != -1) {
      let loopBlock = block

      do {
        const children = canvas.blocks.filter(({ parent }) => parent == loopBlock.id)

        loopBlock.childWidth = children.reduce((zwidth, { maxWidth }, w) => {
          // skip one item
          if (w !== 0) {
            zwidth += canvas.spacingX
          }
          return zwidth + maxWidth
        }, 0)

        loopBlock = canvas.blocks.find(({ id }) => id == loopBlock.parent)
      } while (loopBlock.parent != -1)

      loopBlock.childWidth = totalWidth
    }

    if (canvas.isRearranging) {
      canvas.toggleRearranging(false)
      canvas.toggleDragger(false)
    }

    rearrangeMe()
    checkOffset()
  }

  function touchblock(event) {
    canvas.toggleDraggingBlock(false)

    if (!hasParentClass(event.target, 'block')) {
      return
    }

    var theblock = event.target.closest('.block')

    const { mouseX, mouseY } = handleCoordinates(event)

    if (
      event.type !== 'mouseup' &&
      hasParentClass(event.target, 'block') &&
      event.which != 3 &&
      !canvas.isDragging &&
      !canvas.isRearranging
    ) {
      canvas.toggleDraggingBlock(true)
      canvas.registerDragger(theblock)

      const { draggedElement } = canvas

      canvas.setState({
        dragX: mouseX - draggedElement.position().left,
        dragY: mouseY - draggedElement.position().top
      })
    }
  }

  function hasParentClass(node, classname) {
    if (node.className && node.className.split(' ').indexOf(classname) >= 0) {
      return true
    }

    return node.parentNode && hasParentClass(node.parentNode, classname)
  }

  flowy.moveBlock = function(event) {
    handleCoordinates(event)

    const { draggedElement } = canvas

    if (canvas.isDraggingBlock) {
      canvas.toggleRearranging(true)
      canvas.toggleDragger(true)
      canvas.groupDraggedTree()

      if (canvas.blocks.length > 1) {
        rearrangeMe()
      }

      if (canvas.isLastEvent) {
        fixOffset()
      }

      canvas.toggleDraggingBlock(false)
    }

    if (canvas.isDragging) {
      canvas.updateDragPosition()
    } else if (canvas.isRearranging) {
      canvas.updateRearrangePosition()

      // TODO: Doesn't look like setting `x` and `y` does anything here - remove?
      canvas.draggedTree.filter(({ id }) => id == draggedElement.id).x =
        draggedElement.position().left + draggedElement.position().width / 2 + canvas.position().scrollLeft
      canvas.draggedTree.filter(({ id }) => id == draggedElement.id).y =
        draggedElement.position().left + draggedElement.position().height / 2 + canvas.position().scrollTop
    }

    if (!canvas.isDragging && !canvas.isRearranging) {
      return
    }

    const snapped = canvas.blocks.find((block, i) => {
      if (canvas.inSnapZoneFor(block)) {
        canvas.showIndicator(true, block)

        return true
      }
    })

    if (!snapped) {
      canvas.showIndicator(false)
    }
  }

  document.addEventListener('mousemove', flowy.moveBlock, false)
  document.addEventListener('touchmove', flowy.moveBlock, false)

  function checkOffset() {
    var widths = canvas.blocks.map(({ width }) => width)
    const currentOffsetLeft = Math.min(...canvas.blocks.map(({ x }, index) => x - widths[index] / 2))

    canvas.setState({ currentOffsetLeft })

    if (currentOffsetLeft < canvas.position().left) {
      canvas.toggleLastEvent(true)

      canvas.blocks.forEach(({ id, x, width, parent }) => {
        const blockElement = canvas.findBlockElement(id)

        blockElement.styles({
          left: x - width / 2 - currentOffsetLeft + 20
        })

        if (parent === -1) {
          return
        }

        const arrowElement = blockElement.arrow()
        const parentX = canvas.blocks.find(({ id }) => id == parent).x
        const arrowX = x - parentX

        arrowElement.styles({
          left: arrowX < 0 ? x - currentOffsetLeft + 20 - 5 : parentX - 20 - currentOffsetLeft + 20
        })
      })

      canvas.blocks.forEach(block => {
        const blockElement = canvas.findBlockElement(block.id)

        block.x =
          blockElement.position().left +
          (canvas.position().left + canvas.position().scrollLeft) -
          canvas.draggedElement.position().width / 2 -
          40
      })

      canvas.setState({ previousOffsetLeft: currentOffsetLeft })
    }
  }

  function fixOffset() {
    const { previousOffsetLeft } = canvas.state

    if (previousOffsetLeft >= canvas.position().left) {
      return
    }

    canvas.toggleLastEvent(false)

    canvas.blocks.forEach(block => {
      const { id, x, width, parent } = block
      const blockElement = canvas.findBlockElement(id)
      const arrowElement = blockElement.arrow()

      blockElement.styles({
        left: x - width / 2 - previousOffsetLeft - 20
      })
      block.x = blockElement.position().left + width / 2

      if (parent === -1) {
        return
      }

      const parentX = canvas.blocks.find(({ id }) => id == parent).x
      var arrowX = x - parentX

      arrowElement.styles({
        left: arrowX < 0 ? x - 5 - canvas.position().left : parentX - 20 - canvas.position().left
      })
    })

    canvas.setState({ previousOffsetLeft: 0 })
  }

  function rearrangeMe() {
    var parents = canvas.blocks.map(({ parent }) => parent)

    for (var z = 0; z < parents.length; z++) {
      if (parents[z] == -1) {
        z++
      }

      var totalRemove = 0

      const parentBlock = canvas.findBlock(parents[z])
      const childBlocks = canvas.findChildBlocks(parents[z])

      var totalWidth = childBlocks.reduce((total, block, i) => {
        if (canvas.findChildBlocks(block.id).length == 0) {
          block.childWidth = 0
        }
        // skip one item
        if (i !== 0) {
          total += canvas.spacingX
        }

        return total + block.maxWidth
      }, 0)

      if (parents[z] != -1) {
        parentBlock.childWidth = totalWidth
      }

      const { left, top } = canvas.position()

      childBlocks.forEach(block => {
        const blockElement = canvas.findBlockElement(block.id)
        const arrowElement = blockElement.arrow()

        // blockElement.styles({
        //   top: parentBlock.y + canvas.spacingY + 'px'
        // })

        // parentBlock.y = parentBlock.y + canvas.spacingY

        if (block.childWidth > block.width) {
          blockElement.styles({
            left: parentBlock.x - totalWidth / 2 + totalRemove + block.childWidth / 2 - block.width / 2 - left + 'px'
          })
        } else {
          blockElement.styles({
            left: parentBlock.x - totalWidth / 2 + totalRemove - left + 'px'
          })
        }

        block.x = parentBlock.x - totalWidth / 2 + totalRemove + block.maxWidth / 2
        totalRemove += block.maxWidth + canvas.spacingX

        const parent = canvas.findBlock(block.parent)
        const { x: parentX, y: parentY, height: parentHeight } = parent
        const { x, y, height } = canvas.blocks.find(({ id }) => id == block.id)
        const arrowX = x - parentX + 20
        const arrowY = y - height / 2 - (parentY + parentHeight / 2)

        arrowElement.styles({
          top: parentY + parentHeight / 2 - top
        })

        if (arrowX < 0) {
          arrowElement.styles({
            left: x - 5 - left
          })
          arrowElement.html(`
            <input type="hidden" class="arrowid" value="${block.id}">
            <svg preserveaspectratio="none" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="
                M ${parentX - x + 5} 0
                L ${parent.x - x + 5} ${canvas.spacingY / 2}
                L 5 ${canvas.spacingY / 2}
                L 5 ${arrowY}" stroke="#C5CCD0" stroke-width="2px"/>
              <path d="
                M 0 ${arrowY - 5}
                H 10
                L 5 ${arrowY}
                L 0 ${arrowY - 5}
                Z" fill="#C5CCD0"/>
            </svg>
          `)
        } else {
          arrowElement.styles({
            left: parentX - 20 - left
          })
          arrowElement.html(`
            <input type="hidden" class="arrowid" value="${block.id}">
            <svg preserveaspectratio="none" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="
                M 20 0
                L 20 ${canvas.spacingY / 2}
                L ${arrowX} ${canvas.spacingY / 2}
                L ${arrowX} ${arrowY}" stroke="#C5CCD0" stroke-width="2px"/>
              <path d="
                M ${arrowX - 5} ${arrowY - 5}
                H ${arrowX + 5}
                L ${arrowX} ${arrowY}
                L ${arrowX - 5} ${arrowY - 5}
                Z" fill="#C5CCD0"/>
            </svg>
          `)
        }
      })
    }
  }
}

export default shim
