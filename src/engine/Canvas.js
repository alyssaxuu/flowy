import BlockElement from './BlockElement'
import Block from './Block'

class Canvas {
  constructor({ window, document, node, spacingX = 20, spacingY = 80 }) {
    this.window = window
    this.document = document
    this.node = node
    this.spacingX = spacingX
    this.spacingY = spacingY

    this.state = {}
    this.blocks = []
    this.isInitialized = false
    this.isDragging = false
    this.isDraggingBlock = false
    this.isRearranging = false
    this.isLastEvent = false
    this.grabbedNode = null
    this.draggedElement = null
    this.draggedTree = []
  }

  initialize = () => {
    if (this.isInitialized) {
      return
    }

    this.isInitialized = true

    this.reset()
  }

  position = () => {
    const { top, left } = this.node.getBoundingClientRect()
    return {
      top: top + this.window.scrollY,
      left: left + this.window.scrollX,
      scrollTop: this.node.scrollTop,
      scrollLeft: this.node.scrollLeft
    }
  }

  html = html => {
    if (html !== undefined) {
      this.node.innerHTML = html
    }
    return this.node.innerHTML
  }

  appendHtml = html => (this.node.innerHTML += html)

  appendChild = (...children) => {
    children.forEach(child => this.node.appendChild(child))
  }

  findBlockElement = id => BlockElement.find(id, { window: this.window })

  import = output => {
    const { html, blockarr } = output

    this.html(JSON.parse(html))
    this.replaceBlocks(blockarr)
  }

  grab = grabbedNode => {
    const { mouseX, mouseY } = this.state
    const draggedElement = grabbedNode.cloneNode(true)
    const id = this.nextBlockID()

    draggedElement.classList.remove('create-flowy')
    draggedElement.innerHTML += `<input type='hidden' name='blockid' class='blockid' value='${id}'>`

    this.document.body.appendChild(draggedElement)

    this.grabbedNode = grabbedNode

    this.registerDragger(draggedElement)

    const { dragX, dragY } = this.setState({
      dragX: mouseX - grabbedNode.offsetLeft,
      dragY: mouseY - grabbedNode.offsetTop
    })

    this.draggedElement.styles({
      left: mouseX - dragX,
      top: mouseY - dragY
    })

    this.toggleDragger(true)

    return draggedElement
  }

  registerDragger = draggedElement => {
    this.draggedElement = BlockElement.fromElement(draggedElement, { window: this.window })
  }

  toggleDragger = (start, { remove = false } = {}) => {
    const draggedElement = this.draggedElement.node

    if (start) {
      this.grabbedNode.classList.add('dragnow')
      draggedElement.classList.add('dragging')
      draggedElement.classList.add('block')
    } else {
      this.grabbedNode.classList.remove('dragnow')
      draggedElement.classList.remove('dragging')

      if (remove) {
        draggedElement.remove()
      }
    }
  }

  nextBlockID = () => (this.blocks.length === 0 ? 0 : Math.max(...this.blocks.map(({ id }) => id)) + 1)

  addBlockForElement = (blockElement, { parent = -1, childWidth = 0 } = {}) => {
    const { scrollLeft, scrollTop } = this.position()

    this.blocks.push(
      new Block({
        parent,
        childWidth,
        id: blockElement.id,
        x: blockElement.position().left + blockElement.position().width / 2 + scrollLeft,
        y: blockElement.position().top + blockElement.position().height / 2 + scrollTop,
        width: blockElement.position().width,
        height: blockElement.position().height
      })
    )
  }

  findBlock = (id, { tree = false } = {}) => (tree ? this.draggedTree : this.blocks).find(block => block.id === id)

  replaceBlocks = blocks => {
    this.blocks.splice(0, this.blocks.length, ...blocks)
  }

  appendBlocks = blocks => {
    this.blocks.push(...blocks)
  }

  removeBlock = (block, { removeArrow = false } = {}) => {
    this.replaceBlocks(this.blocks.filter(({ id }) => id != block.id))

    // remove arrow for child blocks
    if (removeArrow) {
      const arrowElement = this.findBlockElement(block.id).arrow()

      if (arrowElement) {
        arrowElement.remove()
      }
    }
  }

  findChildBlocks = id => {
    return this.blocks.filter(({ parent }) => parent == id)
  }

  output = () => {
    const { blocks } = this

    if (blocks.length === 0) {
      return
    }

    var json = {
      html: JSON.stringify(this.html()),
      blockarr: blocks,
      blocks: []
    }

    for (var i = 0; i < blocks.length; i++) {
      json.blocks.push({
        id: blocks[i].id,
        parent: blocks[i].parent,
        data: [],
        attr: []
      })
      var blockParent = document.querySelector(`.blockid[value='${blocks[i].id}']`).parentNode
      blockParent.querySelectorAll('input').forEach(function(block) {
        var json_name = block.getAttribute('name')
        var json_value = block.value
        json.blocks[i].data.push({
          name: json_name,
          value: json_value
        })
      })
      Array.prototype.slice.call(blockParent.attributes).forEach(function(attribute) {
        var jsonobj = {}
        jsonobj[attribute.name] = attribute.value
        json.blocks[i].attr.push(jsonobj)
      })
    }

    return json
  }

