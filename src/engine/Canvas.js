import Block from './Block'

class Canvas {
  constructor({ window, document, canvas, spacingX = 20, spacingY = 80 }) {
    this.window = window
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

    this.isInitialized = true

    var el = this.document.createElement('DIV')

    el.classList.add('indicator')
    el.classList.add('invisible')

    this.canvas.appendChild(el)
  }

  position = () => {
    const { top, left } = this.canvas.getBoundingClientRect()
    return {
      top: top + this.window.scrollY,
      left: left + this.window.scrollX,
      scrollTop: this.canvas.scrollTop,
      scrollLeft: this.canvas.scrollLeft
    }
  }

  html = html => {
    if (html !== undefined) {
      this.canvas.innerHTML = html
    }
    return this.canvas.innerHTML
  }

  appendHtml = html => (this.canvas.innerHTML += html)

  appendChild = (...children) => children.forEach(child => this.canvas.appendChild(child))

  findElement = selector => this.document.querySelector(selector)

  findBlock = id => Block.find(id, { window: this.window })

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

  reset = () => {
    this.html("<div class='indicator invisible'></div>")
    this.blocks.splice(0)
  }

  indicator = () => this.document.querySelector('.indicator')

  showIndicator = show => {
    const { classList } = this.indicator()

    if (!show) {
      classList.remove('invisible')
    } else if (!classList.contains('invisible')) {
      classList.add('invisible')
    }
  }
}

export default Canvas
