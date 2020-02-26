class Blocks {
  constructor({ document, canvas, spacingX = 20, spacingY = 80 }) {
    this.document = document
    this.canvas = canvas
    this.spacingX = spacingX
    this.spacingY = spacingY

    this.blocks = []
    this.isInitialized = false
    this.isDragging = false
    this.isDraggingBlock = false
    this.isRearranging = false
    this.isLastEvent = false
  }

  initialize = () => {
    if (this.isInitialized) {
      return
    }

    var el = this.document.createElement('DIV')

    el.classList.add('indicator')
    el.classList.add('invisible')

    this.canvas.appendChild(el)
  }

  position = () => {
    return Object.assign(this.canvas.getBoundingClientRect(), {
      scrollTop: this.canvas.scrollTop,
      scrollLeft: this.canvas.scrollLeft
    })
  }

  html = html => {
    if (html !== undefined) {
      this.canvas.innerHtml = html
    }
    return this.canvas.innerHtml
  }

  appendHtml = html => (this.canvas.innerHTML += html)

  appendChild = child => this.canvas.appendChild(child)

  import = output => {
    const { html, blockarr } = output

    this.html(JSON.parse(html))
    this.replaceBlocks(blockarr)
  }

  replaceBlocks = blocks => this.blocks.splice(0, this.blocks.length, ...blocks)

  appendBlocks = blocks => this.blocks.push(...blocks)

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

  deleteAll = () => {
    this.html("<div class='indicator invisible'></div>")
    this.blocks.splice(0)
  }

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

export default Blocks
