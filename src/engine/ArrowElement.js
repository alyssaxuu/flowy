class ArrowElement {
  static find = block => {
    const node = document.querySelector(`.arrowid[value='${block.id}']`).parentNode

    if (node) {
      return new this(block, node)
    }
  }

  constructor(block, node) {
    this.block = block
    this.node = node
    this.window = block.window
    this.document = block.document
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

  styles = styles => Object.assign(this.node.style, styles)

  remove = () => this.node.remove()
}

export default ArrowElement
