import BlockElement from './BlockElement'

class Manager {
  constructor({ window, document }) {
    this.window = window
    this.document = document
    this.state = {}
    this.isDragging = false
    this.isDraggingBlock = false
    this.isRearranging = false
    this.isLastEvent = false
    this.grabbedElement = null
    this.draggedBlock = null
  }

  createDragger = (grabbedElement, blocksManager) => {
    const { mouseX, mouseY } = this.state
    const draggedElement = grabbedElement.cloneNode(true)
    const blocks = blocksManager.blocks
    const id = blocks.length === 0 ? 0 : Math.max(...blocks.map(({ id }) => id)) + 1

    draggedElement.classList.remove('create-flowy')
    draggedElement.innerHTML += `<input type='hidden' name='blockid' class='blockid' value='${id}'>`

    this.document.body.appendChild(draggedElement)

    this.grabbedElement = grabbedElement

    this.registerDragger(draggedElement)

    const { dragX, dragY } = this.setState({
      dragX: mouseX - grabbedElement.offsetLeft,
      dragY: mouseY - grabbedElement.offsetTop
    })

    this.draggedBlock.styles({
      left: `${mouseX - dragX}px`,
      top: `${mouseY - dragY}px`
    })

    this.toggleDragger(true)

    return draggedElement
  }

  registerDragger = draggedElement => {
    this.draggedBlock = BlockElement.fromElement(draggedElement, { window: this.window })
  }

  toggleDragger = (start, { remove = false } = {}) => {
    const draggedElement = this.draggedBlock.node

    if (start) {
      this.grabbedElement.classList.add('dragnow')
      draggedElement.classList.add('dragging')
      draggedElement.classList.add('block')
    } else {
      this.grabbedElement.classList.remove('dragnow')
      draggedElement.classList.remove('dragging')

      if (remove) {
        draggedElement.remove()
      }
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
    this.isLastEvent = last
  }
}

export default Manager
