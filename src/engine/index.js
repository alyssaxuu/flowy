import Canvas from './Canvas'

let loaded = false

function shim(canvas, drag, release, snapping, spacing_x, spacing_y) {
  return flowy({
    document: document,
    canvas: new Canvas({ node: canvas, spacingX: spacing_x, spacingY: spacing_y, window, document }),
    onBlockGrabbed: drag,
    onBlockReleased: release,
    onBlockSnapped: snapping
  })
}

function flowy({ document, canvas, onBlockGrabbed = void 0, onBlockReleased = void 0, onBlockSnapped = void 0 }) {
  // NOTE: set callbacks even when initialized to allow React rerenders
  flowy.onBlockGrabbed = onBlockGrabbed
  flowy.onBlockReleased = onBlockReleased
  flowy.onBlockSnapped = onBlockSnapped

  if (loaded) {
    return
  }

  loaded = true

  var blocks = canvas.blocks
  var blocksTemp = []
  const paddingX = canvas.spacingX
  const paddingY = canvas.spacingY

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

    canvas.createDragger(grabbedNode)
    canvas.toggleDragging(true)

    flowy.onBlockGrabbed(grabbedNode)
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

    flowy.onBlockReleased()

    canvas.showIndicator(true)

    const { draggedElement } = canvas

    if (canvas.isDragging) {
      canvas.toggleDragger(false)
    }

    if (draggedElement.id === 0 && canvas.isRearranging) {
      canvas.toggleDragger(false)
      canvas.toggleRearranging(false)

      blocksTemp.forEach(block => {
        if (block.id == draggedElement.id) {
          return
        }

        const blockElement = canvas.findBlockElement(block.id)
        const arrowElement = blockElement.arrow()

        blockElement.styles({
          left: blockElement.position().left - canvas.position().left + canvas.position().scrollLeft,
          top: blockElement.position().top - canvas.position().top + canvas.position().scrollTop
        })

        arrowElement.styles({
          left: arrowElement.position().left - canvas.position().left + canvas.position().scrollLeft,
          top: arrowElement.position().top - (canvas.position().top + canvas.position().scrollTop)
        })

        canvas.appendChild(blockElement.node, arrowElement.node)

        block.x = blockElement.position().left + blockElement.node.offsetWidth / 2 + canvas.position().scrollLeft
        block.y = blockElement.position().top + blockElement.node.offsetHeight / 2 + canvas.position().scrollTop
      })

      const firstBlock = blocksTemp.find(({ id }) => id == 0)

      firstBlock.x = draggedElement.position().left + draggedElement.position().width / 2
      firstBlock.y = draggedElement.position().top + draggedElement.position().height / 2

      canvas.appendBlocks(blocksTemp)
      blocksTemp = []
    } else if (
      canvas.isDragging &&
      blocks.length == 0 &&
      draggedElement.position().top > canvas.position().top &&
      draggedElement.position().left > canvas.position().left
    ) {
      flowy.onBlockSnapped(draggedElement.node, true, undefined)

      canvas.toggleDragging(false)

      draggedElement.styles({
        top: draggedElement.position().top - canvas.position().top + canvas.position().scrollTop,
        left: draggedElement.position().left - canvas.position().left + canvas.position().scrollLeft
      })

      canvas.appendChild(draggedElement.node)
      canvas.addBlockForElement(draggedElement)
    } else if (canvas.isDragging && blocks.length == 0) {
      canvas.appendChild(document.querySelector('.indicator'))
      canvas.toggleDragger(false, { remove: true })
    } else if (canvas.isDragging || canvas.isRearranging) {
      var xpos = draggedElement.position().left + draggedElement.position().width / 2 + canvas.position().scrollLeft
      var ypos = draggedElement.position().top + canvas.position().scrollTop

      for (var i = 0; i < blocks.length; i++) {
        const block = blocks[i]
        const { x, y, height, width } = block

        if (
          xpos >= x - width / 2 - paddingX &&
          xpos <= x + width / 2 + paddingX &&
          ypos >= y - height / 2 &&
          ypos <= y + height
        ) {
          canvas.toggleDragging(false)

          if (canvas.isRearranging || flowy.onBlockSnapped(draggedElement.node, false, block)) {
            snap(draggedElement, block)
          }

          break
        } else if (i == blocks.length - 1) {
          if (canvas.isRearranging) {
            canvas.toggleRearranging(false)
            blocksTemp = []
          }

          canvas.toggleDragging(false)
          canvas.appendChild(document.querySelector('.indicator'))
          canvas.toggleDragger(false, { remove: true })
        }
      }
    }
  }

  document.addEventListener('mouseup', flowy.endDrag, false)
  document.addEventListener('touchend', flowy.endDrag, false)

  function snap(draggedElement, block) {
    if (!canvas.isRearranging) {
      canvas.appendChild(draggedElement.node)
    }

    var totalWidth = 0
    var totalRemove = 0
    var maxheight = 0

    const childBlocks = canvas.childBlocksFor(block)

    childBlocks.forEach(block => (totalWidth += block.maxWidth + paddingX))

    totalWidth += draggedElement.position().width

    childBlocks.forEach(childBlock => {
      const { id, childWidth, width } = childBlock
      const childElement = canvas.findBlockElement(id)
      let left = block.x - totalWidth / 2 + totalRemove

      childBlock.x = left + childBlock.maxWidth / 2 + 200
      totalRemove += childBlock.maxWidth + paddingX

      if (childWidth > width) {
        left += childWidth / 2 - width / 2
      }

      childElement.styles({ left })
    })

    draggedElement.styles({
      left:
        blocks.find(id => id.id == block.id).x -
        totalWidth / 2 +
        totalRemove -
        canvas.position().left +
        canvas.position().scrollLeft,
      top:
        blocks.find(id => id.id == block.id).y +
        blocks.find(id => id.id == block.id).height / 2 +
        paddingY -
        canvas.position().top
    })

    if (canvas.isRearranging) {
      const dragtemp = blocksTemp.find(({ id }) => id == draggedElement.id)
      dragtemp.x =
        draggedElement.position().left + draggedElement.position().width / 2 + canvas.position().scrollLeft * 2
      dragtemp.y = draggedElement.position().top + draggedElement.position().height / 2 + canvas.position().scrollTop
      dragtemp.parent = block.id

      for (var w = 0; w < blocksTemp.length; w++) {
        if (parseInt(blocksTemp[w].id) === draggedElement.id) {
          continue
        }

        const blockElement = canvas.findBlockElement(blocksTemp[w].id)
        const arrowElement = blockElement.arrow()
        const blockParent = blockElement.node
        const arrowParent = arrowElement.node

        blockElement.styles({
          left: blockElement.position().left - canvas.position().left + canvas.position().scrollLeft,
          top: blockElement.position().top - canvas.position().top + canvas.position().scrollTop
        })
        arrowElement.styles({
          left: arrowElement.position().left - canvas.position().left + canvas.position().scrollLeft + 20,
          top: arrowElement.position().top - canvas.position().top + canvas.position().scrollTop
        })

        canvas.appendChild(blockParent, arrowParent)

        blocksTemp[w].x =
          blockElement.position().left + draggedElement.position().width / 2 + canvas.position().scrollLeft
        blocksTemp[w].y =
          blockElement.position().top + draggedElement.position().height / 2 + canvas.position().scrollTop
      }

      canvas.appendBlocks(blocksTemp)
      blocksTemp = []
    } else {
      canvas.addBlockForElement(draggedElement, { parent: block.id })
    }

    var { x, y, height } = blocks.find(({ id }) => id == draggedElement.id)
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
            <input type="hidden" class="arrowid" value="${draggedElement.id}">
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
      draggedElement.arrow().styles({
        left: `${x - 5 - canvas.position().left + canvas.position().scrollLeft}px`
      })
    } else {
      canvas.appendHtml(`
          <div class="arrowblock">
            <input type="hidden" class="arrowid" value="${draggedElement.id}">
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
      draggedElement.arrow().styles({
        left: `${block.x - 20 - canvas.position().left + canvas.position().scrollLeft}px`
      })
    }
    draggedElement.arrow().styles({
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

        parents.forEach(({ childWidth, width }, w) => {
          zwidth += Math.max(childWidth, width)

          if (w !== parents.length - 1) {
            zwidth += paddingX
          }
        })

        loopBlock.childWidth = zwidth
        idval = loopBlock.parent
      }

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
    const { mouseX, mouseY } = handleCoordinates(event)
    const { draggedElement } = canvas

    if (canvas.isDraggingBlock) {
      canvas.toggleRearranging(true)
      canvas.toggleDragger(true)

      const draggedBlock = canvas.findBlockForElement(draggedElement)

      blocksTemp.push(draggedBlock)
      // remove dragged block from canvas
      canvas.removeBlock(draggedBlock, { removeArrow: true })

      const childBlocks = canvas.childBlocksFor(draggedBlock)
      let layer = childBlocks
      const allBlocks = []

      // Move child block DOM nodes into dragged block node for easier dragging
      do {
        const foundids = layer.map(({ id }) => id)

        layer.forEach(block => {
          blocksTemp.push(block)

          const blockElement = canvas.findBlockElement(block.id)
          const arrowElement = blockElement.arrow()

          blockElement.styles({
            left: blockElement.position().left - draggedElement.position().left,
            top: blockElement.position().top - draggedElement.position().top
          })
          arrowElement.styles({
            left: arrowElement.position().left - draggedElement.position().left,
            top: arrowElement.position().top - draggedElement.position().top
          })

          draggedElement.node.appendChild(blockElement.node)
          draggedElement.node.appendChild(arrowElement.node)
        })

        allBlocks.push(...layer)

        // finds next children
        layer = canvas.blocks.filter(({ parent }) => foundids.includes(parent))
      } while (layer.length)

      childBlocks.forEach(canvas.removeBlock)
      allBlocks.forEach(canvas.removeBlock)

      if (canvas.blocks.length > 1) {
        rearrangeMe()
      }

      if (canvas.isLastEvent) {
        fixOffset()
      }

      canvas.toggleDraggingBlock(false)
    }

    const { dragX, dragY } = canvas.state

    if (canvas.isDragging) {
      draggedElement.styles({
        left: `${mouseX - dragX}px`,
        top: `${mouseY - dragY}px`
      })
    } else if (canvas.isRearranging) {
      draggedElement.styles({
        left: `${mouseX - dragX - canvas.position().left + canvas.position().scrollLeft}px`,
        top: `${mouseY - dragY - canvas.position().top + canvas.position().scrollTop}px`
      })

      // TODO: Doesn't look like setting `x` and `y` does anything here - remove?
      blocksTemp.filter(({ id }) => id == draggedElement.id).x =
        draggedElement.position().left + draggedElement.position().width / 2 + canvas.position().scrollLeft
      blocksTemp.filter(({ id }) => id == draggedElement.id).y =
        draggedElement.position().left + draggedElement.position().height / 2 + canvas.position().scrollTop
    }

    if (!canvas.isDragging && !canvas.isRearranging) {
      return
    }

    var xpos = draggedElement.position().left + draggedElement.position().width / 2 + canvas.position().scrollLeft
    var ypos = draggedElement.position().top + canvas.position().scrollTop

    for (var i = 0; i < canvas.blocks.length; i++) {
      const { x, y, width, height, id } = canvas.blocks[i]

      if (
        xpos >= x - width / 2 - paddingX &&
        xpos <= x + width / 2 + paddingX &&
        ypos >= y - height / 2 &&
        ypos <= y + height
      ) {
        const blockElement = canvas.findBlockElement(id)
        const indicator = canvas.indicator()
        blockElement.node.appendChild(indicator)

        indicator.style.left = draggedElement.position().width / 2 - 5
        indicator.style.top = blockElement.position().height

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

    canvas.setState({ currentOffsetLeft })

    if (currentOffsetLeft < canvas.position().left) {
      canvas.toggleLastEvent(true)

      blocks.forEach(({ id, x, width, parent }) => {
        const blockElement = canvas.findBlockElement(id)

        blockElement.styles({
          left: x - width / 2 - currentOffsetLeft + 20
        })

        if (parent === -1) {
          return
        }

        const arrowElement = blockElement.arrow()
        const parentX = blocks.find(({ id }) => id == parent).x
        const arrowX = x - parentX

        arrowElement.styles({
          left: arrowX < 0 ? `${x - currentOffsetLeft + 20 - 5}px` : `${parentX - 20 - currentOffsetLeft + 20}px`
        })
      })

      blocks.forEach(block => {
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

    blocks.forEach(block => {
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

      const parentX = blocks.find(({ id }) => id == parent).x
      var arrowX = x - parentX

      arrowElement.styles({
        left: arrowX < 0 ? `${x - 5 - canvas.position().left}px` : parentX - 20 - canvas.position().left + 'px'
      })
    })

    canvas.setState({ previousOffsetLeft: 0 })
  }

  function rearrangeMe() {
    var parents = blocks.map(({ parent }) => parent)

    for (var z = 0; z < parents.length; z++) {
      if (parents[z] == -1) {
        z++
      }

      var totalWidth = 0
      var totalRemove = 0
      var maxheight = 0

      const filteredBlocks = blocks.filter(({ parent }) => parent == parents[z])

      filteredBlocks.forEach((children, w) => {
        if (blocks.filter(({ parent }) => parent == children.id).length == 0) {
          children.childWidth = 0
        }

        totalWidth += Math.max(children.childWidth, children.width)

        if (w !== filteredBlocks.length - 1) {
          totalWidth += paddingX
        }
      })

      if (parents[z] != -1) {
        blocks.find(a => a.id == parents[z]).childWidth = totalWidth
      }

      filteredBlocks.forEach(children => {
        const blockElement = canvas.findBlockElement(children.id)
        const arrowElement = blockElement.arrow()
        const r_array = blocks.filter(({ id }) => id == parents[z])

        blockElement.styles({
          top: `${r_array.y + paddingY}px`
        })
        r_array.y = r_array.y + paddingY

        if (children.childWidth > children.width) {
          blockElement.styles({
            left:
              r_array[0].x -
              totalWidth / 2 +
              totalRemove +
              children.childWidth / 2 -
              children.width / 2 -
              canvas.position().left +
              'px'
          })
        } else {
          blockElement.styles({
            left: r_array[0].x - totalWidth / 2 + totalRemove - canvas.position().left + 'px'
          })
        }

        children.x = r_array[0].x - totalWidth / 2 + totalRemove + Math.max(children.childWidth, children.width) / 2
        totalRemove += Math.max(children.childWidth, children.width) + paddingX

        const { x, y, height } = blocks.find(({ id }) => id == children.id)
        const { x: parentX, y: parentY, height: parentHeight } = blocks.find(({ id }) => id == children.parent)
        const arrowX = x - parentX + 20
        const arrowY = y - height / 2 - (parentY + parentHeight / 2)

        arrowElement.styles({
          top: parentY + parentHeight / 2 - canvas.position().top + 'px'
        })

        if (arrowX < 0) {
          arrowElement.styles({
            left: x - 5 - canvas.position().left + 'px'
          })
          arrowElement.html(`
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
          arrowElement.styles({
            left: parentX - 20 - canvas.position().left + 'px'
          })
          arrowElement.html(`
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

export default shim
