import Blocks from './Blocks'
import Dragger from './Dragger'

function shim(canvas, drag, release, snapping, spacing_x, spacing_y) {
  return flowy({
    window: window,
    document: document,
    blocksManager: new Blocks({ canvas, spacingX: spacing_x, spacingY: spacing_y, document }),
    dragManager: new Dragger(),
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

      const draggedElement = dragManager.createDragger(grabbedElement, blocksManager)
      dragManager.toggleDragging(true)

      onBlockGrabbed(grabbedElement)

      const { dragX, dragY } = dragManager.setState({
        dragX: clientX - grabbedElement.offsetLeft,
        dragY: clientY - grabbedElement.offsetTop
      })

      draggedElement.style.left = `${clientX - dragX}px`
      draggedElement.style.top = `${clientY - dragY}px`
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

      if (!document.querySelector('.indicator').classList.contains('invisible')) {
        document.querySelector('.indicator').classList.add('invisible')
      }

      const drag = dragManager.draggedElement

      if (dragManager.isDragging) {
        dragManager.grabbedElement.classList.remove('dragnow')
        drag.classList.remove('dragging')
      }

      if (parseInt(drag.querySelector('.blockid').value) === 0 && dragManager.isRearranging) {
        drag.classList.remove('dragging')
        dragManager.toggleRearrange(false)

        for (var w = 0; w < blockstemp.length; w++) {
          if (blockstemp[w].id != parseInt(drag.querySelector('.blockid').value)) {
            const blockParent = document.querySelector(`.blockid[value='${blockstemp[w].id}']`).parentNode
            const arrowParent = document.querySelector(`.arrowid[value='${blockstemp[w].id}']`).parentNode

            blockParent.style.left =
              blockParent.getBoundingClientRect().left +
              window.scrollX -
              (blocksManager.position().left + window.scrollX) +
              blocksManager.position().scrollLeft
            blockParent.style.top =
              blockParent.getBoundingClientRect().top +
              window.scrollY -
              (blocksManager.position().top + window.scrollY) +
              blocksManager.position().scrollTop
            arrowParent.style.left =
              arrowParent.getBoundingClientRect().left +
              window.scrollX -
              (blocksManager.position().left + window.scrollX) +
              blocksManager.position().scrollLeft
            arrowParent.style.top =
              arrowParent.getBoundingClientRect().top +
              window.scrollY -
              (blocksManager.position().top + blocksManager.position().scrollTop) +
              'px'
            blocksManager.appendChild(blockParent)
            blocksManager.appendChild(arrowParent)
            blockstemp[w].x =
              blockParent.getBoundingClientRect().left +
              window.scrollX +
              parseInt(blockParent.offsetWidth) / 2 +
              blocksManager.position().scrollLeft
            blockstemp[w].y =
              blockParent.getBoundingClientRect().top +
              window.scrollY +
              parseInt(blockParent.offsetHeight) / 2 +
              blocksManager.position().scrollTop
          }
        }

        blockstemp.find(a => a.id == 0).x =
          drag.getBoundingClientRect().left + window.scrollX + parseInt(window.getComputedStyle(drag).width) / 2
        blockstemp.find(a => a.id == 0).y =
          drag.getBoundingClientRect().top + window.scrollY + parseInt(window.getComputedStyle(drag).height) / 2
        blocksManager.appendBlocks(blockstemp)
        blockstemp = []
      } else if (
        dragManager.isDragging &&
        blocks.length == 0 &&
        drag.getBoundingClientRect().top + window.scrollY > blocksManager.position().top + window.scrollY &&
        drag.getBoundingClientRect().left + window.scrollX > blocksManager.position().left + window.scrollX
      ) {
        onBlockSnapped(drag, true, undefined)

        dragManager.toggleDragging(false)
        drag.style.top =
          drag.getBoundingClientRect().top +
          window.scrollY -
          (blocksManager.position().top + window.scrollY) +
          blocksManager.position().scrollTop +
          'px'
        drag.style.left =
          drag.getBoundingClientRect().left +
          window.scrollX -
          (blocksManager.position().left + window.scrollX) +
          blocksManager.position().scrollLeft +
          'px'
        blocksManager.appendChild(drag)
        blocks.push({
          parent: -1,
          childwidth: 0,
          id: parseInt(drag.querySelector('.blockid').value),
          x:
            drag.getBoundingClientRect().left +
            window.scrollX +
            parseInt(window.getComputedStyle(drag).width) / 2 +
            blocksManager.position().scrollLeft,
          y:
            drag.getBoundingClientRect().top +
            window.scrollY +
            parseInt(window.getComputedStyle(drag).height) / 2 +
            blocksManager.position().scrollTop,
          width: parseInt(window.getComputedStyle(drag).width),
          height: parseInt(window.getComputedStyle(drag).height)
        })
      } else if (dragManager.isDragging && blocks.length == 0) {
        blocksManager.appendChild(document.querySelector('.indicator'))
        drag.parentNode.removeChild(drag)
      } else if (dragManager.isDragging || dragManager.isRearranging) {
        var xpos =
          drag.getBoundingClientRect().left +
          window.scrollX +
          parseInt(window.getComputedStyle(drag).width) / 2 +
          blocksManager.position().scrollLeft
        var ypos = drag.getBoundingClientRect().top + window.scrollY + blocksManager.position().scrollTop
        var blocko = blocks.map(a => a.id)

        for (var i = 0; i < blocks.length; i++) {
          if (
            xpos >= blocks.find(a => a.id == blocko[i]).x - blocks.find(a => a.id == blocko[i]).width / 2 - paddingX &&
            xpos <= blocks.find(a => a.id == blocko[i]).x + blocks.find(a => a.id == blocko[i]).width / 2 + paddingX &&
            ypos >= blocks.find(a => a.id == blocko[i]).y - blocks.find(a => a.id == blocko[i]).height / 2 &&
            ypos <= blocks.find(a => a.id == blocko[i]).y + blocks.find(a => a.id == blocko[i]).height
          ) {
            dragManager.toggleDragging(false)
            if (
              dragManager.isRearranging ||
              onBlockSnapped(
                drag,
                false,
                blocks.find(id => id.id == blocko[i])
              )
            ) {
              snap(drag, i, blocko)
            }
            break
          } else if (i == blocks.length - 1) {
            if (dragManager.isRearranging) {
              dragManager.toggleRearrange(false)
              blockstemp = []
            }
            dragManager.toggleDragging(false)
            blocksManager.appendChild(document.querySelector('.indicator'))
            drag.parentNode.removeChild(drag)
          }
        }
      }
    }

    document.addEventListener('mouseup', flowy.endDrag, false)
    document.addEventListener('touchend', flowy.endDrag, false)

    function snap(drag, i, blocko) {
      if (!dragManager.isRearranging) {
        blocksManager.appendChild(drag)
      }

      var totalwidth = 0
      var totalremove = 0
      var maxheight = 0

      for (var w = 0; w < blocks.filter(id => id.parent == blocko[i]).length; w++) {
        var children = blocks.filter(id => id.parent == blocko[i])[w]
        totalwidth += Math.max(children.childwidth, children.width) + paddingX
      }

      totalwidth += parseInt(window.getComputedStyle(drag).width)

      for (var w = 0; w < blocks.filter(id => id.parent == blocko[i]).length; w++) {
        var children = blocks.filter(id => id.parent == blocko[i])[w]

        if (children.childwidth > children.width) {
          document.querySelector(`.blockid[value='${children.id}']`).parentNode.style.left =
            blocks.find(a => a.id == blocko[i]).x -
            totalwidth / 2 +
            totalremove +
            children.childwidth / 2 -
            children.width / 2 +
            'px'
          children.x =
            blocks.find(id => id.parent == blocko[i]).x - totalwidth / 2 + totalremove + children.childwidth / 2
          totalremove += children.childwidth + paddingX
        } else {
          document.querySelector(`.blockid[value='${children.id}']`).parentNode.style.left =
            blocks.find(a => a.id == blocko[i]).x - totalwidth / 2 + totalremove + 'px'
          children.x = blocks.find(id => id.parent == blocko[i]).x - totalwidth / 2 + totalremove + children.width / 2
          totalremove += children.width + paddingX
        }
      }

      drag.style.left =
        blocks.find(id => id.id == blocko[i]).x -
        totalwidth / 2 +
        totalremove -
        (blocksManager.position().left + window.scrollX) +
        blocksManager.position().scrollLeft +
        'px'
      drag.style.top =
        blocks.find(id => id.id == blocko[i]).y +
        blocks.find(id => id.id == blocko[i]).height / 2 +
        paddingY -
        (blocksManager.position().top + window.scrollY) +
        'px'

      if (dragManager.isRearranging) {
        blockstemp.find(a => a.id == parseInt(drag.querySelector('.blockid').value)).x =
          drag.getBoundingClientRect().left +
          window.scrollX +
          parseInt(window.getComputedStyle(drag).width) / 2 +
          blocksManager.position().scrollLeft +
          blocksManager.position().scrollLeft
        blockstemp.find(a => a.id == parseInt(drag.querySelector('.blockid').value)).y =
          drag.getBoundingClientRect().top +
          window.scrollY +
          parseInt(window.getComputedStyle(drag).height) / 2 +
          blocksManager.position().scrollTop
        blockstemp.find(a => a.id == drag.querySelector('.blockid').value).parent = blocko[i]

        for (var w = 0; w < blockstemp.length; w++) {
          if (parseInt(blockstemp[w].id) === parseInt(drag.querySelector('.blockid').value)) {
            continue
          }

          const blockParent = document.querySelector(`.blockid[value='${blockstemp[w].id}']`).parentNode
          const arrowParent = document.querySelector(`.arrowid[value='${blockstemp[w].id}']`).parentNode

          blockParent.style.left =
            blockParent.getBoundingClientRect().left +
            window.scrollX -
            (blocksManager.position().left + window.scrollX) +
            blocksManager.position().scrollLeft
          blockParent.style.top =
            blockParent.getBoundingClientRect().top +
            window.scrollY -
            (blocksManager.position().top + window.scrollY) +
            blocksManager.position().scrollTop
          arrowParent.style.left =
            arrowParent.getBoundingClientRect().left +
            window.scrollX -
            (blocksManager.position().left + window.scrollX) +
            blocksManager.position().scrollLeft +
            20
          arrowParent.style.top =
            arrowParent.getBoundingClientRect().top +
            window.scrollY -
            (blocksManager.position().top + window.scrollY) +
            blocksManager.position().scrollTop
          blocksManager.appendChild(blockParent)
          blocksManager.appendChild(arrowParent)

          blockstemp[w].x =
            blockParent.getBoundingClientRect().left +
            window.scrollX +
            parseInt(window.getComputedStyle(blockParent).width) / 2 +
            blocksManager.position().scrollLeft
          blockstemp[w].y =
            blockParent.getBoundingClientRect().top +
            window.scrollY +
            parseInt(window.getComputedStyle(blockParent).height) / 2 +
            blocksManager.position().scrollTop
        }

        blocksManager.appendBlocks(blockstemp)
        blockstemp = []
      } else {
        blocks.push({
          childwidth: 0,
          parent: blocko[i],
          id: parseInt(drag.querySelector('.blockid').value),
          x:
            drag.getBoundingClientRect().left +
            window.scrollX +
            parseInt(window.getComputedStyle(drag).width) / 2 +
            blocksManager.position().scrollLeft,
          y:
            drag.getBoundingClientRect().top +
            window.scrollY +
            parseInt(window.getComputedStyle(drag).height) / 2 +
            blocksManager.position().scrollTop,
          width: parseInt(window.getComputedStyle(drag).width),
          height: parseInt(window.getComputedStyle(drag).height)
        })
      }

      var arrowhelp = blocks.find(a => a.id == parseInt(drag.querySelector('.blockid').value))
      var arrowx = arrowhelp.x - blocks.find(a => a.id == blocko[i]).x + 20
      var arrowy = parseFloat(
        arrowhelp.y -
          arrowhelp.height / 2 -
          (blocks.find(id => id.parent == blocko[i]).y + blocks.find(id => id.parent == blocko[i]).height / 2) +
          blocksManager.position().scrollTop
      )

      if (arrowx < 0) {
        blocksManager.appendHtml(`
          <div class="arrowblock">
            <input type="hidden" class="arrowid" value="${drag.querySelector('.blockid').value}">
            <svg preserveaspectratio="none" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="
                M${blocks.find(a => a.id == blocko[i]).x - arrowhelp.x + 5}
                0L${blocks.find(a => a.id == blocko[i]).x - arrowhelp.x + 5}
                ${paddingY / 2}L5
                ${paddingY / 2}L5
                ${arrowy}" stroke="#C5CCD0" stroke-width="2px"/>
              <path d="M0 ${arrowy - 5}H10L5
                ${arrowy}L0
                ${arrowy - 5}Z" fill="#C5CCD0"/>
            </svg>
          </div>
        `)
        document.querySelector(
          `.arrowid[value="${drag.querySelector('.blockid').value}"]`
        ).parentNode.style.left = `${arrowhelp.x -
          5 -
          (blocksManager.position().left + window.scrollX) +
          blocksManager.position().scrollLeft}px`
      } else {
        blocksManager.appendHtml(`
          <div class="arrowblock">
            <input type="hidden" class="arrowid" value="${drag.querySelector('.blockid').value}">
            <svg preserveaspectratio="none" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M20 0L20
                ${paddingY / 2}L${arrowx}
                ${paddingY / 2}L${arrowx}
                ${arrowy}" stroke="#C5CCD0" stroke-width="2px"/>
              <path d="M${arrowx - 5}
                ${arrowy - 5}H${arrowx + 5}L${arrowx}
                ${arrowy}L${arrowx - 5}
                ${arrowy - 5}Z" fill="#C5CCD0"/>
            </svg>
          </div>
        `)
        document.querySelector(
          `.arrowid[value="${parseInt(drag.querySelector('.blockid').value)}"]`
        ).parentNode.style.left = `${blocks.find(a => a.id == blocko[i]).x -
          20 -
          (blocksManager.position().left + window.scrollX) +
          blocksManager.position().scrollLeft}px`
      }
      document.querySelector(
        `.arrowid[value="${parseInt(drag.querySelector('.blockid').value)}"]`
      ).parentNode.style.top = `${blocks.find(a => a.id == blocko[i]).y +
        blocks.find(a => a.id == blocko[i]).height / 2}px`

      if (blocks.find(a => a.id == blocko[i]).parent != -1) {
        var flag = false
        var idval = blocko[i]

        while (!flag) {
          if (blocks.find(a => a.id == idval).parent == -1) {
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

            blocks.find(a => a.id == idval).childwidth = zwidth
            idval = blocks.find(a => a.id == idval).parent
          }
        }

        blocks.find(id => id.id == idval).childwidth = totalwidth
      }

      if (dragManager.isRearranging) {
        dragManager.toggleRearrange(false)
        drag.classList.remove('dragging')
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
        // TODO: Set this through a lifecycle method
        dragManager.draggedElement = theblock

        dragManager.setState({
          dragX: clientX - (theblock.getBoundingClientRect().left + window.scrollX),
          dragY: clientY - (theblock.getBoundingClientRect().top + window.scrollY)
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

      const drag = dragManager.draggedElement

      if (dragManager.isDraggingBlock) {
        dragManager.toggleRearrange(true)
        drag.classList.add('dragging')
        var blockid = parseInt(drag.querySelector('.blockid').value)
        blockstemp.push(blocks.find(a => a.id == blockid))
        blocksManager.replaceBlocks(blocks.filter(({ id }) => id != blockid))

        if (blockid != 0) {
          document.querySelector(`.arrowid[value='${blockid}']`).parentNode.remove()
        }

        var layer = blocks.filter(a => a.parent == blockid)
        var flag = false
        var foundids = []
        var allids = []

        while (!flag) {
          for (var i = 0; i < layer.length; i++) {
            if (layer[i] != blockid) {
              blockstemp.push(blocks.find(a => a.id == layer[i].id))
              const blockParent = document.querySelector(`.blockid[value='${layer[i].id}']`).parentNode
              const arrowParent = document.querySelector(`.arrowid[value='${layer[i].id}']`).parentNode
              blockParent.style.left =
                blockParent.getBoundingClientRect().left +
                window.scrollX -
                (drag.getBoundingClientRect().left + window.scrollX)
              blockParent.style.top =
                blockParent.getBoundingClientRect().top +
                window.scrollY -
                (drag.getBoundingClientRect().top + window.scrollY)
              arrowParent.style.left =
                arrowParent.getBoundingClientRect().left +
                window.scrollX -
                (drag.getBoundingClientRect().left + window.scrollX)
              arrowParent.style.top =
                arrowParent.getBoundingClientRect().top +
                window.scrollY -
                (drag.getBoundingClientRect().top + window.scrollY)
              drag.appendChild(blockParent)
              drag.appendChild(arrowParent)
              foundids.push(layer[i].id)
              allids.push(layer[i].id)
            }
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
        drag.style.left = clientX - dragX + 'px'
        drag.style.top = clientY - dragY + 'px'
      } else if (dragManager.isRearranging) {
        drag.style.left = `${clientX -
          dragX -
          (blocksManager.position().left + window.scrollX) +
          blocksManager.position().scrollLeft}px`
        drag.style.top = `${clientY -
          dragY -
          (blocksManager.position().top + window.scrollY) +
          blocksManager.position().scrollTop}px`
        blockstemp.filter(a => a.id == parseInt(drag.querySelector('.blockid').value)).x =
          drag.getBoundingClientRect().left +
          window.scrollX +
          parseInt(window.getComputedStyle(drag).width) / 2 +
          blocksManager.position().scrollLeft
        blockstemp.filter(a => a.id == parseInt(drag.querySelector('.blockid').value)).y =
          drag.getBoundingClientRect().left +
          window.scrollX +
          parseInt(window.getComputedStyle(drag).height) / 2 +
          blocksManager.position().scrollTop
      }

      if (!dragManager.isDragging && !dragManager.isRearranging) {
        return
      }

      var xpos =
        drag.getBoundingClientRect().left +
        window.scrollX +
        parseInt(window.getComputedStyle(drag).width) / 2 +
        blocksManager.position().scrollLeft
      var ypos = drag.getBoundingClientRect().top + window.scrollY + blocksManager.position().scrollTop
      var blocko = blocks.map(a => a.id)

      for (var i = 0; i < blocks.length; i++) {
        if (
          xpos >= blocks.find(a => a.id == blocko[i]).x - blocks.find(a => a.id == blocko[i]).width / 2 - paddingX &&
          xpos <= blocks.find(a => a.id == blocko[i]).x + blocks.find(a => a.id == blocko[i]).width / 2 + paddingX &&
          ypos >= blocks.find(a => a.id == blocko[i]).y - blocks.find(a => a.id == blocko[i]).height / 2 &&
          ypos <= blocks.find(a => a.id == blocko[i]).y + blocks.find(a => a.id == blocko[i]).height
        ) {
          document
            .querySelector(`.blockid[value='${blocko[i]}']`)
            .parentNode.appendChild(document.querySelector('.indicator'))
          document.querySelector('.indicator').style.left =
            parseInt(
              window.getComputedStyle(document.querySelector(`.blockid[value='${blocko[i]}']`).parentNode).width
            ) /
              2 -
            5 +
            'px'
          document.querySelector('.indicator').style.top = window.getComputedStyle(
            document.querySelector(`.blockid[value='${blocko[i]}']`).parentNode
          ).height
          document.querySelector('.indicator').classList.remove('invisible')
          break
        } else if (i == blocks.length - 1 && !document.querySelector('.indicator').classList.contains('invisible')) {
          document.querySelector('.indicator').classList.add('invisible')
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
          document.querySelector(`.blockid[value='${blocks.find(a => a.id == blocko[w]).id}']`).parentNode.style.left =
            blocks.find(a => a.id == blocko[w]).x -
            blocks.find(a => a.id == blocko[w]).width / 2 -
            currentOffsetLeft +
            20

          if (blocks.find(a => a.id == blocko[w]).parent != -1) {
            var arrowhelp = blocks.find(a => a.id == blocko[w])
            var arrowx = arrowhelp.x - blocks.find(a => a.id == blocks.find(a => a.id == blocko[w]).parent).x

            document.querySelector(`.arrowid[value="${blocko[w]}"]`).parentNode.style.left =
              arrowx < 0
                ? `${arrowhelp.x - currentOffsetLeft + 20 - 5}px`
                : `${blocks.find(id => id.id == blocks.find(a => a.id == blocko[w]).parent).x -
                    20 -
                    currentOffsetLeft +
                    20}px`
          }
        }

        for (var w = 0; w < blocks.length; w++) {
          blocks[w].x =
            document.querySelector(`.blockid[value='${blocks[w].id}']`).parentNode.getBoundingClientRect().left +
            window.scrollX +
            (blocksManager.position().left + blocksManager.position().scrollLeft) -
            parseInt(
              window.getComputedStyle(document.querySelector(`.blockid[value='${blocks[w].id}']`).parentNode).width
            ) /
              2 -
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
        document.querySelector(`.blockid[value='${blocks.find(a => a.id == blocko[w]).id}']`).parentNode.style.left =
          blocks.find(a => a.id == blocko[w]).x -
          blocks.find(a => a.id == blocko[w]).width / 2 -
          previousOffsetLeft -
          20
        blocks.find(a => a.id == blocko[w]).x =
          document
            .querySelector(`.blockid[value='${blocks.find(a => a.id == blocko[w]).id}']`)
            .parentNode.getBoundingClientRect().left +
          window.scrollX +
          blocks.find(a => a.id == blocko[w]).width / 2

        if (blocks.find(a => a.id == blocko[w]).parent != -1) {
          var arrowhelp = blocks.find(a => a.id == blocko[w])
          var arrowx = arrowhelp.x - blocks.find(a => a.id == blocks.find(a => a.id == blocko[w]).parent).x

          document.querySelector(`.arrowid[value="${blocko[w]}"]`).parentNode.style.left =
            arrowx < 0
              ? `${arrowhelp.x - 5 - (blocksManager.position().left + window.scrollX)}px`
              : blocks.find(id => id.id == blocks.find(a => a.id == blocko[w]).parent).x -
                20 -
                (blocksManager.position().left + window.scrollX) +
                'px'
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

        for (var w = 0; w < blocks.filter(id => id.parent == result[z]).length; w++) {
          var children = blocks.filter(id => id.parent == result[z])[w]
          const r_block = document.querySelector(`.blockid[value='${children.id}']`).parentNode
          const r_array = blocks.filter(id => id.id == result[z])
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

          var arrowhelp = blocks.find(a => a.id == children.id)
          var arrowx = arrowhelp.x - blocks.find(a => a.id == children.parent).x + 20
          var arrowy =
            arrowhelp.y -
            arrowhelp.height / 2 -
            (blocks.find(a => a.id == children.parent).y + blocks.find(a => a.id == children.parent).height / 2)
          document.querySelector(`.arrowid[value="${children.id}"]`).parentNode.style.top =
            blocks.find(id => id.id == children.parent).y +
            blocks.find(id => id.id == children.parent).height / 2 -
            (blocksManager.position().top + window.scrollY) +
            'px'

          if (arrowx < 0) {
            document.querySelector(`.arrowid[value="${children.id}"]`).parentNode.style.left =
              arrowhelp.x - 5 - (blocksManager.position().left + window.scrollX) + 'px'
            document.querySelector(`.arrowid[value="${children.id}"]`).parentNode.innerHTML = `
              <input type="hidden" class="arrowid" value="${children.id}">
              <svg preserveaspectratio="none" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M${blocks.find(id => id.id == children.parent).x - arrowhelp.x + 5}
                  0L${blocks.find(id => id.id == children.parent).x - arrowhelp.x + 5} ${paddingY / 2}L5
                  ${paddingY / 2}L5
                  ${arrowy}" stroke="#C5CCD0" stroke-width="2px"/>
                <path d="M0
                  ${arrowy - 5}H10L5
                  ${arrowy}L0
                  ${arrowy - 5}Z" fill="#C5CCD0"/>
              </svg>
            `
          } else {
            document.querySelector(`.arrowid[value="${children.id}"]`).parentNode.style.left =
              blocks.find(id => id.id == children.parent).x -
              20 -
              (blocksManager.position().left + window.scrollX) +
              'px'
            document.querySelector(`.arrowid[value="${children.id}"]`).parentNode.innerHTML = `
              <input type="hidden" class="arrowid" value="${children.id}">
              <svg preserveaspectratio="none" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M20 0L20
                  ${paddingY / 2}L${arrowx}
                  ${paddingY / 2}L${arrowx}
                  ${arrowy}" stroke="#C5CCD0" stroke-width="2px"/>
                <path d="M${arrowx - 5}
                  ${arrowy - 5}H${arrowx + 5}L${arrowx}
                  ${arrowy}L${arrowx - 5}
                  ${arrowy - 5}Z" fill="#C5CCD0"/>
              </svg>
            `
          }
        }
      }
    }
  }

  flowy.load()

  function addEventListenerMulti(type, listener, capture, selector) {
    var nodes = document.querySelectorAll(selector)
    for (var i = 0; i < nodes.length; i++) {
      nodes[i].addEventListener(type, listener, capture)
    }
  }

  function removeEventListenerMulti(type, listener, capture, selector) {
    var nodes = document.querySelectorAll(selector)
    for (var i = 0; i < nodes.length; i++) {
      nodes[i].removeEventListener(type, listener, capture)
    }
  }
}

export default shim
