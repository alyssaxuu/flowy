// modules are defined as an array
// [ module function, map of requires ]
//
// map of requires is short require name -> numeric require
//
// anything defined in a previous bundle is accessed via the
// orig method which is the require for previous bundles
parcelRequire = (function (modules, cache, entry, globalName) {
  // Save the require from previous bundle to this closure if any
  var previousRequire = typeof parcelRequire === 'function' && parcelRequire;
  var nodeRequire = typeof require === 'function' && require;

  function newRequire(name, jumped) {
    if (!cache[name]) {
      if (!modules[name]) {
        // if we cannot find the module within our internal map or
        // cache jump to the current global require ie. the last bundle
        // that was added to the page.
        var currentRequire = typeof parcelRequire === 'function' && parcelRequire;
        if (!jumped && currentRequire) {
          return currentRequire(name, true);
        }

        // If there are other bundles on this page the require from the
        // previous one is saved to 'previousRequire'. Repeat this as
        // many times as there are bundles until the module is found or
        // we exhaust the require chain.
        if (previousRequire) {
          return previousRequire(name, true);
        }

        // Try the node require function if it exists.
        if (nodeRequire && typeof name === 'string') {
          return nodeRequire(name);
        }

        var err = new Error('Cannot find module \'' + name + '\'');
        err.code = 'MODULE_NOT_FOUND';
        throw err;
      }

      localRequire.resolve = resolve;
      localRequire.cache = {};

      var module = cache[name] = new newRequire.Module(name);

      modules[name][0].call(module.exports, localRequire, module, module.exports, this);
    }

    return cache[name].exports;

    function localRequire(x){
      return newRequire(localRequire.resolve(x));
    }

    function resolve(x){
      return modules[name][1][x] || x;
    }
  }

  function Module(moduleName) {
    this.id = moduleName;
    this.bundle = newRequire;
    this.exports = {};
  }

  newRequire.isParcelRequire = true;
  newRequire.Module = Module;
  newRequire.modules = modules;
  newRequire.cache = cache;
  newRequire.parent = previousRequire;
  newRequire.register = function (id, exports) {
    modules[id] = [function (require, module) {
      module.exports = exports;
    }, {}];
  };

  var error;
  for (var i = 0; i < entry.length; i++) {
    try {
      newRequire(entry[i]);
    } catch (e) {
      // Save first error but execute all entries
      if (!error) {
        error = e;
      }
    }
  }

  if (entry.length) {
    // Expose entry point to Node, AMD or browser globals
    // Based on https://github.com/ForbesLindesay/umd/blob/master/template.js
    var mainExports = newRequire(entry[entry.length - 1]);

    // CommonJS
    if (typeof exports === "object" && typeof module !== "undefined") {
      module.exports = mainExports;

    // RequireJS
    } else if (typeof define === "function" && define.amd) {
     define(function () {
       return mainExports;
     });

    // <script>
    } else if (globalName) {
      this[globalName] = mainExports;
    }
  }

  // Override the current require with this new one
  parcelRequire = newRequire;

  if (error) {
    // throw error from earlier, _after updating parcelRequire_
    throw error;
  }

  return newRequire;
})({"flowy.js":[function(require,module,exports) {
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;

/* global $ */
var flowy = function flowy(canvas, grab, release, snapping, spacingX, spacingY) {
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

  if (!spacingX) {
    spacingX = 20;
  }

  if (!spacingY) {
    spacingY = 80;
  }

  $(document).ready(function () {
    var blocks = [];
    var blockstemp = [];
    var canvasDiv = canvas;
    var active = false;
    var paddingx = spacingX;
    var paddingy = spacingY;
    var offsetleft = 0;
    var offsetleftold = 0;
    var rearrange = false;
    var lastevent = false;
    var drag, dragx, dragy, original;
    var mouseX, mouseY;
    canvasDiv.append("<div class='indicator invisible'></div>");

    flowy.import = function (output) {
      canvasDiv.html(JSON.parse(output.html));
      blocks = output.blockarr;
    };

    flowy.output = function () {
      var htmlSer = JSON.stringify(canvasDiv.html());
      var jsonData = {
        html: htmlSer,
        blockarr: blocks,
        blocks: []
      };

      if (blocks.length > 0) {
        for (var i = 0; i < blocks.length; i++) {
          jsonData.blocks.push({
            id: blocks[i].id,
            parent: blocks[i].parent,
            data: []
          });
          $('.blockid[value=' + blocks[i].id + ']').parent().children('input').each(function () {
            var jsonName = $(this).attr('name');
            var jsonValue = $(this).val();
            jsonData.blocks[i].data.push({
              name: jsonName,
              value: jsonValue
            });
          });
        }

        return jsonData;
      }
    };

    flowy.deleteBlocks = function () {
      blocks = [];
      canvasDiv.html("<div class='indicator invisible'></div>");
    };

    $(document).on('mousedown touchstart', '.create-flowy', function (event) {
      if (event.targetTouches) {
        mouseX = event.changedTouches[0].clientX;
        mouseY = event.changedTouches[0].clientY;
      } else {
        mouseX = event.clientX;
        mouseY = event.clientY;
      }

      if (event.which !== 3) {
        original = $(this);

        if (blocks.length === 0) {
          $(this).clone().addClass('block').append("<input type='hidden' name='blockid' class='blockid' value='" + blocks.length + "'>").removeClass('create-flowy').appendTo('body');
          $(this).addClass('dragnow');
          drag = $('.blockid[value=' + blocks.length + ']').parent();
        } else {
          $(this).clone().addClass('block').append("<input type='hidden' name='blockid' class='blockid' value='" + (Math.max.apply(Math, blocks.map(function (a) {
            return a.id;
          })) + 1) + "'>").removeClass('create-flowy').appendTo('body');
          $(this).addClass('dragnow');
          drag = $('.blockid[value=' + (parseInt(Math.max.apply(Math, blocks.map(function (a) {
            return a.id;
          }))) + 1) + ']').parent();
        }

        blockGrabbed($(this));
        drag.addClass('dragging');
        active = true;
        dragx = mouseX - $(this).offset().left;
        dragy = mouseY - $(this).offset().top;
        drag.css('left', mouseX - dragx + 'px');
        drag.css('top', mouseY - dragy + 'px');
      }
    });
    $(document).on('mouseup touchend', function (event) {
      if (event.which !== 3 && (active || rearrange)) {
        blockReleased();

        if (!$('.indicator').hasClass('invisible')) {
          $('.indicator').addClass('invisible');
        }

        if (active) {
          original.removeClass('dragnow');
          drag.removeClass('dragging');
        }

        if (parseInt(drag.children('.blockid').val()) === 0 && rearrange) {
          drag.removeClass('dragging');
          rearrange = false;

          for (var w = 0; w < blockstemp.length; w++) {
            if (blockstemp[w].id !== parseInt(drag.children('.blockid').val())) {
              $('.blockid[value=' + blockstemp[w].id + ']').parent().css('left', $('.blockid[value=' + blockstemp[w].id + ']').parent().offset().left - canvasDiv.offset().left + canvasDiv.scrollLeft());
              $('.blockid[value=' + blockstemp[w].id + ']').parent().css('top', $('.blockid[value=' + blockstemp[w].id + ']').parent().offset().top - canvasDiv.offset().top + canvasDiv.scrollTop());
              $('.arrowid[value=' + blockstemp[w].id + ']').parent().css('left', $('.arrowid[value=' + blockstemp[w].id + ']').parent().offset().left - canvasDiv.offset().left + canvasDiv.scrollLeft());
              $('.arrowid[value=' + blockstemp[w].id + ']').parent().css('top', $('.arrowid[value=' + blockstemp[w].id + ']').parent().offset().top - canvasDiv.offset().top + canvasDiv.scrollTop() + 'px');
              $('.blockid[value=' + blockstemp[w].id + ']').parent().appendTo(canvasDiv);
              $('.arrowid[value=' + blockstemp[w].id + ']').parent().appendTo(canvasDiv);
              blockstemp[w].x = $('.blockid[value=' + blockstemp[w].id + ']').parent().offset().left + $('.blockid[value=' + blockstemp[w].id + ']').innerWidth() / 2 + canvasDiv.scrollLeft();
              blockstemp[w].y = $('.blockid[value=' + blockstemp[w].id + ']').parent().offset().top + $('.blockid[value=' + blockstemp[w].id + ']').parent().innerHeight() / 2 + canvasDiv.scrollTop();
            }
          }

          blockstemp.filter(function (a) {
            return a.id === 0;
          })[0].x = drag.offset().left + drag.innerWidth() / 2;
          blockstemp.filter(function (a) {
            return a.id === 0;
          })[0].y = drag.offset().top + drag.innerHeight() / 2;
          blocks = $.merge(blocks, blockstemp);
          blockstemp = [];
        } else if (active && blocks.length === 0 && drag.offset().top > canvasDiv.offset().top && drag.offset().left > canvasDiv.offset().left) {
          blockSnap(drag, true, undefined);
          active = false;
          drag.css('top', drag.offset().top - canvasDiv.offset().top + canvasDiv.scrollTop() + 'px');
          drag.css('left', drag.offset().left - canvasDiv.offset().left + canvasDiv.scrollLeft() + 'px');
          drag.appendTo(canvasDiv);
          blocks.push({
            parent: -1,
            childwidth: 0,
            id: parseInt(drag.children('.blockid').val()),
            x: drag.offset().left + drag.innerWidth() / 2 + canvasDiv.scrollLeft(),
            y: drag.offset().top + drag.innerHeight() / 2 + canvasDiv.scrollTop(),
            width: drag.innerWidth(),
            height: drag.innerHeight()
          });
        } else if (active && blocks.length === 0) {
          drag.remove();
        } else if (active || rearrange) {
          var xpos = drag.offset().left + drag.innerWidth() / 2 + canvasDiv.scrollLeft();
          var ypos = drag.offset().top + canvasDiv.scrollTop();
          var blocko = blocks.map(function (a) {
            return a.id;
          });

          for (var i = 0; i < blocks.length; i++) {
            if (xpos >= blocks.filter(function (a) {
              return a.id === blocko[i];
            })[0].x - blocks.filter(function (a) {
              return a.id === blocko[i];
            })[0].width / 2 - paddingx && xpos <= blocks.filter(function (a) {
              return a.id === blocko[i];
            })[0].x + blocks.filter(function (a) {
              return a.id === blocko[i];
            })[0].width / 2 + paddingx && ypos >= blocks.filter(function (a) {
              return a.id === blocko[i];
            })[0].y - blocks.filter(function (a) {
              return a.id === blocko[i];
            })[0].height / 2 && ypos <= blocks.filter(function (a) {
              return a.id === blocko[i];
            })[0].y + blocks.filter(function (a) {
              return a.id === blocko[i];
            })[0].height) {
              active = false;

              if (!rearrange && blockSnap(drag, false, blocks.filter(function (id) {
                return id.id === blocko[i];
              })[0])) {
                snap(drag, i, blocko);
              } else if (rearrange) {
                snap(drag, i, blocko);
              }

              break;
            } else if (i === blocks.length - 1) {
              if (rearrange) {
                rearrange = false;
                blockstemp = [];
              }

              active = false;
              drag.remove();
            }
          }
        }
      }
    });

    function snap(drag, i, blocko) {
      if (!rearrange) {
        drag.appendTo(canvasDiv);
      }

      var totalwidth = 0;
      var totalremove = 0;
      var maxheight = 0;

      for (var w = 0; w < blocks.filter(function (id) {
        return id.parent === blocko[i];
      }).length; w++) {
        var children = blocks.filter(function (id) {
          return id.parent === blocko[i];
        })[w];

        if (children.childwidth > children.width) {
          totalwidth += children.childwidth + paddingx;
        } else {
          totalwidth += children.width + paddingx;
        }
      }

      totalwidth += drag.innerWidth();

      for (var w = 0; w < blocks.filter(function (id) {
        return id.parent === blocko[i];
      }).length; w++) {
        var children = blocks.filter(function (id) {
          return id.parent === blocko[i];
        })[w];

        if (children.childwidth > children.width) {
          $('.blockid[value=' + children.id + ']').parent().css('left', blocks.filter(function (a) {
            return a.id === blocko[i];
          })[0].x - totalwidth / 2 + totalremove + children.childwidth / 2 - children.width / 2 + 'px');
          children.x = blocks.filter(function (id) {
            return id.parent === blocko[i];
          })[0].x - totalwidth / 2 + totalremove + children.childwidth / 2;
          totalremove += children.childwidth + paddingx;
        } else {
          $('.blockid[value=' + children.id + ']').parent().css('left', blocks.filter(function (a) {
            return a.id === blocko[i];
          })[0].x - totalwidth / 2 + totalremove + 'px');
          children.x = blocks.filter(function (id) {
            return id.parent === blocko[i];
          })[0].x - totalwidth / 2 + totalremove + children.width / 2;
          totalremove += children.width + paddingx;
        }
      }

      drag.css('left', blocks.filter(function (id) {
        return id.id === blocko[i];
      })[0].x - totalwidth / 2 + totalremove - canvasDiv.offset().left + canvasDiv.scrollLeft() + 'px');
      drag.css('top', blocks.filter(function (id) {
        return id.id === blocko[i];
      })[0].y + blocks.filter(function (id) {
        return id.id === blocko[i];
      })[0].height / 2 + paddingy - canvasDiv.offset().top + 'px');

      if (rearrange) {
        blockstemp.filter(function (a) {
          return a.id === parseInt(drag.children('.blockid').val());
        })[0].x = drag.offset().left + drag.innerWidth() / 2 + canvasDiv.scrollLeft() + canvasDiv.scrollLeft();
        blockstemp.filter(function (a) {
          return a.id === parseInt(drag.children('.blockid').val());
        })[0].y = drag.offset().top + drag.innerHeight() / 2 + canvasDiv.scrollTop();
        blockstemp.filter(function (a) {
          return a.id === drag.children('.blockid').val();
        })[0].parent = blocko[i];

        for (var w = 0; w < blockstemp.length; w++) {
          if (blockstemp[w].id !== parseInt(drag.children('.blockid').val())) {
            $('.blockid[value=' + blockstemp[w].id + ']').parent().css('left', $('.blockid[value=' + blockstemp[w].id + ']').parent().offset().left - canvasDiv.offset().left + canvasDiv.scrollLeft());
            $('.blockid[value=' + blockstemp[w].id + ']').parent().css('top', $('.blockid[value=' + blockstemp[w].id + ']').parent().offset().top - canvasDiv.offset().top + canvasDiv.scrollTop());
            $('.arrowid[value=' + blockstemp[w].id + ']').parent().css('left', $('.arrowid[value=' + blockstemp[w].id + ']').parent().offset().left - canvasDiv.offset().left + canvasDiv.scrollLeft() + 20);
            $('.arrowid[value=' + blockstemp[w].id + ']').parent().css('top', $('.arrowid[value=' + blockstemp[w].id + ']').parent().offset().top - canvasDiv.offset().top + canvasDiv.scrollTop());
            $('.blockid[value=' + blockstemp[w].id + ']').parent().appendTo(canvasDiv);
            $('.arrowid[value=' + blockstemp[w].id + ']').parent().appendTo(canvasDiv);
            blockstemp[w].x = $('.blockid[value=' + blockstemp[w].id + ']').parent().offset().left + $('.blockid[value=' + blockstemp[w].id + ']').innerWidth() / 2 + canvasDiv.scrollLeft();
            blockstemp[w].y = $('.blockid[value=' + blockstemp[w].id + ']').parent().offset().top + $('.blockid[value=' + blockstemp[w].id + ']').parent().innerHeight() / 2 + canvasDiv.scrollTop();
          }
        }

        blocks = $.merge(blocks, blockstemp);
        blockstemp = [];
      } else {
        blocks.push({
          childwidth: 0,
          parent: blocko[i],
          id: parseInt(drag.children('.blockid').val()),
          x: drag.offset().left + drag.innerWidth() / 2 + canvasDiv.scrollLeft(),
          y: drag.offset().top + drag.innerHeight() / 2 + canvasDiv.scrollTop(),
          width: drag.innerWidth(),
          height: drag.innerHeight()
        });
      }

      var arrowhelp = blocks.filter(function (a) {
        return a.id === parseInt(drag.children('.blockid').val());
      })[0];
      var arrowx = arrowhelp.x - blocks.filter(function (a) {
        return a.id === blocko[i];
      })[0].x + 20;
      var arrowy = arrowhelp.y - arrowhelp.height / 2 - (blocks.filter(function (id) {
        return id.parent === blocko[i];
      })[0].y + blocks.filter(function (id) {
        return id.parent === blocko[i];
      })[0].height / 2) + canvasDiv.scrollTop();

      if (arrowx < 0) {
        drag.after('<div class="arrowblock"><input type="hidden" class="arrowid" value="' + drag.children('.blockid').val() + '"><svg preserveaspectratio="none" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M' + (blocks.filter(function (a) {
          return a.id === blocko[i];
        })[0].x - arrowhelp.x + 5) + ' 0L' + (blocks.filter(function (a) {
          return a.id === blocko[i];
        })[0].x - arrowhelp.x + 5) + ' ' + paddingy / 2 + 'L5 ' + paddingy / 2 + 'L5 ' + arrowy + '" stroke="#C5CCD0" stroke-width="2px"/><path d="M0 ' + (arrowy - 5) + 'H10L5 ' + arrowy + 'L0 ' + (arrowy - 5) + 'Z" fill="#C5CCD0"/></svg></div>');
        $('.arrowid[value=' + drag.children('.blockid').val() + ']').parent().css('left', arrowhelp.x - 5 - canvasDiv.offset().left + canvasDiv.scrollLeft() + 'px');
      } else {
        drag.after('<div class="arrowblock"><input type="hidden" class="arrowid" value="' + drag.children('.blockid').val() + '"><svg preserveaspectratio="none" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M20 0L20 ' + paddingy / 2 + 'L' + arrowx + ' ' + paddingy / 2 + 'L' + arrowx + ' ' + arrowy + '" stroke="#C5CCD0" stroke-width="2px"/><path d="M' + (arrowx - 5) + ' ' + (arrowy - 5) + 'H' + (arrowx + 5) + 'L' + arrowx + ' ' + arrowy + 'L' + (arrowx - 5) + ' ' + (arrowy - 5) + 'Z" fill="#C5CCD0"/></svg></div>');
        $('.arrowid[value=' + parseInt(drag.children('.blockid').val()) + ']').parent().css('left', blocks.filter(function (a) {
          return a.id === blocko[i];
        })[0].x - 20 - canvasDiv.offset().left + canvasDiv.scrollLeft() + 'px');
      }

      $('.arrowid[value=' + parseInt(drag.children('.blockid').val()) + ']').parent().css('top', blocks.filter(function (a) {
        return a.id === blocko[i];
      })[0].y + blocks.filter(function (a) {
        return a.id === blocko[i];
      })[0].height / 2 + 'px');

      if (blocks.filter(function (a) {
        return a.id === blocko[i];
      })[0].parent !== -1) {
        var flag = false;
        var idval = blocko[i];

        while (!flag) {
          if (blocks.filter(function (a) {
            return a.id === idval;
          })[0].parent === -1) {
            flag = true;
          } else {
            var zwidth = 0;

            for (var w = 0; w < blocks.filter(function (id) {
              return id.parent === idval;
            }).length; w++) {
              var children = blocks.filter(function (id) {
                return id.parent === idval;
              })[w];

              if (children.childwidth > children.width) {
                if (w === blocks.filter(function (id) {
                  return id.parent === idval;
                }).length - 1) {
                  zwidth += children.childwidth;
                } else {
                  zwidth += children.childwidth + paddingx;
                }
              } else {
                if (w === blocks.filter(function (id) {
                  return id.parent === idval;
                }).length - 1) {
                  zwidth += children.width;
                } else {
                  zwidth += children.width + paddingx;
                }
              }
            }

            blocks.filter(function (a) {
              return a.id === idval;
            })[0].childwidth = zwidth;
            idval = blocks.filter(function (a) {
              return a.id === idval;
            })[0].parent;
          }
        }

        blocks.filter(function (id) {
          return id.id === idval;
        })[0].childwidth = totalwidth;
      }

      if (rearrange) {
        rearrange = false;
        drag.removeClass('dragging');
      }

      rearrangeMe();
      checkOffset();
    }

    $(document).on('mousedown touchstart', '.block', function (event) {
      $(document).on('mouseup mousemove touchmove', '.block', function handler(event) {
        if (event.targetTouches[0]) {
          mouseX = event.targetTouches[0].clientX;
          mouseY = event.targetTouches[0].clientY;
        } else {
          mouseX = event.clientX;
          mouseY = event.clientY;
        }

        if (event.type !== 'mouseup') {
          if (event.which !== 3) {
            if (!active && !rearrange) {
              rearrange = true;
              drag = $(this);
              drag.addClass('dragging');
              dragx = mouseX - $(this).offset().left;
              dragy = mouseY - $(this).offset().top;
              var blockid = parseInt($(this).children('.blockid').val());
              drag = $(this);
              blockstemp.push(blocks.filter(function (a) {
                return a.id === blockid;
              })[0]);
              blocks = $.grep(blocks, function (e) {
                return e.id !== blockid;
              });
              $('.arrowid[value=' + blockid + ']').parent().remove();
              var layer = blocks.filter(function (a) {
                return a.parent === blockid;
              });
              var flag = false;
              var foundids = [];
              var allids = [];

              while (!flag) {
                for (var i = 0; i < layer.length; i++) {
                  blockstemp.push(blocks.filter(function (a) {
                    return a.id === layer[i].id;
                  })[0]);
                  $('.blockid[value=' + layer[i].id + ']').parent().css('left', $('.blockid[value=' + layer[i].id + ']').parent().offset().left - drag.offset().left);
                  $('.blockid[value=' + layer[i].id + ']').parent().css('top', $('.blockid[value=' + layer[i].id + ']').parent().offset().top - drag.offset().top);
                  $('.arrowid[value=' + layer[i].id + ']').parent().css('left', $('.arrowid[value=' + layer[i].id + ']').parent().offset().left - drag.offset().left);
                  $('.arrowid[value=' + layer[i].id + ']').parent().css('top', $('.arrowid[value=' + layer[i].id + ']').parent().offset().top - drag.offset().top);
                  $('.blockid[value=' + layer[i].id + ']').parent().appendTo(drag);
                  $('.arrowid[value=' + layer[i].id + ']').parent().appendTo(drag);
                  foundids.push(layer[i].id);
                  allids.push(layer[i].id);
                }

                if (foundids.length === 0) {
                  flag = true;
                } else {
                  layer = blocks.filter(function (a) {
                    return foundids.includes(a.parent);
                  });
                  foundids = [];
                }
              }

              for (var i = 0; i < blocks.filter(function (a) {
                return a.parent === blockid;
              }).length; i++) {
                var blocknumber = blocks.filter(function (a) {
                  return a.parent === blockid;
                })[i];
                blocks = $.grep(blocks, function (e) {
                  return e.id !== blocknumber;
                });
              }

              for (var i = 0; i < allids.length; i++) {
                var blocknumber = allids[i];
                blocks = $.grep(blocks, function (e) {
                  return e.id !== blocknumber;
                });
              }

              if (blocks.length > 1) {
                rearrangeMe();
              }

              if (lastevent) {
                fixOffset();
              }
            }
          }
        }

        $(document).off('mouseup mousemove touchmove', handler);
      });
    });
    $(document).on('mousemove touchmove', function (event) {
      if (event.targetTouches) {
        mouseX = event.targetTouches[0].clientX;
        mouseY = event.targetTouches[0].clientY;
      } else {
        mouseX = event.clientX;
        mouseY = event.clientY;
      }

      if (active) {
        drag.css('left', mouseX - dragx + 'px');
        drag.css('top', mouseY - dragy + 'px');
      } else if (rearrange) {
        drag.css('left', mouseX - dragx - canvasDiv.offset().left + canvasDiv.scrollLeft() + 'px');
        drag.css('top', mouseY - dragy - canvasDiv.offset().top + canvasDiv.scrollTop() + 'px');
        blockstemp.filter(function (a) {
          return a.id === parseInt(drag.children('.blockid').val());
        }).x = drag.offset().left + drag.innerWidth() / 2 + canvasDiv.scrollLeft();
        blockstemp.filter(function (a) {
          return a.id === parseInt(drag.children('.blockid').val());
        }).y = drag.offset().left + drag.innerHeight() / 2 + canvasDiv.scrollTop();
      }

      if (active || rearrange) {
        var xpos = drag.offset().left + drag.innerWidth() / 2 + canvasDiv.scrollLeft();
        var ypos = drag.offset().top + canvasDiv.scrollTop();
        var blocko = blocks.map(function (a) {
          return a.id;
        });

        for (var i = 0; i < blocks.length; i++) {
          if (xpos >= blocks.filter(function (a) {
            return a.id === blocko[i];
          })[0].x - blocks.filter(function (a) {
            return a.id === blocko[i];
          })[0].width / 2 - paddingx && xpos <= blocks.filter(function (a) {
            return a.id === blocko[i];
          })[0].x + blocks.filter(function (a) {
            return a.id === blocko[i];
          })[0].width / 2 + paddingx && ypos >= blocks.filter(function (a) {
            return a.id === blocko[i];
          })[0].y - blocks.filter(function (a) {
            return a.id === blocko[i];
          })[0].height / 2 && ypos <= blocks.filter(function (a) {
            return a.id === blocko[i];
          })[0].y + blocks.filter(function (a) {
            return a.id === blocko[i];
          })[0].height) {
            $('.indicator').appendTo($('.blockid[value=' + blocko[i] + ']').parent());
            $('.indicator').css('left', $('.blockid[value=' + blocko[i] + ']').parent().innerWidth() / 2 - 5 + 'px');
            $('.indicator').css('top', $('.blockid[value=' + blocko[i] + ']').parent().innerHeight() + 'px');
            $('.indicator').removeClass('invisible');
            break;
          } else if (i === blocks.length - 1) {
            if (!$('.indicator').hasClass('invisible')) {
              $('.indicator').addClass('invisible');
            }
          }
        }
      }
    });

    function checkOffset() {
      offsetleft = blocks.map(function (a) {
        return a.x;
      });
      var widths = blocks.map(function (a) {
        return a.width;
      });
      var mathmin = offsetleft.map(function (item, index) {
        return item - widths[index] / 2;
      });
      offsetleft = Math.min.apply(Math, mathmin);

      if (offsetleft < canvasDiv.offset().left) {
        lastevent = true;
        var blocko = blocks.map(function (a) {
          return a.id;
        });

        for (var w = 0; w < blocks.length; w++) {
          $('.blockid[value=' + blocks.filter(function (a) {
            return a.id === blocko[w];
          })[0].id + ']').parent().css('left', blocks.filter(function (a) {
            return a.id === blocko[w];
          })[0].x - blocks.filter(function (a) {
            return a.id === blocko[w];
          })[0].width / 2 - offsetleft + 20);

          if (blocks.filter(function (a) {
            return a.id === blocko[w];
          })[0].parent !== -1) {
            var arrowhelp = blocks.filter(function (a) {
              return a.id === blocko[w];
            })[0];
            var arrowx = arrowhelp.x - blocks.filter(function (a) {
              return a.id === blocks.filter(function (a) {
                return a.id === blocko[w];
              })[0].parent;
            })[0].x;

            if (arrowx < 0) {
              $('.arrowid[value=' + blocko[w] + ']').parent().css('left', arrowhelp.x - offsetleft + 20 - 5 + 'px');
            } else {
              $('.arrowid[value=' + blocko[w] + ']').parent().css('left', blocks.filter(function (id) {
                return id.id === blocks.filter(function (a) {
                  return a.id === blocko[w];
                })[0].parent;
              })[0].x - 20 - offsetleft + 20 + 'px');
            }
          }
        }

        for (var w = 0; w < blocks.length; w++) {
          blocks[w].x = $('.blockid[value=' + blocks[w].id + ']').parent().offset().left + canvasDiv.offset().left - $('.blockid[value=' + blocks[w].id + ']').parent().innerWidth() / 2 - 40;
        }

        offsetleftold = offsetleft;
      }
    }

    function fixOffset() {
      if (offsetleftold < canvasDiv.offset().left) {
        lastevent = false;
        var blocko = blocks.map(function (a) {
          return a.id;
        });

        for (var w = 0; w < blocks.length; w++) {
          $('.blockid[value=' + blocks.filter(function (a) {
            return a.id === blocko[w];
          })[0].id + ']').parent().css('left', blocks.filter(function (a) {
            return a.id === blocko[w];
          })[0].x - blocks.filter(function (a) {
            return a.id === blocko[w];
          })[0].width / 2 - offsetleftold - 20);
          blocks.filter(function (a) {
            return a.id === blocko[w];
          })[0].x = $('.blockid[value=' + blocks.filter(function (a) {
            return a.id === blocko[w];
          })[0].id + ']').parent().offset().left + blocks.filter(function (a) {
            return a.id === blocko[w];
          })[0].width / 2;

          if (blocks.filter(function (a) {
            return a.id === blocko[w];
          })[0].parent !== -1) {
            var arrowhelp = blocks.filter(function (a) {
              return a.id === blocko[w];
            })[0];
            var arrowx = arrowhelp.x - blocks.filter(function (a) {
              return a.id === blocks.filter(function (a) {
                return a.id === blocko[w];
              })[0].parent;
            })[0].x;

            if (arrowx < 0) {
              $('.arrowid[value=' + blocko[w] + ']').parent().css('left', arrowhelp.x - 5 - canvasDiv.offset().left + 'px');
            } else {
              $('.arrowid[value=' + blocko[w] + ']').parent().css('left', blocks.filter(function (id) {
                return id.id === blocks.filter(function (a) {
                  return a.id === blocko[w];
                })[0].parent;
              })[0].x - 20 - canvasDiv.offset().left + 'px');
            }
          }
        }

        for (var w = 0; w < blocks.length; w++) {// blocks[w].x = blocks[w].x+offsetleftold-20;
        }

        offsetleftold = 0;
      }
    }

    function rearrangeMe() {
      var result = blocks.map(function (a) {
        return a.parent;
      });

      for (var z = 0; z < result.length; z++) {
        if (result[z] === -1) {
          z++;
        }

        var totalwidth = 0;
        var totalremove = 0;
        var maxheight = 0;

        for (var w = 0; w < blocks.filter(function (id) {
          return id.parent === result[z];
        }).length; w++) {
          var children = blocks.filter(function (id) {
            return id.parent === result[z];
          })[w];

          if (blocks.filter(function (id) {
            return id.parent === children.id;
          }).length === 0) {
            children.childwidth = 0;
          }

          if (children.childwidth > children.width) {
            if (w === blocks.filter(function (id) {
              return id.parent === result[z];
            }).length - 1) {
              totalwidth += children.childwidth;
            } else {
              totalwidth += children.childwidth + paddingx;
            }
          } else {
            if (w === blocks.filter(function (id) {
              return id.parent === result[z];
            }).length - 1) {
              totalwidth += children.width;
            } else {
              totalwidth += children.width + paddingx;
            }
          }
        }

        if (result[z] !== -1) {
          blocks.filter(function (a) {
            return a.id === result[z];
          })[0].childwidth = totalwidth;
        }

        for (var w = 0; w < blocks.filter(function (id) {
          return id.parent === result[z];
        }).length; w++) {
          var children = blocks.filter(function (id) {
            return id.parent === result[z];
          })[w];
          $('.blockid[value=' + children.id + ']').parent().css('top', blocks.filter(function (id) {
            return id.id === result[z];
          }).y + paddingy + 'px');
          blocks.filter(function (id) {
            return id.id === result[z];
          }).y = blocks.filter(function (id) {
            return id.id === result[z];
          }).y + paddingy;

          if (children.childwidth > children.width) {
            $('.blockid[value=' + children.id + ']').parent().css('left', blocks.filter(function (id) {
              return id.id === result[z];
            })[0].x - totalwidth / 2 + totalremove + children.childwidth / 2 - children.width / 2 - canvasDiv.offset().left + 'px');
            children.x = blocks.filter(function (id) {
              return id.id === result[z];
            })[0].x - totalwidth / 2 + totalremove + children.childwidth / 2;
            totalremove += children.childwidth + paddingx;
          } else {
            $('.blockid[value=' + children.id + ']').parent().css('left', blocks.filter(function (id) {
              return id.id === result[z];
            })[0].x - totalwidth / 2 + totalremove - canvasDiv.offset().left + 'px');
            children.x = blocks.filter(function (id) {
              return id.id === result[z];
            })[0].x - totalwidth / 2 + totalremove + children.width / 2;
            totalremove += children.width + paddingx;
          }

          var arrowhelp = blocks.filter(function (a) {
            return a.id === children.id;
          })[0];
          var arrowx = arrowhelp.x - blocks.filter(function (a) {
            return a.id === children.parent;
          })[0].x + 20;
          var arrowy = arrowhelp.y - arrowhelp.height / 2 - (blocks.filter(function (a) {
            return a.id === children.parent;
          })[0].y + blocks.filter(function (a) {
            return a.id === children.parent;
          })[0].height / 2);
          $('.arrowid[value=' + children.id + ']').parent().css('top', blocks.filter(function (id) {
            return id.id === children.parent;
          })[0].y + blocks.filter(function (id) {
            return id.id === children.parent;
          })[0].height / 2 - canvasDiv.offset().top + 'px');

          if (arrowx < 0) {
            $('.arrowid[value=' + children.id + ']').parent().css('left', arrowhelp.x - 5 - canvasDiv.offset().left + 'px');
            $('.arrowid[value=' + children.id + ']').parent().html('<input type="hidden" class="arrowid" value="' + children.id + '"><svg preserveaspectratio="none" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M' + (blocks.filter(function (id) {
              return id.id === children.parent;
            })[0].x - arrowhelp.x + 5) + ' 0L' + (blocks.filter(function (id) {
              return id.id === children.parent;
            })[0].x - arrowhelp.x + 5) + ' ' + paddingy / 2 + 'L5 ' + paddingy / 2 + 'L5 ' + arrowy + '" stroke="#C5CCD0" stroke-width="2px"/><path d="M0 ' + (arrowy - 5) + 'H10L5 ' + arrowy + 'L0 ' + (arrowy - 5) + 'Z" fill="#C5CCD0"/></svg>');
          } else {
            $('.arrowid[value=' + children.id + ']').parent().css('left', blocks.filter(function (id) {
              return id.id === children.parent;
            })[0].x - 20 - canvasDiv.offset().left + 'px');
            $('.arrowid[value=' + children.id + ']').parent().html('<input type="hidden" class="arrowid" value="' + children.id + '"><svg preserveaspectratio="none" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M20 0L20 ' + paddingy / 2 + 'L' + arrowx + ' ' + paddingy / 2 + 'L' + arrowx + ' ' + arrowy + '" stroke="#C5CCD0" stroke-width="2px"/><path d="M' + (arrowx - 5) + ' ' + (arrowy - 5) + 'H' + (arrowx + 5) + 'L' + arrowx + ' ' + arrowy + 'L' + (arrowx - 5) + ' ' + (arrowy - 5) + 'Z" fill="#C5CCD0"/></svg>');
          }
        }
      }
    }
  });

  function blockGrabbed(block) {
    grab(block);
  }

  function blockReleased() {
    release();
  }

  function blockSnap(drag, first, parent) {
    return snapping(drag, first, parent);
  }
};

var _default = flowy;
exports.default = _default;
},{}],"assets/tile.png":[function(require,module,exports) {
module.exports = "/tile.c3d794e6.png";
},{}],"../node_modules/parcel-bundler/src/builtins/bundle-url.js":[function(require,module,exports) {
var bundleURL = null;

function getBundleURLCached() {
  if (!bundleURL) {
    bundleURL = getBundleURL();
  }

  return bundleURL;
}

function getBundleURL() {
  // Attempt to find the URL of the current script and use that as the base URL
  try {
    throw new Error();
  } catch (err) {
    var matches = ('' + err.stack).match(/(https?|file|ftp|chrome-extension|moz-extension):\/\/[^)\n]+/g);

    if (matches) {
      return getBaseURL(matches[0]);
    }
  }

  return '/';
}

function getBaseURL(url) {
  return ('' + url).replace(/^((?:https?|file|ftp|chrome-extension|moz-extension):\/\/.+)\/[^/]+$/, '$1') + '/';
}

exports.getBundleURL = getBundleURLCached;
exports.getBaseURL = getBaseURL;
},{}],"../node_modules/parcel-bundler/src/builtins/css-loader.js":[function(require,module,exports) {
var bundle = require('./bundle-url');

function updateLink(link) {
  var newLink = link.cloneNode();

  newLink.onload = function () {
    link.remove();
  };

  newLink.href = link.href.split('?')[0] + '?' + Date.now();
  link.parentNode.insertBefore(newLink, link.nextSibling);
}

var cssTimeout = null;

function reloadCSS() {
  if (cssTimeout) {
    return;
  }

  cssTimeout = setTimeout(function () {
    var links = document.querySelectorAll('link[rel="stylesheet"]');

    for (var i = 0; i < links.length; i++) {
      if (bundle.getBaseURL(links[i].href) === bundle.getBundleURL()) {
        updateLink(links[i]);
      }
    }

    cssTimeout = null;
  }, 50);
}

module.exports = reloadCSS;
},{"./bundle-url":"../node_modules/parcel-bundler/src/builtins/bundle-url.js"}],"demo.css":[function(require,module,exports) {
var reloadCSS = require('_css_loader');

module.hot.dispose(reloadCSS);
module.hot.accept(reloadCSS);
},{"./assets/tile.png":[["tile.c3d794e6.png","assets/tile.png"],"assets/tile.png"],"_css_loader":"../node_modules/parcel-bundler/src/builtins/css-loader.js"}],"flowy.css":[function(require,module,exports) {
var reloadCSS = require('_css_loader');

module.hot.dispose(reloadCSS);
module.hot.accept(reloadCSS);
},{"_css_loader":"../node_modules/parcel-bundler/src/builtins/css-loader.js"}],"assets/meta.png":[function(require,module,exports) {
module.exports = "/meta.e887ae66.png";
},{}],"assets/*.png":[function(require,module,exports) {
module.exports = {
  "meta": require("./meta.png"),
  "tile": require("./tile.png")
};
},{"./meta.png":"assets/meta.png","./tile.png":"assets/tile.png"}],"assets/action.svg":[function(require,module,exports) {
module.exports = "/action.f162e1f9.svg";
},{}],"assets/actionblue.svg":[function(require,module,exports) {
module.exports = "/actionblue.a0968026.svg";
},{}],"assets/actionorange.svg":[function(require,module,exports) {
module.exports = "/actionorange.fcf223d4.svg";
},{}],"assets/arrow.svg":[function(require,module,exports) {
module.exports = "/arrow.ade7741f.svg";
},{}],"assets/checkoff.svg":[function(require,module,exports) {
module.exports = "/checkoff.5dc9810d.svg";
},{}],"assets/checkon.svg":[function(require,module,exports) {
module.exports = "/checkon.b5436789.svg";
},{}],"assets/close.svg":[function(require,module,exports) {
module.exports = "/close.bff3a284.svg";
},{}],"assets/closeleft.svg":[function(require,module,exports) {
module.exports = "/closeleft.0e7777e4.svg";
},{}],"assets/database.svg":[function(require,module,exports) {
module.exports = "/database.3cfae605.svg";
},{}],"assets/databaseorange.svg":[function(require,module,exports) {
module.exports = "/databaseorange.76eff86c.svg";
},{}],"assets/dropdown.svg":[function(require,module,exports) {
module.exports = "/dropdown.ed59613f.svg";
},{}],"assets/error.svg":[function(require,module,exports) {
module.exports = "/error.da47f81f.svg";
},{}],"assets/errorblue.svg":[function(require,module,exports) {
module.exports = "/errorblue.aa42a382.svg";
},{}],"assets/errorred.svg":[function(require,module,exports) {
module.exports = "/errorred.272d663c.svg";
},{}],"assets/eye.svg":[function(require,module,exports) {
module.exports = "/eye.18a4ff40.svg";
},{}],"assets/eyeblue.svg":[function(require,module,exports) {
module.exports = "/eyeblue.2544edc4.svg";
},{}],"assets/grabme.svg":[function(require,module,exports) {
module.exports = "/grabme.260b4c95.svg";
},{}],"assets/heart.svg":[function(require,module,exports) {
module.exports = "/heart.7b7c65cd.svg";
},{}],"assets/log.svg":[function(require,module,exports) {
module.exports = "/log.7ac37b58.svg";
},{}],"assets/logred.svg":[function(require,module,exports) {
module.exports = "/logred.1c4ec1bb.svg";
},{}],"assets/more.svg":[function(require,module,exports) {
module.exports = "/more.d1d43ecd.svg";
},{}],"assets/search.svg":[function(require,module,exports) {
module.exports = "/search.f1252315.svg";
},{}],"assets/time.svg":[function(require,module,exports) {
module.exports = "/time.9c0d1061.svg";
},{}],"assets/timeblue.svg":[function(require,module,exports) {
module.exports = "/timeblue.b6c86bed.svg";
},{}],"assets/twitter.svg":[function(require,module,exports) {
module.exports = "/twitter.9c616447.svg";
},{}],"assets/twitterorange.svg":[function(require,module,exports) {
module.exports = "/twitterorange.caf016e3.svg";
},{}],"assets/*.svg":[function(require,module,exports) {
module.exports = {
  "action": require("./action.svg"),
  "actionblue": require("./actionblue.svg"),
  "actionorange": require("./actionorange.svg"),
  "arrow": require("./arrow.svg"),
  "checkoff": require("./checkoff.svg"),
  "checkon": require("./checkon.svg"),
  "close": require("./close.svg"),
  "closeleft": require("./closeleft.svg"),
  "database": require("./database.svg"),
  "databaseorange": require("./databaseorange.svg"),
  "dropdown": require("./dropdown.svg"),
  "error": require("./error.svg"),
  "errorblue": require("./errorblue.svg"),
  "errorred": require("./errorred.svg"),
  "eye": require("./eye.svg"),
  "eyeblue": require("./eyeblue.svg"),
  "grabme": require("./grabme.svg"),
  "heart": require("./heart.svg"),
  "log": require("./log.svg"),
  "logred": require("./logred.svg"),
  "more": require("./more.svg"),
  "search": require("./search.svg"),
  "time": require("./time.svg"),
  "timeblue": require("./timeblue.svg"),
  "twitter": require("./twitter.svg"),
  "twitterorange": require("./twitterorange.svg")
};
},{"./action.svg":"assets/action.svg","./actionblue.svg":"assets/actionblue.svg","./actionorange.svg":"assets/actionorange.svg","./arrow.svg":"assets/arrow.svg","./checkoff.svg":"assets/checkoff.svg","./checkon.svg":"assets/checkon.svg","./close.svg":"assets/close.svg","./closeleft.svg":"assets/closeleft.svg","./database.svg":"assets/database.svg","./databaseorange.svg":"assets/databaseorange.svg","./dropdown.svg":"assets/dropdown.svg","./error.svg":"assets/error.svg","./errorblue.svg":"assets/errorblue.svg","./errorred.svg":"assets/errorred.svg","./eye.svg":"assets/eye.svg","./eyeblue.svg":"assets/eyeblue.svg","./grabme.svg":"assets/grabme.svg","./heart.svg":"assets/heart.svg","./log.svg":"assets/log.svg","./logred.svg":"assets/logred.svg","./more.svg":"assets/more.svg","./search.svg":"assets/search.svg","./time.svg":"assets/time.svg","./timeblue.svg":"assets/timeblue.svg","./twitter.svg":"assets/twitter.svg","./twitterorange.svg":"assets/twitterorange.svg"}],"demo.js":[function(require,module,exports) {
"use strict";

var _flowy = _interopRequireDefault(require("./flowy"));

require("./demo.css");

require("./flowy.css");

var _ = _interopRequireDefault(require("./assets/*.png"));

var _2 = _interopRequireDefault(require("./assets/*.svg"));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function ownKeys(object, enumerableOnly) { var keys = Object.keys(object); if (Object.getOwnPropertySymbols) { var symbols = Object.getOwnPropertySymbols(object); if (enumerableOnly) symbols = symbols.filter(function (sym) { return Object.getOwnPropertyDescriptor(object, sym).enumerable; }); keys.push.apply(keys, symbols); } return keys; }

function _objectSpread(target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i] != null ? arguments[i] : {}; if (i % 2) { ownKeys(Object(source), true).forEach(function (key) { _defineProperty(target, key, source[key]); }); } else if (Object.getOwnPropertyDescriptors) { Object.defineProperties(target, Object.getOwnPropertyDescriptors(source)); } else { ownKeys(Object(source)).forEach(function (key) { Object.defineProperty(target, key, Object.getOwnPropertyDescriptor(source, key)); }); } } return target; }

function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }

