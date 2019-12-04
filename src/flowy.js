/* global $ */

const flowy = function (canvas, grab, release, snapping, spacingX, spacingY) {
  if (!grab) {
    grab = function () {}
  }
  if (!release) {
    release = function () {}
  }
  if (!snapping) {
    snapping = function () {
      return true
    }
  }
  if (!spacingX) {
    spacingX = 20
  }
  if (!spacingY) {
    spacingY = 80
  }
  $(document).ready(function () {
    var blocks = []
    var blockstemp = []
    var canvasDiv = canvas
    var active = false
    var paddingx = spacingX
    var paddingy = spacingY
    var offsetleft = 0
    var offsetleftold = 0
    var rearrange = false
    var lastevent = false
    var drag, dragx, dragy, original
    var mouseX, mouseY
    canvasDiv.append("<div class='indicator invisible'></div>")
    flowy.import = function (output) {
      canvasDiv.html(JSON.parse(output.html))
      blocks = output.blockarr
    }
    flowy.output = function () {
      var htmlSer = JSON.stringify(canvasDiv.html())
      var jsonData = { html: htmlSer, blockarr: blocks, blocks: [] }
      if (blocks.length > 0) {
        for (var i = 0; i < blocks.length; i++) {
          jsonData.blocks.push({
            id: blocks[i].id,
            parent: blocks[i].parent,
            data: []
          })
          $('.blockid[value=' + blocks[i].id + ']').parent().children('input').each(function () {
            var jsonName = $(this).attr('name')
            var jsonValue = $(this).val()
            jsonData.blocks[i].data.push({
              name: jsonName,
              value: jsonValue
            })
          })
        }
        return jsonData
      }
    }
    flowy.deleteBlocks = function () {
      blocks = []
      canvasDiv.html("<div class='indicator invisible'></div>")
    }
    $(document).on('mousedown touchstart', '.create-flowy', function (event) {
      if (event.targetTouches) {
        mouseX = event.changedTouches[0].clientX
        mouseY = event.changedTouches[0].clientY
      } else {
        mouseX = event.clientX
        mouseY = event.clientY
      }
      if (event.which !== 3) {
        original = $(this)
        if (blocks.length === 0) {
          $(this).clone().addClass('block').append("<input type='hidden' name='blockid' class='blockid' value='" + blocks.length + "'>").removeClass('create-flowy').appendTo('body')
          $(this).addClass('dragnow')
          drag = $('.blockid[value=' + blocks.length + ']').parent()
        } else {
          $(this).clone().addClass('block').append("<input type='hidden' name='blockid' class='blockid' value='" + (Math.max.apply(Math, blocks.map(a => a.id)) + 1) + "'>").removeClass('create-flowy').appendTo('body')
          $(this).addClass('dragnow')
          drag = $('.blockid[value=' + (parseInt(Math.max.apply(Math, blocks.map(a => a.id))) + 1) + ']').parent()
        }
        blockGrabbed($(this))
        drag.addClass('dragging')
        active = true
        dragx = mouseX - $(this).offset().left
        dragy = mouseY - $(this).offset().top
        drag.css('left', mouseX - dragx + 'px')
        drag.css('top', mouseY - dragy + 'px')
      }
    })
    $(document).on('mouseup touchend', function (event) {
      if (event.which !== 3 && (active || rearrange)) {
        blockReleased()
        if (!$('.indicator').hasClass('invisible')) {
          $('.indicator').addClass('invisible')
        }
        if (active) {
          original.removeClass('dragnow')
          drag.removeClass('dragging')
        }
        if (parseInt(drag.children('.blockid').val()) === 0 && rearrange) {
          drag.removeClass('dragging')
          rearrange = false
          for (var w = 0; w < blockstemp.length; w++) {
            if (blockstemp[w].id !== parseInt(drag.children('.blockid').val())) {
              $('.blockid[value=' + blockstemp[w].id + ']').parent().css('left', $('.blockid[value=' + blockstemp[w].id + ']').parent().offset().left - canvasDiv.offset().left + canvasDiv.scrollLeft())
              $('.blockid[value=' + blockstemp[w].id + ']').parent().css('top', $('.blockid[value=' + blockstemp[w].id + ']').parent().offset().top - canvasDiv.offset().top + canvasDiv.scrollTop())
              $('.arrowid[value=' + blockstemp[w].id + ']').parent().css('left', $('.arrowid[value=' + blockstemp[w].id + ']').parent().offset().left - canvasDiv.offset().left + canvasDiv.scrollLeft())
              $('.arrowid[value=' + blockstemp[w].id + ']').parent().css('top', $('.arrowid[value=' + blockstemp[w].id + ']').parent().offset().top - canvasDiv.offset().top + canvasDiv.scrollTop() + 'px')
              $('.blockid[value=' + blockstemp[w].id + ']').parent().appendTo(canvasDiv)
              $('.arrowid[value=' + blockstemp[w].id + ']').parent().appendTo(canvasDiv)

              blockstemp[w].x = $('.blockid[value=' + blockstemp[w].id + ']').parent().offset().left + ($('.blockid[value=' + blockstemp[w].id + ']').innerWidth() / 2) + canvasDiv.scrollLeft()
              blockstemp[w].y = $('.blockid[value=' + blockstemp[w].id + ']').parent().offset().top + ($('.blockid[value=' + blockstemp[w].id + ']').parent().innerHeight() / 2) + canvasDiv.scrollTop()
            }
          }
          blockstemp.filter(a => a.id === 0)[0].x = drag.offset().left + (drag.innerWidth() / 2)
          blockstemp.filter(a => a.id === 0)[0].y = drag.offset().top + (drag.innerHeight() / 2)
          blocks = $.merge(blocks, blockstemp)
          blockstemp = []
        } else if (active && blocks.length === 0 && drag.offset().top > canvasDiv.offset().top && drag.offset().left > canvasDiv.offset().left) {
          blockSnap(drag, true, undefined)
          active = false
          drag.css('top', drag.offset().top - canvasDiv.offset().top + canvasDiv.scrollTop() + 'px')
          drag.css('left', drag.offset().left - canvasDiv.offset().left + canvasDiv.scrollLeft() + 'px')
          drag.appendTo(canvasDiv)
          blocks.push({
            parent: -1,
            childwidth: 0,
            id: parseInt(drag.children('.blockid').val()),
            x: drag.offset().left + (drag.innerWidth() / 2) + canvasDiv.scrollLeft(),
            y: drag.offset().top + (drag.innerHeight() / 2) + canvasDiv.scrollTop(),
            width: drag.innerWidth(),
            height: drag.innerHeight()
          })
        } else if (active && blocks.length === 0) {
          drag.remove()
        } else if (active || rearrange) {
          var xpos = drag.offset().left + (drag.innerWidth() / 2) + canvasDiv.scrollLeft()
          var ypos = drag.offset().top + canvasDiv.scrollTop()
          var blocko = blocks.map(a => a.id)
          for (var i = 0; i < blocks.length; i++) {
            if (xpos >= blocks.filter(a => a.id === blocko[i])[0].x - (blocks.filter(a => a.id === blocko[i])[0].width / 2) - paddingx && xpos <= blocks.filter(a => a.id === blocko[i])[0].x + (blocks.filter(a => a.id === blocko[i])[0].width / 2) + paddingx && ypos >= blocks.filter(a => a.id === blocko[i])[0].y - (blocks.filter(a => a.id === blocko[i])[0].height / 2) && ypos <= blocks.filter(a => a.id === blocko[i])[0].y + blocks.filter(a => a.id === blocko[i])[0].height) {
              active = false
              if (!rearrange && blockSnap(drag, false, blocks.filter(id => id.id === blocko[i])[0])) {
                snap(drag, i, blocko)
              } else if (rearrange) {
                snap(drag, i, blocko)
              }
              break
            } else if (i === blocks.length - 1) {
              if (rearrange) {
                rearrange = false
                blockstemp = []
              }
              active = false
              drag.remove()
            }
          }
        }
      }
    })
    function snap (drag, i, blocko) {
      if (!rearrange) {
        drag.appendTo(canvasDiv)
      }
      var totalwidth = 0
      var totalremove = 0
      var maxheight = 0
      for (var w = 0; w < blocks.filter(id => id.parent === blocko[i]).length; w++) {
        var children = blocks.filter(id => id.parent === blocko[i])[w]
        if (children.childwidth > children.width) {
          totalwidth += children.childwidth + paddingx
        } else {
          totalwidth += children.width + paddingx
        }
      }
      totalwidth += drag.innerWidth()
      for (var w = 0; w < blocks.filter(id => id.parent === blocko[i]).length; w++) {
        var children = blocks.filter(id => id.parent === blocko[i])[w]
        if (children.childwidth > children.width) {
          $('.blockid[value=' + children.id + ']').parent().css('left', blocks.filter(a => a.id === blocko[i])[0].x - (totalwidth / 2) + totalremove + (children.childwidth / 2) - (children.width / 2) + 'px')
          children.x = blocks.filter(id => id.parent === blocko[i])[0].x - (totalwidth / 2) + totalremove + (children.childwidth / 2)
          totalremove += children.childwidth + paddingx
        } else {
          $('.blockid[value=' + children.id + ']').parent().css('left', blocks.filter(a => a.id === blocko[i])[0].x - (totalwidth / 2) + totalremove + 'px')
          children.x = blocks.filter(id => id.parent === blocko[i])[0].x - (totalwidth / 2) + totalremove + (children.width / 2)
          totalremove += children.width + paddingx
        }
      }
      drag.css('left', blocks.filter(id => id.id === blocko[i])[0].x - (totalwidth / 2) + totalremove - canvasDiv.offset().left + canvasDiv.scrollLeft() + 'px')
      drag.css('top', blocks.filter(id => id.id === blocko[i])[0].y + (blocks.filter(id => id.id === blocko[i])[0].height / 2) + paddingy - canvasDiv.offset().top + 'px')
      if (rearrange) {
        blockstemp.filter(a => a.id === parseInt(drag.children('.blockid').val()))[0].x = drag.offset().left + (drag.innerWidth() / 2) + canvasDiv.scrollLeft() + canvasDiv.scrollLeft()
        blockstemp.filter(a => a.id === parseInt(drag.children('.blockid').val()))[0].y = drag.offset().top + (drag.innerHeight() / 2) + canvasDiv.scrollTop()
        blockstemp.filter(a => a.id === drag.children('.blockid').val())[0].parent = blocko[i]
        for (var w = 0; w < blockstemp.length; w++) {
          if (blockstemp[w].id !== parseInt(drag.children('.blockid').val())) {
            $('.blockid[value=' + blockstemp[w].id + ']').parent().css('left', $('.blockid[value=' + blockstemp[w].id + ']').parent().offset().left - canvasDiv.offset().left + canvasDiv.scrollLeft())
            $('.blockid[value=' + blockstemp[w].id + ']').parent().css('top', $('.blockid[value=' + blockstemp[w].id + ']').parent().offset().top - canvasDiv.offset().top + canvasDiv.scrollTop())
            $('.arrowid[value=' + blockstemp[w].id + ']').parent().css('left', $('.arrowid[value=' + blockstemp[w].id + ']').parent().offset().left - canvasDiv.offset().left + canvasDiv.scrollLeft() + 20)
            $('.arrowid[value=' + blockstemp[w].id + ']').parent().css('top', $('.arrowid[value=' + blockstemp[w].id + ']').parent().offset().top - canvasDiv.offset().top + canvasDiv.scrollTop())
            $('.blockid[value=' + blockstemp[w].id + ']').parent().appendTo(canvasDiv)
            $('.arrowid[value=' + blockstemp[w].id + ']').parent().appendTo(canvasDiv)

            blockstemp[w].x = $('.blockid[value=' + blockstemp[w].id + ']').parent().offset().left + ($('.blockid[value=' + blockstemp[w].id + ']').innerWidth() / 2) + canvasDiv.scrollLeft()
            blockstemp[w].y = $('.blockid[value=' + blockstemp[w].id + ']').parent().offset().top + ($('.blockid[value=' + blockstemp[w].id + ']').parent().innerHeight() / 2) + canvasDiv.scrollTop()
          }
        }
        blocks = $.merge(blocks, blockstemp)
        blockstemp = []
      } else {
        blocks.push({
          childwidth: 0,
          parent: blocko[i],
          id: parseInt(drag.children('.blockid').val()),
          x: drag.offset().left + (drag.innerWidth() / 2) + canvasDiv.scrollLeft(),
          y: drag.offset().top + (drag.innerHeight() / 2) + canvasDiv.scrollTop(),
          width: drag.innerWidth(),
          height: drag.innerHeight()
        })
      }
      var arrowhelp = blocks.filter(a => a.id === parseInt(drag.children('.blockid').val()))[0]
      var arrowx = arrowhelp.x - blocks.filter(a => a.id === blocko[i])[0].x + 20
      var arrowy = arrowhelp.y - (arrowhelp.height / 2) - (blocks.filter(id => id.parent === blocko[i])[0].y + (blocks.filter(id => id.parent === blocko[i])[0].height / 2)) + canvasDiv.scrollTop()
      if (arrowx < 0) {
        drag.after('<div class="arrowblock"><input type="hidden" class="arrowid" value="' + drag.children('.blockid').val() + '"><svg preserveaspectratio="none" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M' + (blocks.filter(a => a.id === blocko[i])[0].x - arrowhelp.x + 5) + ' 0L' + (blocks.filter(a => a.id === blocko[i])[0].x - arrowhelp.x + 5) + ' ' + (paddingy / 2) + 'L5 ' + (paddingy / 2) + 'L5 ' + arrowy + '" stroke="#C5CCD0" stroke-width="2px"/><path d="M0 ' + (arrowy - 5) + 'H10L5 ' + arrowy + 'L0 ' + (arrowy - 5) + 'Z" fill="#C5CCD0"/></svg></div>')
        $('.arrowid[value=' + drag.children('.blockid').val() + ']').parent().css('left', (arrowhelp.x - 5) - canvasDiv.offset().left + canvasDiv.scrollLeft() + 'px')
      } else {
        drag.after('<div class="arrowblock"><input type="hidden" class="arrowid" value="' + drag.children('.blockid').val() + '"><svg preserveaspectratio="none" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M20 0L20 ' + (paddingy / 2) + 'L' + (arrowx) + ' ' + (paddingy / 2) + 'L' + arrowx + ' ' + arrowy + '" stroke="#C5CCD0" stroke-width="2px"/><path d="M' + (arrowx - 5) + ' ' + (arrowy - 5) + 'H' + (arrowx + 5) + 'L' + arrowx + ' ' + arrowy + 'L' + (arrowx - 5) + ' ' + (arrowy - 5) + 'Z" fill="#C5CCD0"/></svg></div>')
        $('.arrowid[value=' + parseInt(drag.children('.blockid').val()) + ']').parent().css('left', blocks.filter(a => a.id === blocko[i])[0].x - 20 - canvasDiv.offset().left + canvasDiv.scrollLeft() + 'px')
      }
      $('.arrowid[value=' + parseInt(drag.children('.blockid').val()) + ']').parent().css('top', blocks.filter(a => a.id === blocko[i])[0].y + (blocks.filter(a => a.id === blocko[i])[0].height / 2) + 'px')
      if (blocks.filter(a => a.id === blocko[i])[0].parent !== -1) {
        var flag = false
        var idval = blocko[i]
        while (!flag) {
          if (blocks.filter(a => a.id === idval)[0].parent === -1) {
            flag = true
          } else {
            var zwidth = 0
            for (var w = 0; w < blocks.filter(id => id.parent === idval).length; w++) {
              var children = blocks.filter(id => id.parent === idval)[w]
              if (children.childwidth > children.width) {
                if (w === blocks.filter(id => id.parent === idval).length - 1) {
                  zwidth += children.childwidth
                } else {
                  zwidth += children.childwidth + paddingx
                }
              } else {
                if (w === blocks.filter(id => id.parent === idval).length - 1) {
                  zwidth += children.width
                } else {
                  zwidth += children.width + paddingx
                }
              }
            }
            blocks.filter(a => a.id === idval)[0].childwidth = zwidth
            idval = blocks.filter(a => a.id === idval)[0].parent
          }
        }
        blocks.filter(id => id.id === idval)[0].childwidth = totalwidth
      }
      if (rearrange) {
        rearrange = false
        drag.removeClass('dragging')
      }
      rearrangeMe()
      checkOffset()
    }
    $(document).on('mousedown touchstart', '.block', function (event) {
      $(document).on('mouseup mousemove touchmove', '.block', function handler (event) {
        if (event.targetTouches[0]) {
          mouseX = event.targetTouches[0].clientX
          mouseY = event.targetTouches[0].clientY
        } else {
          mouseX = event.clientX
          mouseY = event.clientY
        }
        if (event.type !== 'mouseup') {
          if (event.which !== 3) {
            if (!active && !rearrange) {
              rearrange = true
              drag = $(this)
              drag.addClass('dragging')
              dragx = mouseX - $(this).offset().left
              dragy = mouseY - $(this).offset().top
              var blockid = parseInt($(this).children('.blockid').val())
              drag = $(this)
              blockstemp.push(blocks.filter(a => a.id === blockid)[0])
              blocks = $.grep(blocks, function (e) {
                return e.id !== blockid
              })
              $('.arrowid[value=' + blockid + ']').parent().remove()
              var layer = blocks.filter(a => a.parent === blockid)
              var flag = false
              var foundids = []
              var allids = []
              while (!flag) {
                for (var i = 0; i < layer.length; i++) {
                  blockstemp.push(blocks.filter(a => a.id === layer[i].id)[0])
                  $('.blockid[value=' + layer[i].id + ']').parent().css('left', $('.blockid[value=' + layer[i].id + ']').parent().offset().left - drag.offset().left)
                  $('.blockid[value=' + layer[i].id + ']').parent().css('top', $('.blockid[value=' + layer[i].id + ']').parent().offset().top - drag.offset().top)
                  $('.arrowid[value=' + layer[i].id + ']').parent().css('left', $('.arrowid[value=' + layer[i].id + ']').parent().offset().left - drag.offset().left)
                  $('.arrowid[value=' + layer[i].id + ']').parent().css('top', $('.arrowid[value=' + layer[i].id + ']').parent().offset().top - drag.offset().top)
                  $('.blockid[value=' + layer[i].id + ']').parent().appendTo(drag)
                  $('.arrowid[value=' + layer[i].id + ']').parent().appendTo(drag)
                  foundids.push(layer[i].id)
                  allids.push(layer[i].id)
                }
                if (foundids.length === 0) {
                  flag = true
                } else {
                  layer = blocks.filter(a => foundids.includes(a.parent))
                  foundids = []
                }
              }
              for (var i = 0; i < blocks.filter(a => a.parent === blockid).length; i++) {
                var blocknumber = blocks.filter(a => a.parent === blockid)[i]
                blocks = $.grep(blocks, function (e) {
                  return e.id !== blocknumber
                })
              }
              for (var i = 0; i < allids.length; i++) {
                var blocknumber = allids[i]
                blocks = $.grep(blocks, function (e) {
                  return e.id !== blocknumber
                })
              }
              if (blocks.length > 1) {
                rearrangeMe()
              }
              if (lastevent) {
                fixOffset()
              }
            }
          }
        }
        $(document).off('mouseup mousemove touchmove', handler)
      })
    })
    $(document).on('mousemove touchmove', function (event) {
      if (event.targetTouches) {
        mouseX = event.targetTouches[0].clientX
        mouseY = event.targetTouches[0].clientY
      } else {
        mouseX = event.clientX
        mouseY = event.clientY
      }
      if (active) {
        drag.css('left', mouseX - dragx + 'px')
        drag.css('top', mouseY - dragy + 'px')
      } else if (rearrange) {
        drag.css('left', mouseX - dragx - canvasDiv.offset().left + canvasDiv.scrollLeft() + 'px')
        drag.css('top', mouseY - dragy - canvasDiv.offset().top + canvasDiv.scrollTop() + 'px')
        blockstemp.filter(a => a.id === parseInt(drag.children('.blockid').val())).x = drag.offset().left + (drag.innerWidth() / 2) + canvasDiv.scrollLeft()
        blockstemp.filter(a => a.id === parseInt(drag.children('.blockid').val())).y = drag.offset().left + (drag.innerHeight() / 2) + canvasDiv.scrollTop()
      }
      if (active || rearrange) {
        var xpos = drag.offset().left + (drag.innerWidth() / 2) + canvasDiv.scrollLeft()
        var ypos = drag.offset().top + canvasDiv.scrollTop()
        var blocko = blocks.map(a => a.id)
        for (var i = 0; i < blocks.length; i++) {
          if (xpos >= blocks.filter(a => a.id === blocko[i])[0].x - (blocks.filter(a => a.id === blocko[i])[0].width / 2) - paddingx && xpos <= blocks.filter(a => a.id === blocko[i])[0].x + (blocks.filter(a => a.id === blocko[i])[0].width / 2) + paddingx && ypos >= blocks.filter(a => a.id === blocko[i])[0].y - (blocks.filter(a => a.id === blocko[i])[0].height / 2) && ypos <= blocks.filter(a => a.id === blocko[i])[0].y + blocks.filter(a => a.id === blocko[i])[0].height) {
            $('.indicator').appendTo($('.blockid[value=' + blocko[i] + ']').parent())
            $('.indicator').css('left', ($('.blockid[value=' + blocko[i] + ']').parent().innerWidth() / 2) - 5 + 'px')
            $('.indicator').css('top', $('.blockid[value=' + blocko[i] + ']').parent().innerHeight() + 'px')
            $('.indicator').removeClass('invisible')
            break
          } else if (i === blocks.length - 1) {
            if (!$('.indicator').hasClass('invisible')) {
              $('.indicator').addClass('invisible')
            }
          }
        }
      }
    })

    function checkOffset () {
      offsetleft = blocks.map(a => a.x)
      var widths = blocks.map(a => a.width)
      var mathmin = offsetleft.map(function (item, index) {
        return item - (widths[index] / 2)
      })
      offsetleft = Math.min.apply(Math, mathmin)
      if (offsetleft < canvasDiv.offset().left) {
        lastevent = true
        var blocko = blocks.map(a => a.id)
        for (var w = 0; w < blocks.length; w++) {
          $('.blockid[value=' + blocks.filter(a => a.id === blocko[w])[0].id + ']').parent().css('left', blocks.filter(a => a.id === blocko[w])[0].x - (blocks.filter(a => a.id === blocko[w])[0].width / 2) - offsetleft + 20)
          if (blocks.filter(a => a.id === blocko[w])[0].parent !== -1) {
            var arrowhelp = blocks.filter(a => a.id === blocko[w])[0]
            var arrowx = arrowhelp.x - blocks.filter(a => a.id === blocks.filter(a => a.id === blocko[w])[0].parent)[0].x
            if (arrowx < 0) {
              $('.arrowid[value=' + blocko[w] + ']').parent().css('left', (arrowhelp.x - offsetleft + 20 - 5) + 'px')
            } else {
              $('.arrowid[value=' + blocko[w] + ']').parent().css('left', blocks.filter(id => id.id === blocks.filter(a => a.id === blocko[w])[0].parent)[0].x - 20 - offsetleft + 20 + 'px')
            }
          }
        }
        for (var w = 0; w < blocks.length; w++) {
          blocks[w].x = $('.blockid[value=' + blocks[w].id + ']').parent().offset().left + canvasDiv.offset().left - ($('.blockid[value=' + blocks[w].id + ']').parent().innerWidth() / 2) - 40
        }
        offsetleftold = offsetleft
      }
    }

    function fixOffset () {
      if (offsetleftold < canvasDiv.offset().left) {
        lastevent = false
        var blocko = blocks.map(a => a.id)
        for (var w = 0; w < blocks.length; w++) {
          $('.blockid[value=' + blocks.filter(a => a.id === blocko[w])[0].id + ']').parent().css('left', blocks.filter(a => a.id === blocko[w])[0].x - (blocks.filter(a => a.id === blocko[w])[0].width / 2) - offsetleftold - 20)
          blocks.filter(a => a.id === blocko[w])[0].x = $('.blockid[value=' + blocks.filter(a => a.id === blocko[w])[0].id + ']').parent().offset().left + (blocks.filter(a => a.id === blocko[w])[0].width / 2)

          if (blocks.filter(a => a.id === blocko[w])[0].parent !== -1) {
            var arrowhelp = blocks.filter(a => a.id === blocko[w])[0]
            var arrowx = arrowhelp.x - blocks.filter(a => a.id === blocks.filter(a => a.id === blocko[w])[0].parent)[0].x
            if (arrowx < 0) {
              $('.arrowid[value=' + blocko[w] + ']').parent().css('left', (arrowhelp.x - 5 - canvasDiv.offset().left) + 'px')
            } else {
              $('.arrowid[value=' + blocko[w] + ']').parent().css('left', blocks.filter(id => id.id === blocks.filter(a => a.id === blocko[w])[0].parent)[0].x - 20 - canvasDiv.offset().left + 'px')
            }
          }
        }
        for (var w = 0; w < blocks.length; w++) {
          // blocks[w].x = blocks[w].x+offsetleftold-20;
        }
        offsetleftold = 0
      }
    }

    function rearrangeMe () {
      var result = blocks.map(a => a.parent)
      for (var z = 0; z < result.length; z++) {
        if (result[z] === -1) {
          z++
        }
        var totalwidth = 0
        var totalremove = 0
        var maxheight = 0
        for (var w = 0; w < blocks.filter(id => id.parent === result[z]).length; w++) {
          var children = blocks.filter(id => id.parent === result[z])[w]
          if (blocks.filter(id => id.parent === children.id).length === 0) {
            children.childwidth = 0
          }
          if (children.childwidth > children.width) {
            if (w === blocks.filter(id => id.parent === result[z]).length - 1) {
              totalwidth += children.childwidth
            } else {
              totalwidth += children.childwidth + paddingx
            }
          } else {
            if (w === blocks.filter(id => id.parent === result[z]).length - 1) {
              totalwidth += children.width
            } else {
              totalwidth += children.width + paddingx
            }
          }
        }
        if (result[z] !== -1) {
          blocks.filter(a => a.id === result[z])[0].childwidth = totalwidth
        }
        for (var w = 0; w < blocks.filter(id => id.parent === result[z]).length; w++) {
          var children = blocks.filter(id => id.parent === result[z])[w]
          $('.blockid[value=' + children.id + ']').parent().css('top', blocks.filter(id => id.id === result[z]).y + paddingy + 'px')
          blocks.filter(id => id.id === result[z]).y = blocks.filter(id => id.id === result[z]).y + paddingy
          if (children.childwidth > children.width) {
            $('.blockid[value=' + children.id + ']').parent().css('left', blocks.filter(id => id.id === result[z])[0].x - (totalwidth / 2) + totalremove + (children.childwidth / 2) - (children.width / 2) - canvasDiv.offset().left + 'px')
            children.x = blocks.filter(id => id.id === result[z])[0].x - (totalwidth / 2) + totalremove + (children.childwidth / 2)
            totalremove += children.childwidth + paddingx
          } else {
            $('.blockid[value=' + children.id + ']').parent().css('left', blocks.filter(id => id.id === result[z])[0].x - (totalwidth / 2) + totalremove - canvasDiv.offset().left + 'px')
            children.x = blocks.filter(id => id.id === result[z])[0].x - (totalwidth / 2) + totalremove + (children.width / 2)
            totalremove += children.width + paddingx
          }
          var arrowhelp = blocks.filter(a => a.id === children.id)[0]
          var arrowx = arrowhelp.x - blocks.filter(a => a.id === children.parent)[0].x + 20
          var arrowy = arrowhelp.y - (arrowhelp.height / 2) - (blocks.filter(a => a.id === children.parent)[0].y + (blocks.filter(a => a.id === children.parent)[0].height / 2))
          $('.arrowid[value=' + children.id + ']').parent().css('top', blocks.filter(id => id.id === children.parent)[0].y + (blocks.filter(id => id.id === children.parent)[0].height / 2) - canvasDiv.offset().top + 'px')
          if (arrowx < 0) {
            $('.arrowid[value=' + children.id + ']').parent().css('left', (arrowhelp.x - 5) - canvasDiv.offset().left + 'px')
            $('.arrowid[value=' + children.id + ']').parent().html('<input type="hidden" class="arrowid" value="' + children.id + '"><svg preserveaspectratio="none" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M' + (blocks.filter(id => id.id === children.parent)[0].x - arrowhelp.x + 5) + ' 0L' + (blocks.filter(id => id.id === children.parent)[0].x - arrowhelp.x + 5) + ' ' + (paddingy / 2) + 'L5 ' + (paddingy / 2) + 'L5 ' + arrowy + '" stroke="#C5CCD0" stroke-width="2px"/><path d="M0 ' + (arrowy - 5) + 'H10L5 ' + arrowy + 'L0 ' + (arrowy - 5) + 'Z" fill="#C5CCD0"/></svg>')
          } else {
            $('.arrowid[value=' + children.id + ']').parent().css('left', blocks.filter(id => id.id === children.parent)[0].x - 20 - canvasDiv.offset().left + 'px')
            $('.arrowid[value=' + children.id + ']').parent().html('<input type="hidden" class="arrowid" value="' + children.id + '"><svg preserveaspectratio="none" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M20 0L20 ' + (paddingy / 2) + 'L' + (arrowx) + ' ' + (paddingy / 2) + 'L' + arrowx + ' ' + arrowy + '" stroke="#C5CCD0" stroke-width="2px"/><path d="M' + (arrowx - 5) + ' ' + (arrowy - 5) + 'H' + (arrowx + 5) + 'L' + arrowx + ' ' + arrowy + 'L' + (arrowx - 5) + ' ' + (arrowy - 5) + 'Z" fill="#C5CCD0"/></svg>')
          }
        }
      }
    }
  })

  function blockGrabbed (block) {
    grab(block)
  }

  function blockReleased () {
    release()
  }

  function blockSnap (drag, first, parent) {
    return snapping(drag, first, parent)
  }
}

export default flowy
