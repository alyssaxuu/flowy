import Arrow from './Arrow'

class Block {
  static find = (id, { window }) => {
    const { document } = window
    const element = document.querySelector(`.blockid[value='${id}']`).parentNode

    return element ? new Block(id, element, { window }) : null
  }

  static fromElement = (element, { window }) => {
    const input = element.querySelector(`.blockid`)

    return input ? new Block(parseInt(input.value), element, { window }) : null
  }

  constructor(id, element, { window }) {
    this.id = parseInt(id)
    this.element = element
    this.window = window
  }

  position = () => {
    const { height, width } = this.window.getComputedStyle(this.element)

    return {
      top: this.element.getBoundingClientRect().top + this.window.scrollY,
      left: this.element.getBoundingClientRect().left + this.window.scrollX,
      height: parseInt(height),
      width: parseInt(width)
    }
  }

  styles = styles => Object.assign(this.element.style, styles)

  arrow = () => Arrow.find(this)
}

export default Block
