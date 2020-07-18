"use strict";

function _newArrowCheck(innerThis, boundThis) { if (innerThis !== boundThis) { throw new TypeError("Cannot instantiate an arrow function"); } }

var flowy = function flowy(wrapperElement, grab, release, snapping, rearrange, spacing_x, spacing_y) {
  if (!grab) {
    grab = function grab() {};
  }

  if (!release) {
    release = function release() {};
  }

  if (!snapping) {
    snapping = function snapping() {
      return true;
    };
  }

  if (!rearrange) {
    rearrange = function rearrange() {
      return false;
    };
  }

  if (!spacing_x) {
    spacing_x = 20;
  }

  if (!spacing_y) {
    spacing_y = 80;
  }

  if (!Element.prototype.matches) {
    Element.prototype.matches = Element.prototype.msMatchesSelector || Element.prototype.webkitMatchesSelector;
  }

  if (!Element.prototype.closest) {
    Element.prototype.closest = function (s) {
      var el = this;

      do {
        if (Element.prototype.matches.call(el, s)) return el;
        el = el.parentElement || el.parentNode;
      } while (el !== null && el.nodeType === 1);

      return null;
    };
  }

  var loaded = false;

  flowy.load = function () {
    if (!loaded) loaded = true;else return;
    var blocks = [];
    var blockstemp = [];
    var canvas_div = wrapperElement.querySelector('#canvas');
    var active = false;
    var paddingx = spacing_x;
    var paddingy = spacing_y;
    var offsetleft = 0;
    var offsetleftold = 0;
    var rearrange = false;
    var lastevent = false;
    var drag, dragx, dragy, original;
    var mouse_x, mouse_y;
    var dragblock = false;
    var prevblock = 0;
    var el = document.createElement("DIV");
    el.classList.add('indicator');
    el.classList.add('invisible');
    canvas_div.appendChild(el);

    flowy.import = function (output) {
      canvas_div.innerHTML = output.html;

      for (var a = 0; a < output.blockarr.length; a++) {
        var block = {
          childwidth: parseFloat(output.blockarr[a].childwidth),
          parent: parseFloat(output.blockarr[a].parent),
          id: parseFloat(output.blockarr[a].id),
          x: parseFloat(output.blockarr[a].x),
          y: parseFloat(output.blockarr[a].y),
          width: parseFloat(output.blockarr[a].width),
          height: parseFloat(output.blockarr[a].height)
        };
        blocks.push(block);
      }

      if (blocks.length > 1) {
        rearrangeMe();
      }
    };

    flowy.output = function () {
      var html_ser = canvas_div.innerHTML;
      var json_data = {
        html: html_ser,
        blockarr: blocks,
        blocks: []
      };

      if (blocks.length > 0) {
        for (var i = 0; i < blocks.length; i++) {
          json_data.blocks.push({
            id: blocks[i].id,
            parent: blocks[i].parent,
            data: [],
            attr: []
          });
          var blockParent = document.querySelector(".blockid[value='" + blocks[i].id + "']").parentNode;
          blockParent.querySelectorAll("input").forEach(function (block) {
            var json_name = block.getAttribute("name");
            var json_value = block.value;
            json_data.blocks[i].data.push({
              name: json_name,
              value: json_value
            });
          });
          Array.prototype.slice.call(blockParent.attributes).forEach(function (attribute) {
            var jsonobj = {};
            jsonobj[attribute.name] = attribute.value;
            json_data.blocks[i].attr.push(jsonobj);
          });
        }

        return json_data;
      }
    };

    flowy.deleteBlocks = function () {
      blocks = [];
      canvas_div.innerHTML = "<div class='indicator invisible'></div>";
    };

    flowy.beginDrag = function (event) {
      var _this = this;

      if (event.targetTouches) {
        mouse_x = event.changedTouches[0].clientX;
        mouse_y = event.changedTouches[0].clientY;
      } else {
        mouse_x = event.clientX;
        mouse_y = event.clientY;
      }

      if (event.which != 3 && event.target.closest(".create-flowy")) {
        original = event.target.closest(".create-flowy");
        var newNode = event.target.closest(".create-flowy").cloneNode(true);
        event.target.closest(".create-flowy").classList.add("dragnow");
        newNode.classList.add("block");
        newNode.classList.remove("create-flowy");

        if (blocks.length === 0) {
          newNode.appendChild(string2DomElem("<input type='hidden' name='blockid' class='blockid' value='" + blocks.length + "'>"));
          wrapperElement.appendChild(newNode);
          drag = document.querySelector(".blockid[value='" + blocks.length + "']").parentNode;
        } else {
          newNode.appendChild(string2DomElem("<input type='hidden' name='blockid' class='blockid' value='" + (Math.max.apply(Math, blocks.map(function (a) {
            _newArrowCheck(this, _this);

            return a.id;
          }.bind(this))) + 1) + "'>"));
          wrapperElement.appendChild(newNode);
          drag = document.querySelector(".blockid[value='" + (parseInt(Math.max.apply(Math, blocks.map(function (a) {
            _newArrowCheck(this, _this);

            return a.id;
          }.bind(this)))) + 1) + "']").parentNode;
        }

        blockGrabbed(event.target.closest(".create-flowy"));
        drag.classList.add("dragging");
        active = true;
        dragx = mouse_x - event.target.closest(".create-flowy").getBoundingClientRect().left;
        dragy = mouse_y - event.target.closest(".create-flowy").getBoundingClientRect().top;
        drag.style.left = mouse_x - dragx + "px";
        drag.style.top = mouse_y - dragy + "px";
      }
    };

    wrapperElement.addEventListener("mousedown", touchblock, false);
    wrapperElement.addEventListener("touchstart", touchblock, false);
    wrapperElement.addEventListener("mouseup", touchblock, false);

    flowy.touchDone = function () {
      dragblock = false;
    };

    wrapperElement.addEventListener('mousedown', flowy.beginDrag);
    wrapperElement.addEventListener('touchstart', flowy.beginDrag);

    flowy.endDrag = function (event) {
      var _this2 = this;

      if (event.which != 3 && (active || rearrange)) {
        dragblock = false;
        blockReleased();

        if (!document.querySelector(".indicator").classList.contains("invisible")) {
          document.querySelector(".indicator").classList.add("invisible");
        }

        if (active) {
          original.classList.remove("dragnow");
          drag.classList.remove("dragging");
        }

        if (parseInt(drag.querySelector(".blockid").value) === 0 && rearrange) {
          drag.classList.remove("dragging");
          rearrange = false;

          for (var w = 0; w < blockstemp.length; w++) {
            if (blockstemp[w].id != parseInt(drag.querySelector(".blockid").value)) {
              var blockParent = document.querySelector(".blockid[value='" + blockstemp[w].id + "']").parentNode;
              var arrowParent = document.querySelector(".arrowid[value='" + blockstemp[w].id + "']").parentNode;
              blockParent.style.left = blockParent.getBoundingClientRect().left + window.pageXOffset - (canvas_div.getBoundingClientRect().left + window.pageXOffset) + canvas_div.scrollLeft - 1 + "px";
              blockParent.style.top = blockParent.getBoundingClientRect().top + window.pageYOffset - (canvas_div.getBoundingClientRect().top + window.pageYOffset) + canvas_div.scrollTop - 1 + "px";
              arrowParent.style.left = arrowParent.getBoundingClientRect().left + window.pageXOffset - (canvas_div.getBoundingClientRect().left + window.pageXOffset) + canvas_div.scrollLeft - 1 + "px";
              arrowParent.style.top = arrowParent.getBoundingClientRect().top + window.pageYOffset - (canvas_div.getBoundingClientRect().top + canvas_div.scrollTop) - 1 + "px";
              canvas_div.appendChild(blockParent);
              canvas_div.appendChild(arrowParent);
              blockstemp[w].x = blockParent.getBoundingClientRect().left + window.pageXOffset + parseInt(blockParent.offsetWidth) / 2 + canvas_div.scrollLeft - 1;
              blockstemp[w].y = blockParent.getBoundingClientRect().top + window.pageYOffset + parseInt(blockParent.offsetHeight) / 2 + canvas_div.scrollTop - 1;
            }
          }

          blockstemp.filter(function (a) {
            _newArrowCheck(this, _this2);

            return a.id == 0;
          }.bind(this))[0].x = drag.getBoundingClientRect().left + window.pageXOffset + parseInt(window.getComputedStyle(drag).width) / 2;
          blockstemp.filter(function (a) {
            _newArrowCheck(this, _this2);

            return a.id == 0;
          }.bind(this))[0].y = drag.getBoundingClientRect().top + window.pageYOffset + parseInt(window.getComputedStyle(drag).height) / 2;
          blocks = blocks.concat(blockstemp);
          blockstemp = [];
        } else if (active && blocks.length == 0 && drag.getBoundingClientRect().top + window.pageYOffset > canvas_div.getBoundingClientRect().top + window.pageYOffset && drag.getBoundingClientRect().left + window.pageXOffset > canvas_div.getBoundingClientRect().left + window.pageXOffset) {
          blockSnap(drag, true, undefined);
          active = false;
          drag.style.top = drag.getBoundingClientRect().top + window.pageYOffset - (canvas_div.getBoundingClientRect().top + window.pageYOffset) + canvas_div.scrollTop + "px";
          drag.style.left = drag.getBoundingClientRect().left + window.pageXOffset - (canvas_div.getBoundingClientRect().left + window.pageXOffset) + canvas_div.scrollLeft + "px";
          canvas_div.appendChild(drag);
          blocks.push({
            parent: -1,
            childwidth: 0,
            id: parseInt(drag.querySelector(".blockid").value),
            x: drag.getBoundingClientRect().left + window.pageXOffset + parseInt(window.getComputedStyle(drag).width) / 2 + canvas_div.scrollLeft,
            y: drag.getBoundingClientRect().top + window.pageYOffset + parseInt(window.getComputedStyle(drag).height) / 2 + canvas_div.scrollTop,
            width: parseInt(window.getComputedStyle(drag).width),
            height: parseInt(window.getComputedStyle(drag).height)
          });
        } else if (active && blocks.length == 0) {
          canvas_div.appendChild(document.querySelector(".indicator"));
          drag.parentNode.removeChild(drag);
        } else if (active) {
          var xpos = drag.getBoundingClientRect().left + window.pageXOffset + parseInt(window.getComputedStyle(drag).width) / 2 + canvas_div.scrollLeft;
          var ypos = drag.getBoundingClientRect().top + window.pageYOffset + canvas_div.scrollTop;
          var blocko = blocks.map(function (a) {
            _newArrowCheck(this, _this2);

            return a.id;
          }.bind(this));

          for (var i = 0; i < blocks.length; i++) {
            if (xpos >= blocks.filter(function (a) {
              _newArrowCheck(this, _this2);

              return a.id == blocko[i];
            }.bind(this))[0].x - blocks.filter(function (a) {
              _newArrowCheck(this, _this2);

              return a.id == blocko[i];
            }.bind(this))[0].width / 2 - paddingx && xpos <= blocks.filter(function (a) {
              _newArrowCheck(this, _this2);

              return a.id == blocko[i];
            }.bind(this))[0].x + blocks.filter(function (a) {
              _newArrowCheck(this, _this2);

              return a.id == blocko[i];
            }.bind(this))[0].width / 2 + paddingx && ypos >= blocks.filter(function (a) {
              _newArrowCheck(this, _this2);

              return a.id == blocko[i];
            }.bind(this))[0].y - blocks.filter(function (a) {
              _newArrowCheck(this, _this2);

              return a.id == blocko[i];
            }.bind(this))[0].height / 2 && ypos <= blocks.filter(function (a) {
              _newArrowCheck(this, _this2);

              return a.id == blocko[i];
            }.bind(this))[0].y + blocks.filter(function (a) {
              _newArrowCheck(this, _this2);

              return a.id == blocko[i];
            }.bind(this))[0].height) {
              active = false;

              if (blockSnap(drag, false, document.querySelector(".blockid[value='" + blocko[i] + "']").parentNode)) {
                snap(drag, i, blocko);
              } else {
                active = false;
                canvas_div.appendChild(document.querySelector(".indicator"));
                drag.parentNode.removeChild(drag);
              }

              break;
            } else if (i == blocks.length - 1) {
              active = false;
              canvas_div.appendChild(document.querySelector(".indicator"));
              drag.parentNode.removeChild(drag);
            }
          }
        } else if (rearrange) {
          var xpos = drag.getBoundingClientRect().left + window.pageXOffset + parseInt(window.getComputedStyle(drag).width) / 2 + canvas_div.scrollLeft;
          var ypos = drag.getBoundingClientRect().top + window.pageYOffset + canvas_div.scrollTop;
          var blocko = blocks.map(function (a) {
            _newArrowCheck(this, _this2);

            return a.id;
          }.bind(this));

          for (var i = 0; i < blocks.length; i++) {
            if (xpos >= blocks.filter(function (a) {
              _newArrowCheck(this, _this2);

              return a.id == blocko[i];
            }.bind(this))[0].x - blocks.filter(function (a) {
              _newArrowCheck(this, _this2);

              return a.id == blocko[i];
            }.bind(this))[0].width / 2 - paddingx && xpos <= blocks.filter(function (a) {
              _newArrowCheck(this, _this2);

              return a.id == blocko[i];
            }.bind(this))[0].x + blocks.filter(function (a) {
              _newArrowCheck(this, _this2);

              return a.id == blocko[i];
            }.bind(this))[0].width / 2 + paddingx && ypos >= blocks.filter(function (a) {
              _newArrowCheck(this, _this2);

              return a.id == blocko[i];
            }.bind(this))[0].y - blocks.filter(function (a) {
              _newArrowCheck(this, _this2);

              return a.id == blocko[i];
            }.bind(this))[0].height / 2 && ypos <= blocks.filter(function (a) {
              _newArrowCheck(this, _this2);

              return a.id == blocko[i];
            }.bind(this))[0].y + blocks.filter(function (a) {
              _newArrowCheck(this, _this2);

              return a.id == blocko[i];
            }.bind(this))[0].height) {
              active = false;
              drag.classList.remove("dragging");
              snap(drag, i, blocko);
              break;
            } else if (i == blocks.length - 1) {
              if (beforeDelete(drag, blocks.filter(function (id) {
                _newArrowCheck(this, _this2);

                return id.id == blocko[i];
              }.bind(this))[0])) {
                active = false;
                drag.classList.remove("dragging");
                snap(drag, blocko.indexOf(prevblock), blocko);
                break;
              } else {
                rearrange = false;
                blockstemp = [];
                active = false;
                canvas_div.appendChild(document.querySelector(".indicator"));
                drag.parentNode.removeChild(drag);
                break;
              }
            }
          }
        }
      }
    };

    wrapperElement.addEventListener("mouseup", flowy.endDrag, false);
    wrapperElement.addEventListener("touchend", flowy.endDrag, false);

    function snap(drag, i, blocko) {
      var _this3 = this;

      if (!rearrange) {
        canvas_div.appendChild(drag);
      }

      var totalwidth = 0;
      var totalremove = 0;
      var maxheight = 0;

      for (var w = 0; w < blocks.filter(function (id) {
        _newArrowCheck(this, _this3);

        return id.parent == blocko[i];
      }.bind(this)).length; w++) {
        var children = blocks.filter(function (id) {
          _newArrowCheck(this, _this3);

          return id.parent == blocko[i];
        }.bind(this))[w];

        if (children.childwidth > children.width) {
          totalwidth += children.childwidth + paddingx;
        } else {
          totalwidth += children.width + paddingx;
        }
      }

      totalwidth += parseInt(window.getComputedStyle(drag).width);

      for (var w = 0; w < blocks.filter(function (id) {
        _newArrowCheck(this, _this3);

        return id.parent == blocko[i];
      }.bind(this)).length; w++) {
        var children = blocks.filter(function (id) {
          _newArrowCheck(this, _this3);

          return id.parent == blocko[i];
        }.bind(this))[w];

        if (children.childwidth > children.width) {
          document.querySelector(".blockid[value='" + children.id + "']").parentNode.style.left = blocks.filter(function (a) {
            _newArrowCheck(this, _this3);

            return a.id == blocko[i];
          }.bind(this))[0].x - totalwidth / 2 + totalremove + children.childwidth / 2 - children.width / 2 + "px";
          children.x = blocks.filter(function (id) {
            _newArrowCheck(this, _this3);

            return id.parent == blocko[i];
          }.bind(this))[0].x - totalwidth / 2 + totalremove + children.childwidth / 2;
          totalremove += children.childwidth + paddingx;
        } else {
          document.querySelector(".blockid[value='" + children.id + "']").parentNode.style.left = blocks.filter(function (a) {
            _newArrowCheck(this, _this3);

            return a.id == blocko[i];
          }.bind(this))[0].x - totalwidth / 2 + totalremove + "px";
          children.x = blocks.filter(function (id) {
            _newArrowCheck(this, _this3);

            return id.parent == blocko[i];
          }.bind(this))[0].x - totalwidth / 2 + totalremove + children.width / 2;
          totalremove += children.width + paddingx;
        }
      }

      drag.style.left = blocks.filter(function (id) {
        _newArrowCheck(this, _this3);

        return id.id == blocko[i];
      }.bind(this))[0].x - totalwidth / 2 + totalremove - (canvas_div.getBoundingClientRect().left + window.pageXOffset) + canvas_div.scrollLeft + "px";
      drag.style.top = blocks.filter(function (id) {
        _newArrowCheck(this, _this3);

        return id.id == blocko[i];
      }.bind(this))[0].y + blocks.filter(function (id) {
        _newArrowCheck(this, _this3);

        return id.id == blocko[i];
      }.bind(this))[0].height / 2 + paddingy - (canvas_div.getBoundingClientRect().top + window.pageYOffset) + "px";

      if (rearrange) {
        blockstemp.filter(function (a) {
          _newArrowCheck(this, _this3);

          return a.id == parseInt(drag.querySelector(".blockid").value);
        }.bind(this))[0].x = drag.getBoundingClientRect().left + window.pageXOffset + parseInt(window.getComputedStyle(drag).width) / 2 + canvas_div.scrollLeft;
        blockstemp.filter(function (a) {
          _newArrowCheck(this, _this3);

          return a.id == parseInt(drag.querySelector(".blockid").value);
        }.bind(this))[0].y = drag.getBoundingClientRect().top + window.pageYOffset + parseInt(window.getComputedStyle(drag).height) / 2 + canvas_div.scrollTop;
        blockstemp.filter(function (a) {
          _newArrowCheck(this, _this3);

          return a.id == drag.querySelector(".blockid").value;
        }.bind(this))[0].parent = blocko[i];

        for (var w = 0; w < blockstemp.length; w++) {
          if (blockstemp[w].id != parseInt(drag.querySelector(".blockid").value)) {
            var blockParent = document.querySelector(".blockid[value='" + blockstemp[w].id + "']").parentNode;
            var arrowParent = document.querySelector(".arrowid[value='" + blockstemp[w].id + "']").parentNode;
            blockParent.style.left = blockParent.getBoundingClientRect().left + window.pageXOffset - (canvas_div.getBoundingClientRect().left + window.pageXOffset) + canvas_div.scrollLeft + "px";
            blockParent.style.top = blockParent.getBoundingClientRect().top + window.pageYOffset - (canvas_div.getBoundingClientRect().top + window.pageYOffset) + canvas_div.scrollTop + "px";
            arrowParent.style.left = arrowParent.getBoundingClientRect().left + window.pageXOffset - (canvas_div.getBoundingClientRect().left + window.pageXOffset) + canvas_div.scrollLeft + 20 + "px";
            arrowParent.style.top = arrowParent.getBoundingClientRect().top + window.pageYOffset - (canvas_div.getBoundingClientRect().top + window.pageYOffset) + canvas_div.scrollTop + "px";
            canvas_div.appendChild(blockParent);
            canvas_div.appendChild(arrowParent);
            blockstemp[w].x = blockParent.getBoundingClientRect().left + window.pageXOffset + parseInt(window.getComputedStyle(blockParent).width) / 2 + canvas_div.scrollLeft;
            blockstemp[w].y = blockParent.getBoundingClientRect().top + window.pageYOffset + parseInt(window.getComputedStyle(blockParent).height) / 2 + canvas_div.scrollTop;
          }
        }

        blocks = blocks.concat(blockstemp);
        blockstemp = [];
      } else {
        blocks.push({
          childwidth: 0,
          parent: blocko[i],
          id: parseInt(drag.querySelector(".blockid").value),
          x: drag.getBoundingClientRect().left + window.pageXOffset + parseInt(window.getComputedStyle(drag).width) / 2 + canvas_div.scrollLeft,
          y: drag.getBoundingClientRect().top + window.pageYOffset + parseInt(window.getComputedStyle(drag).height) / 2 + canvas_div.scrollTop,
          width: parseInt(window.getComputedStyle(drag).width),
          height: parseInt(window.getComputedStyle(drag).height)
        });
      }

      var arrowhelp = blocks.filter(function (a) {
        _newArrowCheck(this, _this3);

        return a.id == parseInt(drag.querySelector(".blockid").value);
      }.bind(this))[0];
      var arrowx = arrowhelp.x - blocks.filter(function (a) {
        _newArrowCheck(this, _this3);

        return a.id == blocko[i];
      }.bind(this))[0].x + 20;
      var arrowy = parseFloat(arrowhelp.y - arrowhelp.height / 2 - (blocks.filter(function (id) {
        _newArrowCheck(this, _this3);

        return id.parent == blocko[i];
      }.bind(this))[0].y + blocks.filter(function (id) {
        _newArrowCheck(this, _this3);

        return id.parent == blocko[i];
      }.bind(this))[0].height / 2) + canvas_div.scrollTop);

      if (arrowx < 0) {
        canvas_div.appendChild(string2DomElem('<div class="arrowblock"><input type="hidden" class="arrowid" value="' + drag.querySelector(".blockid").value + '"><svg preserveaspectratio="none" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M' + (blocks.filter(function (a) {
          _newArrowCheck(this, _this3);

          return a.id == blocko[i];
        }.bind(this))[0].x - arrowhelp.x + 5) + ' 0L' + (blocks.filter(function (a) {
          _newArrowCheck(this, _this3);

          return a.id == blocko[i];
        }.bind(this))[0].x - arrowhelp.x + 5) + ' ' + paddingy / 2 + 'L5 ' + paddingy / 2 + 'L5 ' + arrowy + '" stroke="#C5CCD0" stroke-width="2px"/><path d="M0 ' + (arrowy - 5) + 'H10L5 ' + arrowy + 'L0 ' + (arrowy - 5) + 'Z" fill="#C5CCD0"/></svg></div>'));
        document.querySelector('.arrowid[value="' + drag.querySelector(".blockid").value + '"]').parentNode.style.left = arrowhelp.x - 5 - (canvas_div.getBoundingClientRect().left + window.pageXOffset) + canvas_div.scrollLeft + "px";
      } else {
        canvas_div.appendChild(string2DomElem('<div class="arrowblock"><input type="hidden" class="arrowid" value="' + drag.querySelector(".blockid").value + '"><svg preserveaspectratio="none" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M20 0L20 ' + paddingy / 2 + 'L' + arrowx + ' ' + paddingy / 2 + 'L' + arrowx + ' ' + arrowy + '" stroke="#C5CCD0" stroke-width="2px"/><path d="M' + (arrowx - 5) + ' ' + (arrowy - 5) + 'H' + (arrowx + 5) + 'L' + arrowx + ' ' + arrowy + 'L' + (arrowx - 5) + ' ' + (arrowy - 5) + 'Z" fill="#C5CCD0"/></svg></div>'));
        document.querySelector('.arrowid[value="' + parseInt(drag.querySelector(".blockid").value) + '"]').parentNode.style.left = blocks.filter(function (a) {
          _newArrowCheck(this, _this3);

          return a.id == blocko[i];
        }.bind(this))[0].x - 20 - (canvas_div.getBoundingClientRect().left + window.pageXOffset) + canvas_div.scrollLeft + "px";
      }

      document.querySelector('.arrowid[value="' + parseInt(drag.querySelector(".blockid").value) + '"]').parentNode.style.top = blocks.filter(function (a) {
        _newArrowCheck(this, _this3);

        return a.id == blocko[i];
      }.bind(this))[0].y + blocks.filter(function (a) {
        _newArrowCheck(this, _this3);

        return a.id == blocko[i];
      }.bind(this))[0].height / 2 + "px";

      if (blocks.filter(function (a) {
        _newArrowCheck(this, _this3);

        return a.id == blocko[i];
      }.bind(this))[0].parent != -1) {
        var flag = false;
        var idval = blocko[i];

        while (!flag) {
          if (blocks.filter(function (a) {
            _newArrowCheck(this, _this3);

            return a.id == idval;
          }.bind(this))[0].parent == -1) {
            flag = true;
          } else {
            var zwidth = 0;

            for (var w = 0; w < blocks.filter(function (id) {
              _newArrowCheck(this, _this3);

              return id.parent == idval;
            }.bind(this)).length; w++) {
              var children = blocks.filter(function (id) {
                _newArrowCheck(this, _this3);

                return id.parent == idval;
              }.bind(this))[w];

              if (children.childwidth > children.width) {
                if (w == blocks.filter(function (id) {
                  _newArrowCheck(this, _this3);

                  return id.parent == idval;
                }.bind(this)).length - 1) {
                  zwidth += children.childwidth;
                } else {
                  zwidth += children.childwidth + paddingx;
                }
              } else {
                if (w == blocks.filter(function (id) {
                  _newArrowCheck(this, _this3);

                  return id.parent == idval;
                }.bind(this)).length - 1) {
                  zwidth += children.width;
                } else {
                  zwidth += children.width + paddingx;
                }
              }
            }

            blocks.filter(function (a) {
              _newArrowCheck(this, _this3);

              return a.id == idval;
            }.bind(this))[0].childwidth = zwidth;
            idval = blocks.filter(function (a) {
              _newArrowCheck(this, _this3);

              return a.id == idval;
            }.bind(this))[0].parent;
          }
        }

        blocks.filter(function (id) {
          _newArrowCheck(this, _this3);

          return id.id == idval;
        }.bind(this))[0].childwidth = totalwidth;
      }

      if (rearrange) {
        rearrange = false;
        drag.classList.remove("dragging");
      }

      rearrangeMe();
      checkOffset();
    }

    function touchblock(event) {
      dragblock = false;

      if (hasParentClass(event.target, "block")) {
        var theblock = event.target.closest(".block");

        if (event.targetTouches) {
          mouse_x = event.targetTouches[0].clientX;
          mouse_y = event.targetTouches[0].clientY;
        } else {
          mouse_x = event.clientX;
          mouse_y = event.clientY;
        }

        if (event.type !== "mouseup" && hasParentClass(event.target, "block")) {
          if (event.which != 3) {
            if (!active && !rearrange) {
              dragblock = true;
              drag = theblock;
              dragx = mouse_x - (drag.getBoundingClientRect().left + window.pageXOffset);
              dragy = mouse_y - (drag.getBoundingClientRect().top + window.pageYOffset);
            }
          }
        }
      }
    }

    function hasParentClass(element, classname) {
      if (element.className) {
        if (element.className.split(' ').indexOf(classname) >= 0) return true;
      }

      return element.parentNode && hasParentClass(element.parentNode, classname);
    }

    flowy.moveBlock = function (event) {
      var _this4 = this;

      if (event.targetTouches) {
        mouse_x = event.targetTouches[0].clientX;
        mouse_y = event.targetTouches[0].clientY;
      } else {
        mouse_x = event.clientX;
        mouse_y = event.clientY;
      }

      if (dragblock) {
        rearrange = true;
        drag.classList.add("dragging");
        var blockid = parseInt(drag.querySelector(".blockid").value);
        prevblock = blocks.filter(function (a) {
          _newArrowCheck(this, _this4);

          return a.id == blockid;
        }.bind(this))[0].parent;
        blockstemp.push(blocks.filter(function (a) {
          _newArrowCheck(this, _this4);

          return a.id == blockid;
        }.bind(this))[0]);
        blocks = blocks.filter(function (e) {
          return e.id != blockid;
        });

        if (blockid != 0) {
          document.querySelector(".arrowid[value='" + blockid + "']").parentNode.remove();
        }

        var layer = blocks.filter(function (a) {
          _newArrowCheck(this, _this4);

          return a.parent == blockid;
        }.bind(this));
        var flag = false;
        var foundids = [];
        var allids = [];

        while (!flag) {
          for (var i = 0; i < layer.length; i++) {
            if (layer[i] != blockid) {
              blockstemp.push(blocks.filter(function (a) {
                _newArrowCheck(this, _this4);

                return a.id == layer[i].id;
              }.bind(this))[0]);
              var blockParent = document.querySelector(".blockid[value='" + layer[i].id + "']").parentNode;
              var arrowParent = document.querySelector(".arrowid[value='" + layer[i].id + "']").parentNode;
              blockParent.style.left = blockParent.getBoundingClientRect().left + window.pageXOffset - (drag.getBoundingClientRect().left + window.pageXOffset) + "px";
              blockParent.style.top = blockParent.getBoundingClientRect().top + window.pageYOffset - (drag.getBoundingClientRect().top + window.pageYOffset) + "px";
              arrowParent.style.left = arrowParent.getBoundingClientRect().left + window.pageXOffset - (drag.getBoundingClientRect().left + window.pageXOffset) + "px";
              arrowParent.style.top = arrowParent.getBoundingClientRect().top + window.pageYOffset - (drag.getBoundingClientRect().top + window.pageYOffset) + "px";
              drag.appendChild(blockParent);
              drag.appendChild(arrowParent);
              foundids.push(layer[i].id);
              allids.push(layer[i].id);
            }
          }

          if (foundids.length == 0) {
            flag = true;
          } else {
            layer = blocks.filter(function (a) {
              _newArrowCheck(this, _this4);

              return foundids.includes(a.parent);
            }.bind(this));
            foundids = [];
          }
        }

        for (var i = 0; i < blocks.filter(function (a) {
          _newArrowCheck(this, _this4);

          return a.parent == blockid;
        }.bind(this)).length; i++) {
          var blocknumber = blocks.filter(function (a) {
            _newArrowCheck(this, _this4);

            return a.parent == blockid;
          }.bind(this))[i];
          blocks = blocks.filter(function (e) {
            return e.id != blocknumber;
          });
        }

        for (var i = 0; i < allids.length; i++) {
          var blocknumber = allids[i];
          blocks = blocks.filter(function (e) {
            return e.id != blocknumber;
          });
        }

        if (blocks.length > 1) {
          rearrangeMe();
        }

        if (lastevent) {
          fixOffset();
        }

        dragblock = false;
      }

      if (active) {
        drag.style.left = mouse_x - dragx + "px";
        drag.style.top = mouse_y - dragy + "px";
      } else if (rearrange) {
        drag.style.left = mouse_x - dragx - (canvas_div.getBoundingClientRect().left + window.pageXOffset) + canvas_div.scrollLeft + "px";
        drag.style.top = mouse_y - dragy - (canvas_div.getBoundingClientRect().top + window.pageYOffset) + canvas_div.scrollTop + "px";
        blockstemp.filter(function (a) {
          _newArrowCheck(this, _this4);

          return a.id == parseInt(drag.querySelector(".blockid").value);
        }.bind(this)).x = drag.getBoundingClientRect().left + window.pageXOffset + parseInt(window.getComputedStyle(drag).width) / 2 + canvas_div.scrollLeft;
        blockstemp.filter(function (a) {
          _newArrowCheck(this, _this4);

          return a.id == parseInt(drag.querySelector(".blockid").value);
        }.bind(this)).y = drag.getBoundingClientRect().left + window.pageXOffset + parseInt(window.getComputedStyle(drag).height) / 2 + canvas_div.scrollTop;
      }

      if (active || rearrange) {
        var xpos = drag.getBoundingClientRect().left + window.pageXOffset + parseInt(window.getComputedStyle(drag).width) / 2 + canvas_div.scrollLeft;
        var ypos = drag.getBoundingClientRect().top + window.pageYOffset + canvas_div.scrollTop;
        var blocko = blocks.map(function (a) {
          _newArrowCheck(this, _this4);

          return a.id;
        }.bind(this));

        for (var i = 0; i < blocks.length; i++) {
          if (xpos >= blocks.filter(function (a) {
            _newArrowCheck(this, _this4);

            return a.id == blocko[i];
          }.bind(this))[0].x - blocks.filter(function (a) {
            _newArrowCheck(this, _this4);

            return a.id == blocko[i];
          }.bind(this))[0].width / 2 - paddingx && xpos <= blocks.filter(function (a) {
            _newArrowCheck(this, _this4);

            return a.id == blocko[i];
          }.bind(this))[0].x + blocks.filter(function (a) {
            _newArrowCheck(this, _this4);

            return a.id == blocko[i];
          }.bind(this))[0].width / 2 + paddingx && ypos >= blocks.filter(function (a) {
            _newArrowCheck(this, _this4);

            return a.id == blocko[i];
          }.bind(this))[0].y - blocks.filter(function (a) {
            _newArrowCheck(this, _this4);

            return a.id == blocko[i];
          }.bind(this))[0].height / 2 && ypos <= blocks.filter(function (a) {
            _newArrowCheck(this, _this4);

            return a.id == blocko[i];
          }.bind(this))[0].y + blocks.filter(function (a) {
            _newArrowCheck(this, _this4);

            return a.id == blocko[i];
          }.bind(this))[0].height) {
            document.querySelector(".blockid[value='" + blocko[i] + "']").parentNode.appendChild(document.querySelector(".indicator"));
            document.querySelector(".indicator").style.left = parseInt(window.getComputedStyle(document.querySelector(".blockid[value='" + blocko[i] + "']").parentNode).width) / 2 - 5 + "px";
            document.querySelector(".indicator").style.top = window.getComputedStyle(document.querySelector(".blockid[value='" + blocko[i] + "']").parentNode).height + "px";
            document.querySelector(".indicator").classList.remove("invisible");
            break;
          } else if (i == blocks.length - 1) {
            if (!document.querySelector(".indicator").classList.contains("invisible")) {
              document.querySelector(".indicator").classList.add("invisible");
            }
          }
        }
      }
    };

    wrapperElement.addEventListener("mousemove", flowy.moveBlock, false);
    wrapperElement.addEventListener("touchmove", flowy.moveBlock, false);

    function checkOffset() {
      var _this5 = this;

      offsetleft = blocks.map(function (a) {
        _newArrowCheck(this, _this5);

        return a.x;
      }.bind(this));
      var widths = blocks.map(function (a) {
        _newArrowCheck(this, _this5);

        return a.width;
      }.bind(this));
      var mathmin = offsetleft.map(function (item, index) {
        return item - widths[index] / 2;
      });
      offsetleft = Math.min.apply(Math, mathmin);

      if (offsetleft < canvas_div.getBoundingClientRect().left + window.pageXOffset) {
        lastevent = true;
        var blocko = blocks.map(function (a) {
          _newArrowCheck(this, _this5);

          return a.id;
        }.bind(this));

        for (var w = 0; w < blocks.length; w++) {
          document.querySelector(".blockid[value='" + blocks.filter(function (a) {
            _newArrowCheck(this, _this5);

            return a.id == blocko[w];
          }.bind(this))[0].id + "']").parentNode.style.left = blocks.filter(function (a) {
            _newArrowCheck(this, _this5);

            return a.id == blocko[w];
          }.bind(this))[0].x - blocks.filter(function (a) {
            _newArrowCheck(this, _this5);

            return a.id == blocko[w];
          }.bind(this))[0].width / 2 - offsetleft + 20 + "px";

          if (blocks.filter(function (a) {
            _newArrowCheck(this, _this5);

            return a.id == blocko[w];
          }.bind(this))[0].parent != -1) {
            var arrowhelp = blocks.filter(function (a) {
              _newArrowCheck(this, _this5);

              return a.id == blocko[w];
            }.bind(this))[0];
            var arrowx = arrowhelp.x - blocks.filter(function (a) {
              var _this6 = this;

              _newArrowCheck(this, _this5);

              return a.id == blocks.filter(function (a) {
                _newArrowCheck(this, _this6);

                return a.id == blocko[w];
              }.bind(this))[0].parent;
            }.bind(this))[0].x;

            if (arrowx < 0) {
              document.querySelector('.arrowid[value="' + blocko[w] + '"]').parentNode.style.left = arrowhelp.x - offsetleft + 20 - 5 + "px";
            } else {
              document.querySelector('.arrowid[value="' + blocko[w] + '"]').parentNode.style.left = blocks.filter(function (id) {
                var _this7 = this;

                _newArrowCheck(this, _this5);

                return id.id == blocks.filter(function (a) {
                  _newArrowCheck(this, _this7);

                  return a.id == blocko[w];
                }.bind(this))[0].parent;
              }.bind(this))[0].x - 20 - offsetleft + 20 + "px";
            }
          }
        }

        for (var w = 0; w < blocks.length; w++) {
          blocks[w].x = document.querySelector(".blockid[value='" + blocks[w].id + "']").parentNode.getBoundingClientRect().left + window.pageXOffset + (canvas_div.getBoundingClientRect().left + canvas_div.scrollLeft) - parseInt(window.getComputedStyle(document.querySelector(".blockid[value='" + blocks[w].id + "']").parentNode).width) / 2 - 40;
        }

        offsetleftold = offsetleft;
      }
    }

    function fixOffset() {
      var _this8 = this;

      if (offsetleftold < canvas_div.getBoundingClientRect().left + window.pageXOffset) {
        lastevent = false;
        var blocko = blocks.map(function (a) {
          _newArrowCheck(this, _this8);

          return a.id;
        }.bind(this));

        for (var w = 0; w < blocks.length; w++) {
          document.querySelector(".blockid[value='" + blocks.filter(function (a) {
            _newArrowCheck(this, _this8);

            return a.id == blocko[w];
          }.bind(this))[0].id + "']").parentNode.style.left = blocks.filter(function (a) {
            _newArrowCheck(this, _this8);

            return a.id == blocko[w];
          }.bind(this))[0].x - blocks.filter(function (a) {
            _newArrowCheck(this, _this8);

            return a.id == blocko[w];
          }.bind(this))[0].width / 2 - offsetleftold - 20 + "px";
          blocks.filter(function (a) {
            _newArrowCheck(this, _this8);

            return a.id == blocko[w];
          }.bind(this))[0].x = document.querySelector(".blockid[value='" + blocks.filter(function (a) {
            _newArrowCheck(this, _this8);

            return a.id == blocko[w];
          }.bind(this))[0].id + "']").parentNode.getBoundingClientRect().left + window.pageXOffset + blocks.filter(function (a) {
            _newArrowCheck(this, _this8);

            return a.id == blocko[w];
          }.bind(this))[0].width / 2;

          if (blocks.filter(function (a) {
            _newArrowCheck(this, _this8);

            return a.id == blocko[w];
          }.bind(this))[0].parent != -1) {
            var arrowhelp = blocks.filter(function (a) {
              _newArrowCheck(this, _this8);

              return a.id == blocko[w];
            }.bind(this))[0];
            var arrowx = arrowhelp.x - blocks.filter(function (a) {
              var _this9 = this;

              _newArrowCheck(this, _this8);

              return a.id == blocks.filter(function (a) {
                _newArrowCheck(this, _this9);

                return a.id == blocko[w];
              }.bind(this))[0].parent;
            }.bind(this))[0].x;

            if (arrowx < 0) {
              document.querySelector('.arrowid[value="' + blocko[w] + '"]').parentNode.style.left = arrowhelp.x - 5 - (canvas_div.getBoundingClientRect().left + window.pageXOffset) + "px";
            } else {
              document.querySelector('.arrowid[value="' + blocko[w] + '"]').parentNode.style.left = blocks.filter(function (id) {
                var _this10 = this;

                _newArrowCheck(this, _this8);

                return id.id == blocks.filter(function (a) {
                  _newArrowCheck(this, _this10);

                  return a.id == blocko[w];
                }.bind(this))[0].parent;
              }.bind(this))[0].x - 20 - (canvas_div.getBoundingClientRect().left + window.pageXOffset) + "px";
            }
          }
        }

        offsetleftold = 0;
      }
    }

    function rearrangeMe() {
      var _this11 = this;

      var result = blocks.map(function (a) {
        _newArrowCheck(this, _this11);

        return a.parent;
      }.bind(this));

      for (var z = 0; z < result.length; z++) {
        if (result[z] == -1) {
          z++;
        }

        var totalwidth = 0;
        var totalremove = 0;
        var maxheight = 0;

        for (var w = 0; w < blocks.filter(function (id) {
          _newArrowCheck(this, _this11);

          return id.parent == result[z];
        }.bind(this)).length; w++) {
          var children = blocks.filter(function (id) {
            _newArrowCheck(this, _this11);

            return id.parent == result[z];
          }.bind(this))[w];

          if (blocks.filter(function (id) {
            _newArrowCheck(this, _this11);

            return id.parent == children.id;
          }.bind(this)).length == 0) {
            children.childwidth = 0;
          }

          if (children.childwidth > children.width) {
            if (w == blocks.filter(function (id) {
              _newArrowCheck(this, _this11);

              return id.parent == result[z];
            }.bind(this)).length - 1) {
              totalwidth += children.childwidth;
            } else {
              totalwidth += children.childwidth + paddingx;
            }
          } else {
            if (w == blocks.filter(function (id) {
              _newArrowCheck(this, _this11);

              return id.parent == result[z];
            }.bind(this)).length - 1) {
              totalwidth += children.width;
            } else {
              totalwidth += children.width + paddingx;
            }
          }
        }

        if (result[z] != -1) {
          blocks.filter(function (a) {
            _newArrowCheck(this, _this11);

            return a.id == result[z];
          }.bind(this))[0].childwidth = totalwidth;
        }

        for (var w = 0; w < blocks.filter(function (id) {
          _newArrowCheck(this, _this11);

          return id.parent == result[z];
        }.bind(this)).length; w++) {
          var children = blocks.filter(function (id) {
            _newArrowCheck(this, _this11);

            return id.parent == result[z];
          }.bind(this))[w];
          var r_block = document.querySelector(".blockid[value='" + children.id + "']").parentNode;
          var r_array = blocks.filter(function (id) {
            _newArrowCheck(this, _this11);

            return id.id == result[z];
          }.bind(this));
          r_block.style.top = r_array.y + paddingy + "px";
          r_array.y = r_array.y + paddingy;

          if (children.childwidth > children.width) {
            r_block.style.left = r_array[0].x - totalwidth / 2 + totalremove + children.childwidth / 2 - children.width / 2 - (canvas_div.getBoundingClientRect().left + window.pageXOffset) + "px";
            children.x = r_array[0].x - totalwidth / 2 + totalremove + children.childwidth / 2;
            totalremove += children.childwidth + paddingx;
          } else {
            r_block.style.left = r_array[0].x - totalwidth / 2 + totalremove - (canvas_div.getBoundingClientRect().left + window.pageXOffset) + "px";
            children.x = r_array[0].x - totalwidth / 2 + totalremove + children.width / 2;
            totalremove += children.width + paddingx;
          }

          var arrowhelp = blocks.filter(function (a) {
            _newArrowCheck(this, _this11);

            return a.id == children.id;
          }.bind(this))[0];
          var arrowx = arrowhelp.x - blocks.filter(function (a) {
            _newArrowCheck(this, _this11);

            return a.id == children.parent;
          }.bind(this))[0].x + 20;
          var arrowy = arrowhelp.y - arrowhelp.height / 2 - (blocks.filter(function (a) {
            _newArrowCheck(this, _this11);

            return a.id == children.parent;
          }.bind(this))[0].y + blocks.filter(function (a) {
            _newArrowCheck(this, _this11);

            return a.id == children.parent;
          }.bind(this))[0].height / 2);
          document.querySelector('.arrowid[value="' + children.id + '"]').parentNode.style.top = blocks.filter(function (id) {
            _newArrowCheck(this, _this11);

            return id.id == children.parent;
          }.bind(this))[0].y + blocks.filter(function (id) {
            _newArrowCheck(this, _this11);

            return id.id == children.parent;
          }.bind(this))[0].height / 2 - (canvas_div.getBoundingClientRect().top + window.pageYOffset) + "px";

          if (arrowx < 0) {
            document.querySelector('.arrowid[value="' + children.id + '"]').parentNode.style.left = arrowhelp.x - 5 - (canvas_div.getBoundingClientRect().left + window.pageXOffset) + "px";
            document.querySelector('.arrowid[value="' + children.id + '"]').parentNode.innerHTML = '<input type="hidden" class="arrowid" value="' + children.id + '"><svg preserveaspectratio="none" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M' + (blocks.filter(function (id) {
              _newArrowCheck(this, _this11);

              return id.id == children.parent;
            }.bind(this))[0].x - arrowhelp.x + 5) + ' 0L' + (blocks.filter(function (id) {
              _newArrowCheck(this, _this11);

              return id.id == children.parent;
            }.bind(this))[0].x - arrowhelp.x + 5) + ' ' + paddingy / 2 + 'L5 ' + paddingy / 2 + 'L5 ' + arrowy + '" stroke="#C5CCD0" stroke-width="2px"/><path d="M0 ' + (arrowy - 5) + 'H10L5 ' + arrowy + 'L0 ' + (arrowy - 5) + 'Z" fill="#C5CCD0"/></svg>';
          } else {
            document.querySelector('.arrowid[value="' + children.id + '"]').parentNode.style.left = blocks.filter(function (id) {
              _newArrowCheck(this, _this11);

              return id.id == children.parent;
            }.bind(this))[0].x - 20 - (canvas_div.getBoundingClientRect().left + window.pageXOffset) + "px";
            document.querySelector('.arrowid[value="' + children.id + '"]').parentNode.innerHTML = '<input type="hidden" class="arrowid" value="' + children.id + '"><svg preserveaspectratio="none" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M20 0L20 ' + paddingy / 2 + 'L' + arrowx + ' ' + paddingy / 2 + 'L' + arrowx + ' ' + arrowy + '" stroke="#C5CCD0" stroke-width="2px"/><path d="M' + (arrowx - 5) + ' ' + (arrowy - 5) + 'H' + (arrowx + 5) + 'L' + arrowx + ' ' + arrowy + 'L' + (arrowx - 5) + ' ' + (arrowy - 5) + 'Z" fill="#C5CCD0"/></svg>';
          }
        }
      }
    }
  };

  flowy.load();

  function blockGrabbed(block) {
    grab(block);
  }

  function blockReleased() {
    release();
  }

  function blockSnap(drag, first, parent) {
    return snapping(drag, first, parent);
  }

  function beforeDelete(drag, parent) {
    return rearrange(drag, parent);
  }

  function addEventListenerMulti(type, listener, capture, selector) {
    var nodes = document.querySelectorAll(selector);

    for (var i = 0; i < nodes.length; i++) {
      nodes[i].addEventListener(type, listener, capture);
    }
  }

  function removeEventListenerMulti(type, listener, capture, selector) {
    var nodes = document.querySelectorAll(selector);

    for (var i = 0; i < nodes.length; i++) {
      nodes[i].removeEventListener(type, listener, capture);
    }
  }

  function string2DomElem(html) {
    var parser = new DOMParser();
    return parser.parseFromString(html, 'text/html').body.childNodes[0];
  }
};