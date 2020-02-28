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
  }

  initialize = () => {
    if (this.isInitialized) {
      return
    }

    this.isInitialized = true

    var el = this.document.createElement('DIV')

    el.classList.add('indicator')
    el.classList.add('invisible')

    this.node.appendChild(el)
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

  createDragger = grabbedNode => {
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
      left: `${mouseX - dragX}px`,
      top: `${mouseY - dragY}px`
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
    this.blocks.push(
      new Block({
        parent,
        childWidth,
        id: blockElement.id,
        x: blockElement.position().left + blockElement.position().width / 2 + this.position().scrollLeft,
        y: blockElement.position().top + blockElement.position().height / 2 + this.position().scrollTop,
        width: blockElement.position().width,
        height: blockElement.position().height
      })
    )
  }

  findBlockForElement = blockElement => this.blocks.find(({ id }) => id === blockElement.id)

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
      this.findBlockElement(block.id)
        .arrow()
        .remove()
    }
  }

  childBlocksFor = block => {
    return this.blocks.filter(({ parent }) => parent == block.id)
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

  indicator = () => this.document.querySelector('.indicator')

  showIndicator = show => {
    const { classList } = this.indicator()

    if (!show) {
      classList.remove('invisible')
    } else if (!classList.contains('invisible')) {
      classList.add('invisible')
    }
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
    console.log('[toggleLastEvent]', last)
    this.isLastEvent = last
  }
}

export default Canvas
