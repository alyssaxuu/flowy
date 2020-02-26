class Dragger {
  constructor() {
    this.state = {}
    this.isDragging = false
    this.isDraggingBlock = false
    this.isRearranging = false
    this.isLastEvent = false
    this.grabbedElement = null
  }

  createDragger = (grabbedElement, blocksManager) => {
    const draggedElement = grabbedElement.cloneNode(true)
    const blocks = blocksManager.blocks
    const id = blocks.length === 0 ? 0 : Math.max(...blocks.map(({ id }) => id)) + 1

    grabbedElement.classList.add('dragnow')
    draggedElement.classList.add('block')
    draggedElement.classList.remove('create-flowy')
    draggedElement.classList.add('dragging')
    draggedElement.innerHTML += `<input type='hidden' name='blockid' class='blockid' value='${id}'>`

    document.body.appendChild(draggedElement)

    this.grabbedElement = grabbedElement
    this.draggedElement = draggedElement

    return this.draggedElement
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

export default Dragger
