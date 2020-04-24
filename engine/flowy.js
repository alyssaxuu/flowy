var flowy = function(canvas, grab, release, snapping, rearrange, spacing_x, spacing_y) {
    if (!grab) {
        grab = function() {};
    }
    if (!release) {
        release = function() {};
    }
    if (!snapping) {
        snapping = function() {
            return true;
        }
    }
    if (!rearrange) {
        rearrange = function() {
            return false;
        }
    }
    if (!spacing_x) {
        spacing_x = 20;
    }
    if (!spacing_y) {
        spacing_y = 80;
    }
    var loaded = false;
    flowy.load = function() {
        if (!loaded)
            loaded = true;
        else 
            return;
        var blocks = [];
        var blockstemp = [];
        var canvas_div = canvas;
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
        flowy.import = function(output) {
            canvas_div.innerHTML = output.html;
            blocks = output.blockarr;
            if (blocks.length > 1) {
                rearrangeMe();
            }
        }
        flowy.output = function() {
            var html_ser = canvas_div.innerHTML;
            var json_data = {html:html_ser, blockarr:blocks, blocks:[]};
            if (blocks.length > 0) {
                for (var i = 0; i < blocks.length; i++) {
                    json_data.blocks.push({
                        id: blocks[i].id,
                        parent: blocks[i].parent,
                        data: [],
                        attr: []
                    });
                    var blockParent = document.querySelector(".blockid[value='" + blocks[i].id + "']").parentNode;
                    blockParent.querySelectorAll("input").forEach(function(block) {
                        var json_name = block.getAttribute("name");
                        var json_value = block.value;
                        json_data.blocks[i].data.push({
                            name: json_name,
                            value: json_value
                        });
                    });
                    Array.prototype.slice.call(blockParent.attributes).forEach(function(attribute) {
                        var jsonobj = {};
                        jsonobj[attribute.name] = attribute.value;
                        json_data.blocks[i].attr.push(jsonobj);
                    });
                }
                return json_data;
            }
        }
        flowy.deleteBlocks = function() {
            blocks = [];
            canvas_div.innerHTML = "<div class='indicator invisible'></div>";
        }
        
        flowy.beginDrag = function(event) {
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
                    newNode.innerHTML += "<input type='hidden' name='blockid' class='blockid' value='" + blocks.length + "'>";
                    document.body.appendChild(newNode);
                    drag = document.querySelector(".blockid[value='" + blocks.length + "']").parentNode;
                } else {
                    newNode.innerHTML += "<input type='hidden' name='blockid' class='blockid' value='" + (Math.max.apply(Math, blocks.map(a => a.id)) + 1) + "'>";
                    document.body.appendChild(newNode);
                    drag = document.querySelector(".blockid[value='" + (parseInt(Math.max.apply(Math, blocks.map(a => a.id))) + 1) + "']").parentNode;
                }
                blockGrabbed(event.target.closest(".create-flowy"));
                drag.classList.add("dragging");
                active = true;
                dragx = mouse_x - (event.target.closest(".create-flowy").getBoundingClientRect().left);
                dragy = mouse_y - (event.target.closest(".create-flowy").getBoundingClientRect().top);
                drag.style.left = mouse_x - dragx + "px";
                drag.style.top = mouse_y - dragy + "px";
            }
        }
        document.addEventListener("mousedown",touchblock, false);
        document.addEventListener("touchstart",touchblock, false);
        document.addEventListener("mouseup", touchblock, false);

        flowy.touchDone = function() {
            dragblock = false;
        }
        document.addEventListener('mousedown',flowy.beginDrag);
        document.addEventListener('touchstart',flowy.beginDrag);
        
        flowy.endDrag = function(event) {
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
                            const blockParent = document.querySelector(".blockid[value='" + blockstemp[w].id + "']").parentNode;
                            const arrowParent = document.querySelector(".arrowid[value='" + blockstemp[w].id + "']").parentNode;
                            blockParent.style.left = (blockParent.getBoundingClientRect().left + window.scrollX) - (canvas_div.getBoundingClientRect().left + window.scrollX) + canvas_div.scrollLeft - 1 + "px";
                            blockParent.style.top = (blockParent.getBoundingClientRect().top + window.scrollY) - (canvas_div.getBoundingClientRect().top + window.scrollY) + canvas_div.scrollTop - 1 + "px";
                            arrowParent.style.left = (arrowParent.getBoundingClientRect().left + window.scrollX) - (canvas_div.getBoundingClientRect().left + window.scrollX) + canvas_div.scrollLeft - 1 + "px";
                            arrowParent.style.top = (arrowParent.getBoundingClientRect().top + window.scrollY) - (canvas_div.getBoundingClientRect().top + canvas_div.scrollTop) - 1 + "px";
                            canvas_div.appendChild(blockParent);
                            canvas_div.appendChild(arrowParent);
                            blockstemp[w].x = (blockParent.getBoundingClientRect().left + window.scrollX) + (parseInt(blockParent.offsetWidth) / 2) + canvas_div.scrollLeft - 1;
                            blockstemp[w].y = (blockParent.getBoundingClientRect().top + window.scrollY) + (parseInt(blockParent.offsetHeight) / 2) + canvas_div.scrollTop - 1;
                        }
                    }
                    blockstemp.filter(a => a.id == 0)[0].x = (drag.getBoundingClientRect().left + window.scrollX) + (parseInt(window.getComputedStyle(drag).width) / 2);
                    blockstemp.filter(a => a.id == 0)[0].y = (drag.getBoundingClientRect().top + window.scrollY) + (parseInt(window.getComputedStyle(drag).height) / 2);
                    blocks = blocks.concat(blockstemp);
                    blockstemp = [];
                } else if (active && blocks.length == 0 && (drag.getBoundingClientRect().top + window.scrollY) > (canvas_div.getBoundingClientRect().top + window.scrollY) && (drag.getBoundingClientRect().left + window.scrollX) > (canvas_div.getBoundingClientRect().left + window.scrollX)) {
                    blockSnap(drag, true, undefined);
                    active = false;
                    drag.style.top = (drag.getBoundingClientRect().top + window.scrollY) - (canvas_div.getBoundingClientRect().top + window.scrollY) + canvas_div.scrollTop + "px";
                    drag.style.left = (drag.getBoundingClientRect().left + window.scrollX) - (canvas_div.getBoundingClientRect().left + window.scrollX) + canvas_div.scrollLeft + "px";
                    canvas_div.appendChild(drag);
                    blocks.push({
                        parent: -1,
                        childwidth: 0,
                        id: parseInt(drag.querySelector(".blockid").value),
                        x: (drag.getBoundingClientRect().left + window.scrollX) + (parseInt(window.getComputedStyle(drag).width) / 2) + canvas_div.scrollLeft,
                        y: (drag.getBoundingClientRect().top + window.scrollY) + (parseInt(window.getComputedStyle(drag).height) / 2) + canvas_div.scrollTop,
                        width: parseInt(window.getComputedStyle(drag).width),
                        height: parseInt(window.getComputedStyle(drag).height)
                    });
                } else if (active && blocks.length == 0) {
                    canvas_div.appendChild(document.querySelector(".indicator"));
                    drag.parentNode.removeChild(drag);
                } else if (active) {
                    var xpos = (drag.getBoundingClientRect().left + window.scrollX) + (parseInt(window.getComputedStyle(drag).width) / 2) + canvas_div.scrollLeft;
                    var ypos = (drag.getBoundingClientRect().top + window.scrollY) + canvas_div.scrollTop
                    var blocko = blocks.map(a => a.id);
                    for (var i = 0; i < blocks.length; i++) {
                        if (xpos >= blocks.filter(a => a.id == blocko[i])[0].x - (blocks.filter(a => a.id == blocko[i])[0].width / 2) - paddingx && xpos <= blocks.filter(a => a.id == blocko[i])[0].x + (blocks.filter(a => a.id == blocko[i])[0].width / 2) + paddingx && ypos >= blocks.filter(a => a.id == blocko[i])[0].y - (blocks.filter(a => a.id == blocko[i])[0].height / 2) && ypos <= blocks.filter(a => a.id == blocko[i])[0].y + blocks.filter(a => a.id == blocko[i])[0].height) {
                                            active = false;
                            if (blockSnap(drag, false, blocks.filter(id => id.id == blocko[i])[0])) {
                                snap(drag,i, blocko);
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
                    var xpos = (drag.getBoundingClientRect().left + window.scrollX) + (parseInt(window.getComputedStyle(drag).width) / 2) + canvas_div.scrollLeft;
                    var ypos = (drag.getBoundingClientRect().top + window.scrollY) + canvas_div.scrollTop
                    var blocko = blocks.map(a => a.id);
                    for (var i = 0; i < blocks.length; i++) {
                        if (xpos >= blocks.filter(a => a.id == blocko[i])[0].x - (blocks.filter(a => a.id == blocko[i])[0].width / 2) - paddingx && xpos <= blocks.filter(a => a.id == blocko[i])[0].x + (blocks.filter(a => a.id == blocko[i])[0].width / 2) + paddingx && ypos >= blocks.filter(a => a.id == blocko[i])[0].y - (blocks.filter(a => a.id == blocko[i])[0].height / 2) && ypos <= blocks.filter(a => a.id == blocko[i])[0].y + blocks.filter(a => a.id == blocko[i])[0].height) {
                            active = false;
                            drag.classList.remove("dragging");
                            snap(drag,i,blocko);
                            break;
                        } else if (i == blocks.length - 1) {
                            if (beforeDelete(drag, blocks.filter(id => id.id == blocko[i])[0])) {
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
        }
        
        document.addEventListener("mouseup", flowy.endDrag, false);
        document.addEventListener("touchend", flowy.endDrag, false);
        
        function snap(drag, i, blocko) {
            if (!rearrange) {
                canvas_div.appendChild(drag);
            }
            var totalwidth = 0;
            var totalremove = 0;
            var maxheight = 0;
            for (var w = 0; w < blocks.filter(id => id.parent == blocko[i]).length; w++) {
                var children = blocks.filter(id => id.parent == blocko[i])[w];
                if (children.childwidth > children.width) {
                    totalwidth += children.childwidth + paddingx;
                } else {
                    totalwidth += children.width + paddingx;
                }
            }
            totalwidth += parseInt(window.getComputedStyle(drag).width);
            for (var w = 0; w < blocks.filter(id => id.parent == blocko[i]).length; w++) {
                var children = blocks.filter(id => id.parent == blocko[i])[w];
                if (children.childwidth > children.width) {
                    document.querySelector(".blockid[value='" + children.id + "']").parentNode.style.left = blocks.filter(a => a.id == blocko[i])[0].x - (totalwidth / 2) + totalremove + (children.childwidth / 2) - (children.width / 2) + "px";
                    children.x = blocks.filter(id => id.parent == blocko[i])[0].x - (totalwidth / 2) + totalremove + (children.childwidth / 2);
                    totalremove += children.childwidth + paddingx;
                } else {
                    document.querySelector(".blockid[value='" + children.id + "']").parentNode.style.left = blocks.filter(a => a.id == blocko[i])[0].x - (totalwidth / 2) + totalremove + "px";
                    children.x = blocks.filter(id => id.parent == blocko[i])[0].x - (totalwidth / 2) + totalremove + (children.width / 2);
                    totalremove += children.width + paddingx;
                }
            }
            drag.style.left = blocks.filter(id => id.id == blocko[i])[0].x - (totalwidth / 2) + totalremove - (canvas_div.getBoundingClientRect().left + window.scrollX) + canvas_div.scrollLeft + "px";
            drag.style.top = blocks.filter(id => id.id == blocko[i])[0].y + (blocks.filter(id => id.id == blocko[i])[0].height / 2) + paddingy - (canvas_div.getBoundingClientRect().top + window.scrollY) + "px";
            if (rearrange) {
                blockstemp.filter(a => a.id == parseInt(drag.querySelector(".blockid").value))[0].x = (drag.getBoundingClientRect().left + window.scrollX) + (parseInt(window.getComputedStyle(drag).width) / 2) + canvas_div.scrollLeft;
                blockstemp.filter(a => a.id == parseInt(drag.querySelector(".blockid").value))[0].y = (drag.getBoundingClientRect().top + window.scrollY) + (parseInt(window.getComputedStyle(drag).height) / 2) + canvas_div.scrollTop;
                blockstemp.filter(a => a.id == drag.querySelector(".blockid").value)[0].parent = blocko[i];
                for (var w = 0; w < blockstemp.length; w++) {
                    if (blockstemp[w].id != parseInt(drag.querySelector(".blockid").value)) {
                        const blockParent = document.querySelector(".blockid[value='" + blockstemp[w].id + "']").parentNode;
                        const arrowParent = document.querySelector(".arrowid[value='" + blockstemp[w].id + "']").parentNode;
                        blockParent.style.left = (blockParent.getBoundingClientRect().left + window.scrollX) - (canvas_div.getBoundingClientRect().left + window.scrollX) + canvas_div.scrollLeft + "px";
                        blockParent.style.top = (blockParent.getBoundingClientRect().top + window.scrollY) - (canvas_div.getBoundingClientRect().top + window.scrollY) + canvas_div.scrollTop + "px";
                        arrowParent.style.left = (arrowParent.getBoundingClientRect().left + window.scrollX) - (canvas_div.getBoundingClientRect().left + window.scrollX) + canvas_div.scrollLeft + 20 + "px";
                        arrowParent.style.top = (arrowParent.getBoundingClientRect().top + window.scrollY) - (canvas_div.getBoundingClientRect().top + window.scrollY) + canvas_div.scrollTop + "px";
                        canvas_div.appendChild(blockParent);
                        canvas_div.appendChild(arrowParent);

                        blockstemp[w].x = (blockParent.getBoundingClientRect().left + window.scrollX) + (parseInt(window.getComputedStyle(blockParent).width) / 2) + canvas_div.scrollLeft;
                        blockstemp[w].y = (blockParent.getBoundingClientRect().top + window.scrollY) + (parseInt(window.getComputedStyle(blockParent).height) / 2) + canvas_div.scrollTop;

                    }
                }
                blocks = blocks.concat(blockstemp);
                blockstemp = [];
            } else {
                blocks.push({
                    childwidth: 0,
                    parent: blocko[i],
                    id: parseInt(drag.querySelector(".blockid").value),
                    x: (drag.getBoundingClientRect().left + window.scrollX) + (parseInt(window.getComputedStyle(drag).width) / 2) + canvas_div.scrollLeft,
                    y: (drag.getBoundingClientRect().top + window.scrollY) + (parseInt(window.getComputedStyle(drag).height) / 2) + canvas_div.scrollTop,
                    width: parseInt(window.getComputedStyle(drag).width),
                    height: parseInt(window.getComputedStyle(drag).height)
                });
            }
            var arrowhelp = blocks.filter(a => a.id == parseInt(drag.querySelector(".blockid").value))[0];
            var arrowx = arrowhelp.x - blocks.filter(a => a.id == blocko[i])[0].x + 20;
            var arrowy = parseFloat(arrowhelp.y - (arrowhelp.height / 2) - (blocks.filter(id => id.parent == blocko[i])[0].y + (blocks.filter(id => id.parent == blocko[i])[0].height / 2)) + canvas_div.scrollTop);
            if (arrowx < 0) {
                canvas_div.innerHTML += '<div class="arrowblock"><input type="hidden" class="arrowid" value="' + drag.querySelector(".blockid").value + '"><svg preserveaspectratio="none" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M' + (blocks.filter(a => a.id == blocko[i])[0].x - arrowhelp.x + 5) + ' 0L' + (blocks.filter(a => a.id == blocko[i])[0].x - arrowhelp.x + 5) + ' ' + (paddingy / 2) + 'L5 ' + (paddingy / 2) + 'L5 ' + arrowy + '" stroke="#C5CCD0" stroke-width="2px"/><path d="M0 ' + (arrowy - 5) + 'H10L5 ' + arrowy + 'L0 ' + (arrowy - 5) + 'Z" fill="#C5CCD0"/></svg></div>';
                document.querySelector('.arrowid[value="' + drag.querySelector(".blockid").value + '"]').parentNode.style.left = (arrowhelp.x - 5) - (canvas_div.getBoundingClientRect().left + window.scrollX) + canvas_div.scrollLeft + "px";
            } else {
                canvas_div.innerHTML += '<div class="arrowblock"><input type="hidden" class="arrowid" value="' + drag.querySelector(".blockid").value + '"><svg preserveaspectratio="none" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M20 0L20 ' + (paddingy / 2) + 'L' + (arrowx) + ' ' + (paddingy / 2) + 'L' + arrowx + ' ' + arrowy + '" stroke="#C5CCD0" stroke-width="2px"/><path d="M' + (arrowx - 5) + ' ' + (arrowy - 5) + 'H' + (arrowx + 5) + 'L' + arrowx + ' ' + arrowy + 'L' + (arrowx - 5) + ' ' + (arrowy - 5) + 'Z" fill="#C5CCD0"/></svg></div>';
                document.querySelector('.arrowid[value="' + parseInt(drag.querySelector(".blockid").value) + '"]').parentNode.style.left = blocks.filter(a => a.id == blocko[i])[0].x - 20 - (canvas_div.getBoundingClientRect().left + window.scrollX) + canvas_div.scrollLeft + "px";
            }
            document.querySelector('.arrowid[value="' + parseInt(drag.querySelector(".blockid").value) + '"]').parentNode.style.top = blocks.filter(a => a.id == blocko[i])[0].y + (blocks.filter(a => a.id == blocko[i])[0].height / 2) + "px";
            if (blocks.filter(a => a.id == blocko[i])[0].parent != -1) {
                var flag = false;
                var idval = blocko[i];
                while (!flag) {
                    if (blocks.filter(a => a.id == idval)[0].parent == -1) {
                        flag = true;
                    } else {
                        var zwidth = 0;
                        for (var w = 0; w < blocks.filter(id => id.parent == idval).length; w++) {
                            var children = blocks.filter(id => id.parent == idval)[w];
                            if (children.childwidth > children.width) {
                                if (w == blocks.filter(id => id.parent == idval).length - 1) {
                                    zwidth += children.childwidth;
                                } else {
                                    zwidth += children.childwidth + paddingx;
                                }
                            } else {
                                if (w == blocks.filter(id => id.parent == idval).length - 1) {
                                    zwidth += children.width;
                                } else {
                                    zwidth += children.width + paddingx;
                                }
                            }
                        }
                        blocks.filter(a => a.id == idval)[0].childwidth = zwidth;
                        idval = blocks.filter(a => a.id == idval)[0].parent;
                    }
                }
                blocks.filter(id => id.id == idval)[0].childwidth = totalwidth;
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
                            dragx = mouse_x - (drag.getBoundingClientRect().left + window.scrollX);
                            dragy = mouse_y - (drag.getBoundingClientRect().top + window.scrollY);
                        }
                    }
                }
            }
        }

        function hasParentClass(element, classname) {
            if (element.className) {
                if (element.className.split(' ').indexOf(classname)>=0) return true;
            }
            return element.parentNode && hasParentClass(element.parentNode, classname);
        }
        
        flowy.moveBlock = function(event) {
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
                prevblock = blocks.filter(a => a.id == blockid)[0].parent;
                blockstemp.push(blocks.filter(a => a.id == blockid)[0]);
                blocks = blocks.filter(function(e) {
                    return e.id != blockid
                });
                if (blockid != 0) {
                    document.querySelector(".arrowid[value='" + blockid + "']").parentNode.remove();
                }
                var layer = blocks.filter(a => a.parent == blockid);
                var flag = false;
                var foundids = [];
                var allids = [];
                while (!flag) {
                    for (var i = 0; i < layer.length; i++) {
                        if (layer[i] != blockid) {
                        blockstemp.push(blocks.filter(a => a.id == layer[i].id)[0]);
                        const blockParent = document.querySelector(".blockid[value='" + layer[i].id + "']").parentNode;
                        const arrowParent = document.querySelector(".arrowid[value='" + layer[i].id + "']").parentNode;
                        blockParent.style.left = (blockParent.getBoundingClientRect().left + window.scrollX) - (drag.getBoundingClientRect().left + window.scrollX) + "px";
                        blockParent.style.top = (blockParent.getBoundingClientRect().top + window.scrollY) - (drag.getBoundingClientRect().top + window.scrollY) + "px";
                        arrowParent.style.left = (arrowParent.getBoundingClientRect().left + window.scrollX) - (drag.getBoundingClientRect().left + window.scrollX) + "px";
                        arrowParent.style.top = (arrowParent.getBoundingClientRect().top + window.scrollY) - (drag.getBoundingClientRect().top + window.scrollY) + "px";
                        drag.appendChild(blockParent);
                        drag.appendChild(arrowParent);
                        foundids.push(layer[i].id);
                        allids.push(layer[i].id);
                        }
                    }
                    if (foundids.length == 0) {
                        flag = true;
                    } else {
                        layer = blocks.filter(a => foundids.includes(a.parent));
                        foundids = [];
                    }
                }
                for (var i = 0; i < blocks.filter(a => a.parent == blockid).length; i++) {
                    var blocknumber = blocks.filter(a => a.parent == blockid)[i];
                    blocks = blocks.filter(function(e) {
                        return e.id != blocknumber
                    });
                }
                for (var i = 0; i < allids.length; i++) {
                    var blocknumber = allids[i];
                    blocks = blocks.filter(function(e) {
                        return e.id != blocknumber
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
                drag.style.left = mouse_x - dragx - (canvas_div.getBoundingClientRect().left + window.scrollX) + canvas_div.scrollLeft + "px";
                drag.style.top = mouse_y - dragy - (canvas_div.getBoundingClientRect().top + window.scrollY) + canvas_div.scrollTop + "px";
                blockstemp.filter(a => a.id == parseInt(drag.querySelector(".blockid").value)).x = (drag.getBoundingClientRect().left + window.scrollX) + (parseInt(window.getComputedStyle(drag).width) / 2) + canvas_div.scrollLeft;
                blockstemp.filter(a => a.id == parseInt(drag.querySelector(".blockid").value)).y = (drag.getBoundingClientRect().left + window.scrollX) + (parseInt(window.getComputedStyle(drag).height) / 2) + canvas_div.scrollTop;
            }
            if (active || rearrange) {
                var xpos = (drag.getBoundingClientRect().left + window.scrollX) + (parseInt(window.getComputedStyle(drag).width) / 2) + canvas_div.scrollLeft;
                var ypos = (drag.getBoundingClientRect().top + window.scrollY) + canvas_div.scrollTop;
                var blocko = blocks.map(a => a.id);
                for (var i = 0; i < blocks.length; i++) {
                    if (xpos >= blocks.filter(a => a.id == blocko[i])[0].x - (blocks.filter(a => a.id == blocko[i])[0].width / 2) - paddingx && xpos <= blocks.filter(a => a.id == blocko[i])[0].x + (blocks.filter(a => a.id == blocko[i])[0].width / 2) + paddingx && ypos >= blocks.filter(a => a.id == blocko[i])[0].y - (blocks.filter(a => a.id == blocko[i])[0].height / 2) && ypos <= blocks.filter(a => a.id == blocko[i])[0].y + blocks.filter(a => a.id == blocko[i])[0].height) {
                        document.querySelector(".blockid[value='" + blocko[i] + "']").parentNode.appendChild(document.querySelector(".indicator"));
                        document.querySelector(".indicator").style.left = (parseInt(window.getComputedStyle(document.querySelector(".blockid[value='" + blocko[i] + "']").parentNode).width) / 2) - 5 + "px";
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
        }
        
        document.addEventListener("mousemove", flowy.moveBlock, false);
        document.addEventListener("touchmove", flowy.moveBlock, false);

        function checkOffset() {
            offsetleft = blocks.map(a => a.x);
            var widths = blocks.map(a => a.width);
            var mathmin = offsetleft.map(function(item, index) {
                return item - (widths[index] / 2);
            })
            offsetleft = Math.min.apply(Math, mathmin);
            if (offsetleft < (canvas_div.getBoundingClientRect().left + window.scrollX)) {
                lastevent = true;
                var blocko = blocks.map(a => a.id);
                for (var w = 0; w < blocks.length; w++) {
                    document.querySelector(".blockid[value='" + blocks.filter(a => a.id == blocko[w])[0].id + "']").parentNode.style.left = blocks.filter(a => a.id == blocko[w])[0].x - (blocks.filter(a => a.id == blocko[w])[0].width / 2) - offsetleft + 20 + "px";
                    if (blocks.filter(a => a.id == blocko[w])[0].parent != -1) {
                        var arrowhelp = blocks.filter(a => a.id == blocko[w])[0];
                        var arrowx = arrowhelp.x - blocks.filter(a => a.id == blocks.filter(a => a.id == blocko[w])[0].parent)[0].x;
                        if (arrowx < 0) {
                            document.querySelector('.arrowid[value="' + blocko[w] + '"]').parentNode.style.left = (arrowhelp.x - offsetleft + 20 - 5) + "px";
                        } else {
                            document.querySelector('.arrowid[value="' + blocko[w] + '"]').parentNode.style.left = blocks.filter(id => id.id == blocks.filter(a => a.id == blocko[w])[0].parent)[0].x - 20 - offsetleft + 20 + "px";
                        }
                    }
                }
                for (var w = 0; w < blocks.length; w++) {
                    blocks[w].x = (document.querySelector(".blockid[value='" + blocks[w].id + "']").parentNode.getBoundingClientRect().left + window.scrollX) + (canvas_div.getBoundingClientRect().left + canvas_div.scrollLeft) - (parseInt(window.getComputedStyle(document.querySelector(".blockid[value='" + blocks[w].id + "']").parentNode).width) / 2) - 40;
                }
                offsetleftold = offsetleft;
            }
        }

        function fixOffset() {
            if (offsetleftold < (canvas_div.getBoundingClientRect().left + window.scrollX)) {
                lastevent = false;
                var blocko = blocks.map(a => a.id);
                for (var w = 0; w < blocks.length; w++) {
                    document.querySelector(".blockid[value='" + blocks.filter(a => a.id == blocko[w])[0].id + "']").parentNode.style.left = blocks.filter(a => a.id == blocko[w])[0].x - (blocks.filter(a => a.id == blocko[w])[0].width / 2) - offsetleftold - 20 + "px";
                    blocks.filter(a => a.id == blocko[w])[0].x = (document.querySelector(".blockid[value='" + blocks.filter(a => a.id == blocko[w])[0].id + "']").parentNode.getBoundingClientRect().left + window.scrollX) + (blocks.filter(a => a.id == blocko[w])[0].width / 2);

                    if (blocks.filter(a => a.id == blocko[w])[0].parent != -1) {
                        var arrowhelp = blocks.filter(a => a.id == blocko[w])[0];
                        var arrowx = arrowhelp.x - blocks.filter(a => a.id == blocks.filter(a => a.id == blocko[w])[0].parent)[0].x;
                        if (arrowx < 0) {
                            document.querySelector('.arrowid[value="' + blocko[w] + '"]').parentNode.style.left = (arrowhelp.x - 5 - (canvas_div.getBoundingClientRect().left + window.scrollX) + "px");
                        } else {
                            document.querySelector('.arrowid[value="' + blocko[w] + '"]').parentNode.style.left = blocks.filter(id => id.id == blocks.filter(a => a.id == blocko[w])[0].parent)[0].x - 20 - (canvas_div.getBoundingClientRect().left + window.scrollX) + "px";
                        }
                    }
                }
                offsetleftold = 0;
            }
        }

        function rearrangeMe() {
            var result = blocks.map(a => a.parent);
            for (var z = 0; z < result.length; z++) {
                if (result[z] == -1) {
                    z++;
                }
                var totalwidth = 0;
                var totalremove = 0;
                var maxheight = 0;
                for (var w = 0; w < blocks.filter(id => id.parent == result[z]).length; w++) {
                    var children = blocks.filter(id => id.parent == result[z])[w];
                    if (blocks.filter(id => id.parent == children.id).length == 0) {
                        children.childwidth = 0;
                    }
                    if (children.childwidth > children.width) {
                        if (w == blocks.filter(id => id.parent == result[z]).length - 1) {
                            totalwidth += children.childwidth;
                        } else {
                            totalwidth += children.childwidth + paddingx;
                        }
                    } else {
                        if (w == blocks.filter(id => id.parent == result[z]).length - 1) {
                            totalwidth += children.width;
                        } else {
                            totalwidth += children.width + paddingx;
                        }
                    }
                }
                if (result[z] != -1) {
                    blocks.filter(a => a.id == result[z])[0].childwidth = totalwidth;
                }
                for (var w = 0; w < blocks.filter(id => id.parent == result[z]).length; w++) {
                    var children = blocks.filter(id => id.parent == result[z])[w];
                    const r_block = document.querySelector(".blockid[value='" + children.id + "']").parentNode;
                    const r_array = blocks.filter(id => id.id == result[z]);
                    r_block.style.top = r_array.y + paddingy + "px";
                    r_array.y = r_array.y + paddingy;
                    if (children.childwidth > children.width) {
                        r_block.style.left = r_array[0].x - (totalwidth / 2) + totalremove + (children.childwidth / 2) - (children.width / 2) - (canvas_div.getBoundingClientRect().left + window.scrollX) + "px";
                        children.x = r_array[0].x - (totalwidth / 2) + totalremove + (children.childwidth / 2);
                        totalremove += children.childwidth + paddingx;
                    } else {
                        r_block.style.left = r_array[0].x - (totalwidth / 2) + totalremove - (canvas_div.getBoundingClientRect().left + window.scrollX) + "px";
                        children.x = r_array[0].x - (totalwidth / 2) + totalremove + (children.width / 2);
                        totalremove += children.width + paddingx;
                    }
                    var arrowhelp = blocks.filter(a => a.id == children.id)[0];
                    var arrowx = arrowhelp.x - blocks.filter(a => a.id == children.parent)[0].x + 20;
                    var arrowy = arrowhelp.y - (arrowhelp.height / 2) - (blocks.filter(a => a.id == children.parent)[0].y + (blocks.filter(a => a.id == children.parent)[0].height / 2));
                    document.querySelector('.arrowid[value="' + children.id + '"]').parentNode.style.top = blocks.filter(id => id.id == children.parent)[0].y + (blocks.filter(id => id.id == children.parent)[0].height / 2) - (canvas_div.getBoundingClientRect().top + window.scrollY) + "px";
                    if (arrowx < 0) {
                        document.querySelector('.arrowid[value="' + children.id + '"]').parentNode.style.left = (arrowhelp.x - 5) - (canvas_div.getBoundingClientRect().left + window.scrollX) + "px";
                        document.querySelector('.arrowid[value="' + children.id + '"]').parentNode.innerHTML = '<input type="hidden" class="arrowid" value="' + children.id + '"><svg preserveaspectratio="none" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M' + (blocks.filter(id => id.id == children.parent)[0].x - arrowhelp.x + 5) + ' 0L' + (blocks.filter(id => id.id == children.parent)[0].x - arrowhelp.x + 5) + ' ' + (paddingy / 2) + 'L5 ' + (paddingy / 2) + 'L5 ' + arrowy + '" stroke="#C5CCD0" stroke-width="2px"/><path d="M0 ' + (arrowy - 5) + 'H10L5 ' + arrowy + 'L0 ' + (arrowy - 5) + 'Z" fill="#C5CCD0"/></svg>';
                    } else {
                        document.querySelector('.arrowid[value="' + children.id + '"]').parentNode.style.left = blocks.filter(id => id.id == children.parent)[0].x - 20 - (canvas_div.getBoundingClientRect().left + window.scrollX) + "px";
                        document.querySelector('.arrowid[value="' + children.id + '"]').parentNode.innerHTML = '<input type="hidden" class="arrowid" value="' + children.id + '"><svg preserveaspectratio="none" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M20 0L20 ' + (paddingy / 2) + 'L' + (arrowx) + ' ' + (paddingy / 2) + 'L' + arrowx + ' ' + arrowy + '" stroke="#C5CCD0" stroke-width="2px"/><path d="M' + (arrowx - 5) + ' ' + (arrowy - 5) + 'H' + (arrowx + 5) + 'L' + arrowx + ' ' + arrowy + 'L' + (arrowx - 5) + ' ' + (arrowy - 5) + 'Z" fill="#C5CCD0"/></svg>';
                    }
                }
            }
        }
    }
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
        for (var i=0; i < nodes.length; i++) {
            nodes[i].addEventListener(type, listener, capture);
        }
    }
    
    function removeEventListenerMulti(type, listener, capture, selector) {
        var nodes = document.querySelectorAll(selector);
        for (var i = 0; i < nodes.length; i++) {
            nodes[i].removeEventListener(type, listener, capture);
        }
    }
}
