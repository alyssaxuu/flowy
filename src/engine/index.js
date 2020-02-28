import Canvas from './Canvas'
import Manager from './Manager'

let loaded = false

function shim(canvas, drag, release, snapping, spacing_x, spacing_y) {
  return flowy({
    document: document,
    canvas: new Canvas({ canvas, spacingX: spacing_x, spacingY: spacing_y, window, document }),
    manager: new Manager({ window, document }),
    onBlockGrabbed: drag,
    onBlockReleased: release,
    onBlockSnapped: snapping
  })
}

function flowy({
  document,
  canvas,
  manager,
  onBlockGrabbed = void 0,
  onBlockReleased = void 0,
  onBlockSnapped = void 0
}) {
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
  manager.setState({
    currentOffsetLeft: 0,
    previousOffsetLeft: 0
  })

  const handleCoordinates = event => {
    const { clientX, clientY } = event.targetTouches ? event.targetTouches[0] : event
    return manager.setState({
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
    const grabbedElement = target.closest('.create-flowy')

    if (which === 3 || !grabbedElement) {
      return
    }

    manager.createDragger(grabbedElement, canvas)
    manager.toggleDragging(true)

    flowy.onBlockGrabbed(grabbedElement)
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

    flowy.onBlockReleased()

    canvas.showIndicator(true)

    const { draggedBlock } = manager

    if (manager.isDragging) {
      manager.toggleDragger(false)
    }

    if (draggedBlock.id === 0 && manager.isRearranging) {
      manager.toggleDragger(false)
      manager.toggleRearranging(false)

      blocksTemp.forEach(block => {
        if (block.id == draggedBlock.id) {
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

      for (var w = 0; w < blocksTemp.length; w++) {}

      blocksTemp.find(a => a.id == 0).x = draggedBlock.position().left + draggedBlock.position().width / 2
      blocksTemp.find(a => a.id == 0).y = draggedBlock.position().top + draggedBlock.position().height / 2

      canvas.appendBlocks(blocksTemp)
      blocksTemp = []
    } else if (
      manager.isDragging &&
      blocks.length == 0 &&
      draggedBlock.position().top > canvas.position().top &&
      draggedBlock.position().left > canvas.position().left
    ) {
      flowy.onBlockSnapped(draggedBlock.node, true, undefined)

      manager.toggleDragging(false)

      draggedBlock.styles({
        top: draggedBlock.position().top - canvas.position().top + canvas.position().scrollTop,
        left: draggedBlock.position().left - canvas.position().left + canvas.position().scrollLeft
      })


      blocks.push({
        parent: -1,
        childwidth: 0,
        id: draggedBlock.id,
        x: draggedBlock.position().left + draggedBlock.position().width / 2 + canvas.position().scrollLeft,
        y: draggedBlock.position().top + draggedBlock.position().height / 2 + canvas.position().scrollTop,
        width: draggedBlock.position().width,
        height: draggedBlock.position().height
      })
      canvas.appendChild(draggedBlock.node)
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

          if (manager.isRearranging || flowy.onBlockSnapped(draggedBlock.node, false, block)) {
            snap(draggedBlock, block)
          }

          break
        } else if (i == blocks.length - 1) {
          if (manager.isRearranging) {
            manager.toggleRearranging(false)
            blocksTemp = []
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
      canvas.appendChild(draggedBlock.node)
    }

    var totalWidth = 0
    var totalRemove = 0
    var maxheight = 0

    const childBlocks = canvas.childBlocksFor(block)

    childBlocks.forEach(block => (totalWidth += block.maxWidth + paddingX))

    totalWidth += draggedBlock.position().width

    childBlocks.forEach(childBlock => {
      const { id, childWidth, width } = childBlock
      const blockElement = canvas.findBlockElement(id)
      const { x } = block

      if (childWidth > width) {
        blockElement.styles({
          left: x - totalWidth / 2 + totalRemove + childWidth / 2 - width / 2
        })
        childBlock.x = blocks.find(id => id.parent == block.id).x - totalWidth / 2 + totalRemove + childWidth / 2
      } else {
        blockElement.styles({
          left: x - totalWidth / 2 + totalRemove
        })
        childBlock.x = blocks.find(({ parent }) => parent == block.id).x - totalWidth / 2 + totalRemove + width / 2
      }

      totalRemove += childBlock.maxWidth + paddingX
    })

    draggedBlock.styles({
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

    if (manager.isRearranging) {
      const dragtemp = blocksTemp.find(({ id }) => id == draggedBlock.id)
      dragtemp.x = draggedBlock.position().left + draggedBlock.position().width / 2 + canvas.position().scrollLeft * 2
      dragtemp.y = draggedBlock.position().top + draggedBlock.position().height / 2 + canvas.position().scrollTop
      dragtemp.parent = block.id

      for (var w = 0; w < blocksTemp.length; w++) {
        if (parseInt(blocksTemp[w].id) === draggedBlock.id) {
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
          blockElement.position().left + draggedBlock.position().width / 2 + canvas.position().scrollLeft
        blocksTemp[w].y = blockElement.position().top + draggedBlock.position().height / 2 + canvas.position().scrollTop
      }

      canvas.appendBlocks(blocksTemp)
      blocksTemp = []
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
        left: `${x - 5 - canvas.position().left + canvas.position().scrollLeft}px`
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
        left: `${block.x - 20 - canvas.position().left + canvas.position().scrollLeft}px`
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

    const { mouseX, mouseY } = handleCoordinates(event)

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
        dragX: mouseX - draggedBlock.position().left,
        dragY: mouseY - draggedBlock.position().top
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
    const { draggedBlock } = manager

    if (manager.isDraggingBlock) {
      manager.toggleRearranging(true)
      manager.toggleDragger(true)

      var blockid = draggedBlock.id
      blocksTemp.push(blocks.find(({ id }) => id == blockid))
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

          blocksTemp.push(block)

          const blockElement = canvas.findBlockElement(block.id)
          const arrowElement = blockElement.arrow()

          blockElement.styles({
            left: blockElement.position().left - draggedBlock.position().left,
            top: blockElement.position().top - draggedBlock.position().top
          })
          arrowElement.styles({
            left: arrowElement.position().left - draggedBlock.position().left,
            top: arrowElement.position().top - draggedBlock.position().top
          })

          draggedBlock.node.appendChild(blockElement.node)
          draggedBlock.node.appendChild(arrowElement.node)

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
        left: `${mouseX - dragX}px`,
        top: `${mouseY - dragY}px`
      })
    } else if (manager.isRearranging) {
      draggedBlock.styles({
        left: `${mouseX - dragX - canvas.position().left + canvas.position().scrollLeft}px`,
        top: `${mouseY - dragY - canvas.position().top + canvas.position().scrollTop}px`
      })

      // TODO: Doesn't look like setting `x` and `y` does anything here - remove?
      blocksTemp.filter(({ id }) => id == draggedBlock.id).x =
        draggedBlock.position().left + draggedBlock.position().width / 2 + canvas.position().scrollLeft
      blocksTemp.filter(({ id }) => id == draggedBlock.id).y =
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
        const blockElement = canvas.findBlockElement(block.id)
        blockElement.node.appendChild(indicator)

        indicator.style.left = `${draggedBlock.position().width / 2 - 5}px`
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

    manager.setState({ currentOffsetLeft })

    if (currentOffsetLeft < canvas.position().left) {
      manager.toggleLastEvent(true)

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
          manager.draggedBlock.position().width / 2 -
          40
      })

      manager.setState({ previousOffsetLeft: currentOffsetLeft })
    }
  }

  function fixOffset() {
    const { previousOffsetLeft } = manager.state

    if (previousOffsetLeft >= canvas.position().left) {
      return
    }

    manager.toggleLastEvent(false)

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

    manager.setState({ previousOffsetLeft: 0 })
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
