class ArrowElement {
  static find = block => {
    const element = document.querySelector(`.arrowid[value='${block.id}']`).parentNode

    if (element) {
      return new this(block, element)
    }
  }

  constructor(block, element) {
    this.block = block
    this.element = element
    this.window = block.window
    this.document = block.document
  }

  html = html => {
    if (html !== undefined) {
      this.element.innerHTML = html
    }
    return this.element.innerHTML
  }

  position = () => ({
    top: this.element.getBoundingClientRect().top + this.window.scrollY,
    left: this.element.getBoundingClientRect().left + this.window.scrollX
  })

  styles = styles => Object.assign(this.element.style, styles)

  remove = () => this.element.remove()
}

export default ArrowElement
