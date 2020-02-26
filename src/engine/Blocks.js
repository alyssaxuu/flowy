class Blocks {
  constructor({ document, canvas }) {
    this.document = document
    this.canvas = canvas
    this.blocks = []
    this.initialized = false
  }

  initialize = () => {
    if (this.initialized) {
      return
    }

    var el = this.document.createElement('DIV')

    el.classList.add('indicator')
    el.classList.add('invisible')

    this.canvas.appendChild(el)
  }

  html = html => {
    if (html !== undefined) {
      this.canvas.innerHtml = html
    }
    return this.canvas.innerHtml
  }

  import = output => {
    const { html, blockarr } = output

    this.html(JSON.parse(html))
    this.blocks.splice(0, this.blocks.length, ...blockarr)
  }

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

  deleteAll = function() {
    this.html("<div class='indicator invisible'></div>")
    this.blocks.splice(0)
  }
}

export default Blocks