  reset = () => {
    this.html("<div class='indicator invisible'></div>")
    this.blocks.splice(0)
  }

  groupDraggedTree = () => {
    const { top, left } = this.draggedElement.position()
    const draggedBlock = this.findBlock(this.draggedElement.id)

    this.draggedTree.push(draggedBlock)
    // remove dragged block from canvas
    this.removeBlock(draggedBlock, { removeArrow: true })

    const childBlocks = this.findChildBlocks(draggedBlock.id)
    let layer = childBlocks
    const allBlocks = []

    // Move child block DOM nodes into dragged block node for easier dragging
    do {
      const foundids = layer.map(({ id }) => id)

      layer.forEach(block => {
        this.draggedTree.push(block)

        const blockElement = this.findBlockElement(block.id)
        const arrowElement = blockElement.arrow()

        blockElement.styles({
          left: blockElement.position().left - left,
          top: blockElement.position().top - top
        })
        arrowElement.styles({
          left: arrowElement.position().left - left,
          top: arrowElement.position().top - top
        })

        this.draggedElement.node.appendChild(blockElement.node)
        this.draggedElement.node.appendChild(arrowElement.node)
      })

      allBlocks.push(...layer)

      // finds next children
      layer = this.blocks.filter(({ parent }) => foundids.includes(parent))
    } while (layer.length)

    childBlocks.forEach(this.removeBlock)
    allBlocks.forEach(this.removeBlock)
  }

  ungroupDraggedTree = () => {
    this.draggedTree.forEach(block => {
      if (block.id == this.draggedElement.id) {
        return
      }

      const blockElement = this.findBlockElement(block.id)
      const arrowElement = blockElement.arrow()
      const { left, top, scrollLeft, scrollTop } = this.position()

      blockElement.styles({
        left: blockElement.position().left - left + scrollLeft,
        top: blockElement.position().top - top + scrollTop
      })

      arrowElement.styles({
        left: arrowElement.position().left - left + scrollLeft,
        top: arrowElement.position().top - (top + scrollTop)
      })

      this.appendChild(blockElement.node, arrowElement.node)

      block.x = blockElement.position().left + blockElement.node.offsetWidth / 2 + scrollLeft
      block.y = blockElement.position().top + blockElement.node.offsetHeight / 2 + scrollTop
    })

    const rootBlock = this.draggedTree.find(({ id }) => id == 0)

    rootBlock.x = this.draggedElement.position().left + this.draggedElement.position().width / 2
    rootBlock.y = this.draggedElement.position().top + this.draggedElement.position().height / 2

    this.appendBlocks(this.draggedTree)
    this.draggedTree.splice(0)
  }

  inSnapZoneFor = block => {
    const { x, y, width, height } = block
    const { left, top, width: draggedWidth } = this.draggedElement.position()
    const { scrollLeft, scrollTop } = this.position()

    const zoneX = left + draggedWidth / 2 + scrollLeft
    const zoneY = top + scrollTop

    return (
      zoneX >= x - width / 2 - this.spacingX &&
      zoneX <= x + width / 2 + this.spacingX &&
      zoneY >= y - height / 2 &&
      zoneY <= y + height
    )
  }

  inDropZone = () => {
    const { top, left } = this.draggedElement.position()

    return top > this.position().top && left > this.position().left
  }

  drop = () => {
    const { top, left, scrollTop, scrollLeft } = this.position()

    this.draggedElement.styles({
      top: this.draggedElement.position().top - top + scrollTop,
      left: this.draggedElement.position().left - left + scrollLeft
    })

    this.appendChild(this.draggedElement.node)
    this.addBlockForElement(this.draggedElement)
  }

  cancelDrop = () => {
    this.appendChild(this.indicator())
    this.toggleDragger(false, { remove: true })
  }

  indicator = () => this.document.querySelector('.indicator')

  showIndicator = (show, block) => {
    const indicator = this.indicator()

    if (show) {
      if (block) {
        const blockElement = this.findBlockElement(block.id)
        blockElement.node.appendChild(indicator)

        indicator.style.left = this.draggedElement.position().width / 2 - 5
        indicator.style.top = blockElement.position().height
      }

      indicator.classList.remove('invisible')
    } else if (!indicator.classList.contains('invisible')) {
      indicator.classList.add('invisible')
    }
  }

  updateDragPosition = () => {
    const { mouseX, mouseY, dragX, dragY } = this.state

    this.draggedElement.styles({
      left: mouseX - dragX,
      top: mouseY - dragY
    })
  }

  updateRearrangePosition = () => {
    const { mouseX, mouseY, dragX, dragY } = this.state
    const { left, top, scrollLeft, scrollTop } = this.position()

    this.draggedElement.styles({
      left: mouseX - dragX - left + scrollLeft,
      top: mouseY - dragY - top + scrollTop
    })
  }

  setState = state => {
    return Object.assign(this.state, state)
  }

  getState = key => this.state[key]

  toggleDragging = dragging => {
    this.isDragging = dragging
  }

  toggleDraggingBlock = dragging => {
    this.isDraggingBlock = dragging
  }

  toggleRearranging = rearranging => {
    this.isRearranging = rearranging
  }

  toggleLastEvent = last => {
    this.isLastEvent = last
  }
}

export default Canvas
