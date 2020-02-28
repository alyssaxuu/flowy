class ArrowElement {
  static find = blockElement => {
    const { document } = blockElement.window
    const node = document.querySelector(`.arrowid[value='${blockElement.id}']`)

    return node ? new this(blockElement, node.parentNode) : null
  }

  constructor(blockElement, node) {
    this.blockElement = blockElement
    this.node = node
    this.window = blockElement.window
    this.document = blockElement.document
  }

  html = html => {
    if (html !== undefined) {
      this.node.innerHTML = html
    }
    return this.node.innerHTML
  }

  position = () => ({
    top: this.node.getBoundingClientRect().top + this.window.scrollY,
    left: this.node.getBoundingClientRect().left + this.window.scrollX
  })

  styles = styles => {
    return Object.assign(this.node.style, styles)
  }

  remove = () => {
    this.node.remove()
  }
}

export default ArrowElement