var images = _objectSpread({}, _.default, {}, _2.default); // all HTML templates go here


var templates = {};
templates.blocklist = "\n<div class=\"blockelem create-flowy noselect\">\n  <input type=\"hidden\" name=\"blockelemtype\" class=\"blockelemtype\" value=\"1\">\n  <div class=\"grabme\"><img src=\"".concat(images.grabme, "\"></div>\n  <div class=\"blockin\">\n    <div class=\"blockico\"><span></span><img src=\"").concat(images.eye, "\"></div>\n    <div class=\"blocktext\">\n      <p class=\"blocktitle\">New visitor</p>\n      <p class=\"blockdesc\">Triggers when somebody visits a specified page</p>\n    </div>\n  </div>\n</div>\n<div class=\"blockelem create-flowy noselect\">\n  <input type=\"hidden\" name=\"blockelemtype\" class=\"blockelemtype\" value=\"2\">\n  <div class=\"grabme\"><img src=\"").concat(images.grabme, "\"></div>\n  <div class=\"blockin\">\n    <div class=\"blockico\"><span></span><img src=\"").concat(images.action, "\"></div>\n    <div class=\"blocktext\">\n      <p class=\"blocktitle\">Action is performed</p>\n      <p class=\"blockdesc\">Triggers when somebody performs a specified action</p>\n    </div>\n  </div>\n</div>\n<div class=\"blockelem create-flowy noselect\">\n  <input type=\"hidden\" name=\"blockelemtype\" class=\"blockelemtype\" value=\"3\">\n  <div class=\"grabme\"><img src=\"").concat(images.grabme, "\"></div>\n  <div class=\"blockin\">\n    <div class=\"blockico\"><span></span><img src=\"").concat(images.time, "\"></div>\n    <div class=\"blocktext\">\n      <p class=\"blocktitle\">Time has passed</p>\n      <p class=\"blockdesc\">Triggers after a specified amount of time</p>\n    </div>\n  </div>\n</div>\n<div class=\"blockelem create-flowy noselect\">\n  <input type=\"hidden\" name=\"blockelemtype\" class=\"blockelemtype\" value=\"4\">\n  <div class=\"grabme\"><img src=\"").concat(images.grabme, "\"></div>\n  <div class=\"blockin\">\n    <div class=\"blockico\"><span></span><img src=\"").concat(images.error, "\"></div>\n    <div class=\"blocktext\">\n      <p class=\"blocktitle\">Error prompt</p>\n      <p class=\"blockdesc\">Triggers when a specified error happens</p>\n    </div>\n  </div>\n</div>\n");
templates.blocks = ["<div class=\"blockyleft\">\n    <img src=\"".concat(images.eyeblue, "\">\n    <p class=\"blockyname\">New visitor</p>\n  </div>\n  <div class=\"blockyright\"><img src=\"").concat(images.more, "\"></div>\n  <div class=\"blockydiv\"></div>\n  <div class=\"blockyinfo\">When a <span>new visitor</span> goes to <span>Site 1</span></div>"), "<div class=\"blockyleft\">\n    <img src=\"".concat(images.actionblue, "\">\n    <p class=\"blockyname\">Action is performed</p>\n  </div>\n  <div class=\"blockyright\"><img src=\"").concat(images.more, "\"></div>\n  <div class=\"blockydiv\"></div>\n  <div class=\"blockyinfo\">When <span>Action 1</span> is performed</div>"), "<div class=\"blockyleft\">\n    <img src=\"".concat(images.timeblue, "\">\n    <p class=\"blockyname\">Time has passed</p>\n  </div>\n  <div class=\"blockyright\"><img src=\"").concat(images.more, "\"></div>\n  <div class=\"blockydiv\"></div>\n  <div class=\"blockyinfo\">When <span>10 seconds</span> have passed</div>"), "<div class=\"blockyleft\">\n    <img src=\"".concat(images.errorblue, "\">\n    <p class=\"blockyname\">Error prompt</p>\n  </div>\n  <div class=\"blockyright\"><img src=\"").concat(images.more, "\"></div>\n  <div class=\"blockydiv\"></div>\n  <div class=\"blockyinfo\">When <span>Error 1</span> is triggered</div>"), "<div class=\"blockyleft\">\n    <img src=\"".concat(images.databaseorange, "\">\n    <p class=\"blockyname\">New database entry</p>\n  </div>\n  <div class=\"blockyright\"><img src=\"").concat(images.more, "\"></div>\n  <div class=\"blockydiv\"></div>\n  <div class=\"blockyinfo\">Add <span>Data object</span> to <span>Database 1</span></div>"), "<div class=\"blockyleft\">\n    <img src=\"".concat(images.databaseorange, "\">\n    <p class=\"blockyname\">Update database</p>\n  </div>\n  <div class=\"blockyright\"><img src=\"").concat(images.more, "\"></div>\n  <div class=\"blockydiv\"></div>\n  <div class=\"blockyinfo\">Update <span>Database 1</span></div>"), "<div class=\"blockyleft\">\n    <img src=\"".concat(images.actionorange, "\">\n    <p class=\"blockyname\">Perform an action</p>\n  </div>\n  <div class=\"blockyright\"><img src=\"").concat(images.more, "\"></div>\n  <div class=\"blockydiv\"></div>\n  <div class=\"blockyinfo\">Perform <span>Action 1</span></div>"), "<div class=\"blockyleft\">\n    <img src=\"".concat(images.twitterorange, "\">\n    <p class=\"blockyname\">Make a tweet</p>\n  </div>\n  <div class=\"blockyright\"><img src=\"").concat(images.more, "\"></div>\n  <div class=\"blockydiv\"></div>\n  <div class=\"blockyinfo\">Tweet <span>Query 1</span> with the account <span>@alyssaxuu</span></div>"), "<div class=\"blockyleft\">\n    <img src=\"".concat(images.logred, "\">\n    <p class=\"blockyname\">Add new log entry</p>\n  </div>\n  <div class=\"blockyright\"><img src=\"").concat(images.more, "\"></div>\n  <div class=\"blockydiv\"></div>\n  <div class=\"blockyinfo\">Add new <span>success</span> log entry</div>"), "<div class=\"blockyleft\">\n    <img src=\"".concat(images.logred, "\">\n    <p class=\"blockyname\">Update logs</p>\n  </div>\n  <div class=\"blockyright\"><img src=\"").concat(images.more, "\"></div>\n  <div class=\"blockydiv\"></div>\n  <div class=\"blockyinfo\">Edit <span>Log Entry 1</span></div>"), "<div class=\"blockyleft\">\n    <img src=\"".concat(images.errorred, "\">\n    <p class=\"blockyname\">Prompt an error</p>\n  </div>\n  <div class=\"blockyright\"><img src=\"").concat(images.more, "\"></div>\n  <div class=\"blockydiv\"></div>\n  <div class=\"blockyinfo\">Trigger <span>Error 1</span></div>")];
templates.blocklists = {
  triggers: "<div class=\"blockelem create-flowy noselect\">\n  <input type=\"hidden\" name=\"blockelemtype\" class=\"blockelemtype\" value=\"1\">\n  <div class=\"grabme\"><img src=\"".concat(images.grabme, "\"></div>\n  <div class=\"blockin\">\n    <div class=\"blockico\"><span></span><img src=\"").concat(images.eye, "\"></div>\n    <div class=\"blocktext\">\n      <p class=\"blocktitle\">New visitor</p>\n      <p class=\"blockdesc\">Triggers when somebody visits a specified page</p>\n    </div>\n  </div>\n</div>\n<div class=\"blockelem create-flowy noselect\">\n  <input type=\"hidden\" name=\"blockelemtype\" class=\"blockelemtype\" value=\"2\">\n  <div class=\"grabme\"><img src=\"").concat(images.grabme, "\"></div>\n  <div class=\"blockin\">\n    <div class=\"blockico\"><span></span><img src=\"").concat(images.action, "\"></div>\n    <div class=\"blocktext\">\n      <p class=\"blocktitle\">Action is performed</p>\n      <p class=\"blockdesc\">Triggers when somebody performs a specified action</p>\n    </div>\n  </div>\n</div>\n<div class=\"blockelem create-flowy noselect\">\n  <input type=\"hidden\" name=\"blockelemtype\" class=\"blockelemtype\" value=\"3\">\n  <div class=\"grabme\"><img src=\"").concat(images.grabme, "\"></div>\n  <div class=\"blockin\">\n    <div class=\"blockico\"><span></span><img src=\"").concat(images.time, "\"></div>\n    <div class=\"blocktext\">\n      <p class=\"blocktitle\">Time has passed</p>\n      <p class=\"blockdesc\">Triggers after a specified amount of time</p>\n    </div>\n  </div>\n</div>\n<div class=\"blockelem create-flowy noselect\">\n  <input type=\"hidden\" name=\"blockelemtype\" class=\"blockelemtype\" value=\"4\">\n  <div class=\"grabme\"><img src=\"").concat(images.grabme, "\"></div>\n  <div class=\"blockin\">\n    <div class=\"blockico\"><span></span><img src=\"").concat(images.error, "\"></div>\n    <div class=\"blocktext\">\n      <p class=\"blocktitle\">Error prompt</p>\n      <p class=\"blockdesc\">Triggers when a specified error happens</p>\n    </div>\n  </div>\n</div>"),
  actions: "<div class=\"blockelem create-flowy noselect\">\n  <input type=\"hidden\" name=\"blockelemtype\" class=\"blockelemtype\" value=\"5\">\n  <div class=\"grabme\"><img src=\"".concat(images.grabme, "\"></div>\n  <div class=\"blockin\">\n    <div class=\"blockico\"><span></span><img src=\"").concat(images.database, "\"></div>\n    <div class=\"blocktext\">\n      <p class=\"blocktitle\">New database entry</p>\n      <p class=\"blockdesc\">Adds a new entry to a specified database</p>\n    </div>\n  </div>\n</div>\n<div class=\"blockelem create-flowy noselect\">\n  <input type=\"hidden\" name=\"blockelemtype\" class=\"blockelemtype\" value=\"6\">\n  <div class=\"grabme\"><img src=\"").concat(images.grabme, "\"></div>\n  <div class=\"blockin\">\n    <div class=\"blockico\"><span></span><img src=\"").concat(images.database, "\"></div>\n    <div class=\"blocktext\">\n      <p class=\"blocktitle\">Update database</p>\n      <p class=\"blockdesc\">Edits and deletes database entries and properties</p>\n    </div>\n  </div>\n</div>\n<div class=\"blockelem create-flowy noselect\">\n  <input type=\"hidden\" name=\"blockelemtype\" class=\"blockelemtype\" value=\"7\">\n  <div class=\"grabme\"><img src=\"").concat(images.grabme, "\"></div>\n  <div class=\"blockin\">\n    <div class=\"blockico\"><span></span><img src=\"").concat(images.action, "\"></div>\n    <div class=\"blocktext\">\n      <p class=\"blocktitle\">Perform an action</p>\n      <p class=\"blockdesc\">Performs or edits a specified action</p>\n    </div>\n  </div>\n</div>\n<div class=\"blockelem create-flowy noselect\">\n  <input type=\"hidden\" name=\"blockelemtype\" class=\"blockelemtype\" value=\"8\">\n  <div class=\"grabme\"><img src=\"").concat(images.grabme, "\"></div>\n  <div class=\"blockin\">\n    <div class=\"blockico\"><span></span><img src=\"").concat(images.twitter, "\"></div>\n    <div class=\"blocktext\">\n      <p class=\"blocktitle\">Make a tweet</p>\n      <p class=\"blockdesc\">Makes a tweet with a specified query</p>\n    </div>\n  </div>\n</div>"),
  loggers: "<div class=\"blockelem create-flowy noselect\">\n  <input type=\"hidden\" name=\"blockelemtype\" class=\"blockelemtype\" value=\"9\">\n  <div class=\"grabme\"><img src=\"".concat(images.grabme, "\"></div>\n  <div class=\"blockin\">\n    <div class=\"blockico\"><span></span><img src=\"").concat(images.log, "\"></div>\n    <div class=\"blocktext\">\n      <p class=\"blocktitle\">Add new log entry</p>\n      <p class=\"blockdesc\">Adds a new log entry to this project</p>\n    </div>\n  </div>\n</div>\n<div class=\"blockelem create-flowy noselect\">\n  <input type=\"hidden\" name=\"blockelemtype\" class=\"blockelemtype\" value=\"10\">\n  <div class=\"grabme\"><img src=\"").concat(images.grabme, "\"></div>\n  <div class=\"blockin\">\n    <div class=\"blockico\"><span></span><img src=\"").concat(images.log, "\"></div>\n    <div class=\"blocktext\">\n      <p class=\"blocktitle\">Update logs</p>\n      <p class=\"blockdesc\">Edits and deletes log entries in this project</p>\n    </div>\n  </div>\n</div>\n<div class=\"blockelem create-flowy noselect\">\n  <input type=\"hidden\" name=\"blockelemtype\" class=\"blockelemtype\" value=\"11\">\n  <div class=\"grabme\"><img src=\"").concat(images.grabme, "\"></div>\n  <div class=\"blockin\">\n    <div class=\"blockico\"><span></span><img src=\"").concat(images.error, "\"></div>\n    <div class=\"blocktext\">\n      <p class=\"blocktitle\">Prompt an error</p>\n      <p class=\"blockdesc\">Triggers a specified error</p>\n    </div>\n  </div>\n</div>")
};
$(document).ready(function () {
  var rightcard = false;
  var tempblock;
  var tempblock2;
  $('#blocklist').html(templates.blocklist);
  (0, _flowy.default)($('#canvas'), drag, release, snapping);

  function snapping(drag, first) {
    drag.children('.grabme').remove();
    drag.children('.blockin').remove();
    drag.append(templates.blocks[parseInt(drag.children('.blockelemtype').val()) - 1]);
  }

  function drag(block) {
    block.addClass('blockdisabled');
    tempblock2 = block;
  }

  function release() {
    tempblock2.removeClass('blockdisabled');
  }

  $(document).on('click', '.navdisabled', function () {
    $('.navactive').addClass('navdisabled');
    $('.navactive').removeClass('navactive');
    $(this).addClass('navactive');
    $(this).removeClass('navdisabled');
    $('#blocklist').html(templates.blocklists[$(this).attr('id')]);
  });
  $('#close').click(function () {
    if (rightcard) {
      rightcard = false;
      $('#properties').removeClass('expanded');
      setTimeout(function () {
        $('#propwrap').removeClass('itson');
      }, 300);
      tempblock.removeClass('selectedblock');
    }
  });
  $('#removeblock').on('click', function () {
    _flowy.default.deleteBlocks();
  });
  $(document).on('mousedown', '.block', function (event) {
    $(document).on('mouseup mousemove', '.block', function handler(event) {
      if (event.type === 'mouseup') {
        if (!rightcard) {
          tempblock = $(this);
          rightcard = true;
          $('#properties').addClass('expanded');
          $('#propwrap').addClass('itson');
          tempblock.addClass('selectedblock');
        }
      }

      $(document).off('mouseup mousemove', handler);
    });
  });
});
},{"./flowy":"flowy.js","./demo.css":"demo.css","./flowy.css":"flowy.css","./assets/*.png":"assets/*.png","./assets/*.svg":"assets/*.svg"}],"../node_modules/parcel-bundler/src/builtins/hmr-runtime.js":[function(require,module,exports) {
var global = arguments[3];
var OVERLAY_ID = '__parcel__error__overlay__';
var OldModule = module.bundle.Module;

function Module(moduleName) {
  OldModule.call(this, moduleName);
  this.hot = {
    data: module.bundle.hotData,
    _acceptCallbacks: [],
    _disposeCallbacks: [],
    accept: function (fn) {
      this._acceptCallbacks.push(fn || function () {});
    },
    dispose: function (fn) {
      this._disposeCallbacks.push(fn);
    }
  };
  module.bundle.hotData = null;
}

module.bundle.Module = Module;
var checkedAssets, assetsToAccept;
var parent = module.bundle.parent;

if ((!parent || !parent.isParcelRequire) && typeof WebSocket !== 'undefined') {
  var hostname = "" || location.hostname;
  var protocol = location.protocol === 'https:' ? 'wss' : 'ws';
  var ws = new WebSocket(protocol + '://' + hostname + ':' + "34741" + '/');

  ws.onmessage = function (event) {
    checkedAssets = {};
    assetsToAccept = [];
    var data = JSON.parse(event.data);

    if (data.type === 'update') {
      var handled = false;
      data.assets.forEach(function (asset) {
        if (!asset.isNew) {
          var didAccept = hmrAcceptCheck(global.parcelRequire, asset.id);

          if (didAccept) {
            handled = true;
          }
        }
      }); // Enable HMR for CSS by default.

      handled = handled || data.assets.every(function (asset) {
        return asset.type === 'css' && asset.generated.js;
      });

      if (handled) {
        console.clear();
        data.assets.forEach(function (asset) {
          hmrApply(global.parcelRequire, asset);
        });
        assetsToAccept.forEach(function (v) {
          hmrAcceptRun(v[0], v[1]);
        });
      } else if (location.reload) {
        // `location` global exists in a web worker context but lacks `.reload()` function.
        location.reload();
      }
    }

    if (data.type === 'reload') {
      ws.close();

      ws.onclose = function () {
        location.reload();
      };
    }

    if (data.type === 'error-resolved') {
      console.log('[parcel] ✨ Error resolved');
      removeErrorOverlay();
    }

    if (data.type === 'error') {
      console.error('[parcel] 🚨  ' + data.error.message + '\n' + data.error.stack);
      removeErrorOverlay();
      var overlay = createErrorOverlay(data);
      document.body.appendChild(overlay);
    }
  };
}

function removeErrorOverlay() {
  var overlay = document.getElementById(OVERLAY_ID);

  if (overlay) {
    overlay.remove();
  }
}

function createErrorOverlay(data) {
  var overlay = document.createElement('div');
  overlay.id = OVERLAY_ID; // html encode message and stack trace

  var message = document.createElement('div');
  var stackTrace = document.createElement('pre');
  message.innerText = data.error.message;
  stackTrace.innerText = data.error.stack;
  overlay.innerHTML = '<div style="background: black; font-size: 16px; color: white; position: fixed; height: 100%; width: 100%; top: 0px; left: 0px; padding: 30px; opacity: 0.85; font-family: Menlo, Consolas, monospace; z-index: 9999;">' + '<span style="background: red; padding: 2px 4px; border-radius: 2px;">ERROR</span>' + '<span style="top: 2px; margin-left: 5px; position: relative;">🚨</span>' + '<div style="font-size: 18px; font-weight: bold; margin-top: 20px;">' + message.innerHTML + '</div>' + '<pre>' + stackTrace.innerHTML + '</pre>' + '</div>';
  return overlay;
}

function getParents(bundle, id) {
  var modules = bundle.modules;

  if (!modules) {
    return [];
  }

  var parents = [];
  var k, d, dep;

  for (k in modules) {
    for (d in modules[k][1]) {
      dep = modules[k][1][d];

      if (dep === id || Array.isArray(dep) && dep[dep.length - 1] === id) {
        parents.push(k);
      }
    }
  }

  if (bundle.parent) {
    parents = parents.concat(getParents(bundle.parent, id));
  }

  return parents;
}

function hmrApply(bundle, asset) {
  var modules = bundle.modules;

  if (!modules) {
    return;
  }

  if (modules[asset.id] || !bundle.parent) {
    var fn = new Function('require', 'module', 'exports', asset.generated.js);
    asset.isNew = !modules[asset.id];
    modules[asset.id] = [fn, asset.deps];
  } else if (bundle.parent) {
    hmrApply(bundle.parent, asset);
  }
}

function hmrAcceptCheck(bundle, id) {
  var modules = bundle.modules;

  if (!modules) {
    return;
  }

  if (!modules[id] && bundle.parent) {
    return hmrAcceptCheck(bundle.parent, id);
  }

  if (checkedAssets[id]) {
    return;
  }

  checkedAssets[id] = true;
  var cached = bundle.cache[id];
  assetsToAccept.push([bundle, id]);

  if (cached && cached.hot && cached.hot._acceptCallbacks.length) {
    return true;
  }

  return getParents(global.parcelRequire, id).some(function (id) {
    return hmrAcceptCheck(global.parcelRequire, id);
  });
}

function hmrAcceptRun(bundle, id) {
  var cached = bundle.cache[id];
  bundle.hotData = {};

  if (cached) {
    cached.hot.data = bundle.hotData;
  }

  if (cached && cached.hot && cached.hot._disposeCallbacks.length) {
    cached.hot._disposeCallbacks.forEach(function (cb) {
      cb(bundle.hotData);
    });
  }

  delete bundle.cache[id];
  bundle(id);
  cached = bundle.cache[id];

  if (cached && cached.hot && cached.hot._acceptCallbacks.length) {
    cached.hot._acceptCallbacks.forEach(function (cb) {
      cb();
    });

    return true;
  }
}
},{}]},{},["../node_modules/parcel-bundler/src/builtins/hmr-runtime.js","demo.js"], null)
//# sourceMappingURL=/demo.d3b53871.js.map