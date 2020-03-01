class Block {
  constructor({ parent, childWidth, id, x, y, width, height }) {
    Object.assign(this, {
      parent,
      childWidth,
      id,
      x,
      y,
      width,
      height
    })
  }

  maxWidth = () => Math.max(this.childWidth, this.width)
}

export default Block
