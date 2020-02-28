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

    this.maxWidth = Math.max(childWidth, width)
  }
}

export default Block
