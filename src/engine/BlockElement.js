import ArrowElement from './ArrowElement'

class BlockElement {
  static find = (id, { window }) => {
    const { document } = window
    const node = document.querySelector(`.blockid[value='${id}']`)

    return node ? new this(id, node.parentNode, { window }) : null
  }

  static fromElement = (node, { window }) => {
    const input = node.querySelector(`.blockid`)

    return input ? new this(parseInt(input.value), node, { window }) : null
  }

  constructor(id, node, { window }) {
    this.id = parseInt(id)
    this.node = node
    this.window = window
  }

  position = () => {
    const { top, left } = this.node.getBoundingClientRect()
    const { height, width } = this.window.getComputedStyle(this.node)

    return {
      top: top + this.window.scrollY,
      left: left + this.window.scrollX,
      height: parseInt(height),
      width: parseInt(width)
    }
  }

  styles = styles => {
    return Object.assign(this.node.style, styles)
  }

  arrow = () => {
    return ArrowElement.find(this)
  }
}

export default BlockElement
