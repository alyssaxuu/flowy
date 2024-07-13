document.addEventListener("DOMContentLoaded", function(){
    var rightcard = false;
    var tempblock;
    var tempblock2;
    document.getElementById("blocklist").innerHTML = '<div class="blockelem create-flowy noselect"><input type="hidden" name="blockelemtype" class="blockelemtype" value="1"><div class="grabme"><img src="assets/grabme.svg"></div><div class="blockin">                  <div class="blockico"><span></span><img src="assets/eye.svg"></div><div class="blocktext">                        <p class="blocktitle">New visitor</p><p class="blockdesc">Triggers when somebody visits a specified page</p>        </div></div></div><div class="blockelem create-flowy noselect"><input type="hidden" name="blockelemtype" class="blockelemtype" value="2"><div class="grabme"><img src="assets/grabme.svg"></div><div class="blockin">                    <div class="blockico"><span></span><img src="assets/action.svg"></div><div class="blocktext">                        <p class="blocktitle">Action is performed</p><p class="blockdesc">Triggers when somebody performs a specified action</p></div></div></div><div class="blockelem create-flowy noselect"><input type="hidden" name="blockelemtype" class="blockelemtype" value="3"><div class="grabme"><img src="assets/grabme.svg"></div><div class="blockin">                    <div class="blockico"><span></span><img src="assets/time.svg"></div><div class="blocktext">                        <p class="blocktitle">Time has passed</p><p class="blockdesc">Triggers after a specified amount of time</p>          </div></div></div><div class="blockelem create-flowy noselect"><input type="hidden" name="blockelemtype" class="blockelemtype" value="4"><div class="grabme"><img src="assets/grabme.svg"></div><div class="blockin">                    <div class="blockico"><span></span><img src="assets/error.svg"></div><div class="blocktext">                        <p class="blocktitle">Error prompt</p><p class="blockdesc">Triggers when a specified error happens</p>              </div></div></div>';
    flowy(document.getElementById("canvas"), drag, release, snapping);
    function addEventListenerMulti(type, listener, capture, selector) {
        var nodes = document.querySelectorAll(selector);
        for (var i = 0; i < nodes.length; i++) {
            nodes[i].addEventListener(type, listener, capture);
        }
    }


    var xhr = new XMLHttpRequest();
    xhr.open('GET', 'blocks.json', false);
    xhr.send();
    var blocks = JSON.parse(xhr.responseText);

    var blocklist = document.getElementById("blocklist");
    blocklist.innerHTML = '';
    blocks.forEach(function(block) {
        var blockElem = document.createElement("div");
        blockElem.className = "blockelem create-flowy noselect";
        blockElem.innerHTML = "<input type='hidden' name='blockelemtype' class='blockelemtype' value='" + block.blockelemtype + "'>" +
                              "<div class='grabme'><img src='assets/grabme.svg'></div>" +
                              "<div class='blockin'>" +
                              "<div class='blockico'><span></span><img src='" + block.blockimg + "'></div>" +
                              "<div class='blocktext'>" +
                              "<p class='blocktitle'>" + block.blocktitle + "</p>" +
                              "<p class='blockdesc'>" + block.blockdesc + "</p>" +
                              "</div>" +
                              "</div>";

        blocklist.appendChild(blockElem);
      });


    function snapping(drag, first) {
      var blockType = drag.querySelector(".blockelemtype").value;
      var block = blocks.find(function(b) {
        return b.blockelemtype === blockType;
      });

      drag.innerHTML += "<div class='blockyleft'><img src='" + block.blockimgblue + "'><p class='blockyname'>" + block.blocktitle + "</p></div>" +
                        "<div class='blockyright'><img src='assets/more.svg'></div>" +
                        "<div class='blockydiv'></div>" +
                        "<div class='blockyinfo'>" + block.blockinfo + "</div>";

      drag.querySelector(".block .grabme").style.display='none';
      drag.querySelector(".block .blockin").style.display='none';

      return true;
    }


    function drag(block) {
        block.classList.add("blockdisabled");
        tempblock2 = block;
    }
    function release() {
        if (tempblock2) {
            tempblock2.classList.remove("blockdisabled");
        }
    }
    var disabledClick = function(){
        document.querySelector(".navactive").classList.add("navdisabled");
        document.querySelector(".navactive").classList.remove("navactive");
        this.classList.add("navactive");
        this.classList.remove("navdisabled");
        if (this.getAttribute("id") == "triggers") {
            document.getElementById("blocklist").innerHTML = '<div class="blockelem create-flowy noselect"><input type="hidden" name="blockelemtype" class="blockelemtype" value="1"><div class="grabme"><img src="assets/grabme.svg"></div><div class="blockin">                  <div class="blockico"><span></span><img src="assets/eye.svg"></div><div class="blocktext">                        <p class="blocktitle">New visitor</p><p class="blockdesc">Triggers when somebody visits a specified page</p>        </div></div></div><div class="blockelem create-flowy noselect"><input type="hidden" name="blockelemtype" class="blockelemtype" value="2"><div class="grabme"><img src="assets/grabme.svg"></div><div class="blockin">                    <div class="blockico"><span></span><img src="assets/action.svg"></div><div class="blocktext">                        <p class="blocktitle">Action is performed</p><p class="blockdesc">Triggers when somebody performs a specified action</p></div></div></div><div class="blockelem create-flowy noselect"><input type="hidden" name="blockelemtype" class="blockelemtype" value="3"><div class="grabme"><img src="assets/grabme.svg"></div><div class="blockin">                    <div class="blockico"><span></span><img src="assets/time.svg"></div><div class="blocktext">                        <p class="blocktitle">Time has passed</p><p class="blockdesc">Triggers after a specified amount of time</p>          </div></div></div><div class="blockelem create-flowy noselect"><input type="hidden" name="blockelemtype" class="blockelemtype" value="4"><div class="grabme"><img src="assets/grabme.svg"></div><div class="blockin">                    <div class="blockico"><span></span><img src="assets/error.svg"></div><div class="blocktext">                        <p class="blocktitle">Error prompt</p><p class="blockdesc">Triggers when a specified error happens</p>              </div></div></div>';
        } else if (this.getAttribute("id") == "actions") {
            document.getElementById("blocklist").innerHTML = '<div class="blockelem create-flowy noselect"><input type="hidden" name="blockelemtype" class="blockelemtype" value="5"><div class="grabme"><img src="assets/grabme.svg"></div><div class="blockin">                  <div class="blockico"><span></span><img src="assets/database.svg"></div><div class="blocktext">                        <p class="blocktitle">New database entry</p><p class="blockdesc">Adds a new entry to a specified database</p>        </div></div></div><div class="blockelem create-flowy noselect"><input type="hidden" name="blockelemtype" class="blockelemtype" value="6"><div class="grabme"><img src="assets/grabme.svg"></div><div class="blockin">                  <div class="blockico"><span></span><img src="assets/database.svg"></div><div class="blocktext">                        <p class="blocktitle">Update database</p><p class="blockdesc">Edits and deletes database entries and properties</p>        </div></div></div><div class="blockelem create-flowy noselect"><input type="hidden" name="blockelemtype" class="blockelemtype" value="7"><div class="grabme"><img src="assets/grabme.svg"></div><div class="blockin">                  <div class="blockico"><span></span><img src="assets/action.svg"></div><div class="blocktext">                        <p class="blocktitle">Perform an action</p><p class="blockdesc">Performs or edits a specified action</p>        </div></div></div><div class="blockelem create-flowy noselect"><input type="hidden" name="blockelemtype" class="blockelemtype" value="8"><div class="grabme"><img src="assets/grabme.svg"></div><div class="blockin">                  <div class="blockico"><span></span><img src="assets/twitter.svg"></div><div class="blocktext">                        <p class="blocktitle">Make a tweet</p><p class="blockdesc">Makes a tweet with a specified query</p>        </div></div></div>';
        } else if (this.getAttribute("id") == "loggers") {
            document.getElementById("blocklist").innerHTML = '<div class="blockelem create-flowy noselect"><input type="hidden" name="blockelemtype" class="blockelemtype" value="9"><div class="grabme"><img src="assets/grabme.svg"></div><div class="blockin">                  <div class="blockico"><span></span><img src="assets/log.svg"></div><div class="blocktext">                        <p class="blocktitle">Add new log entry</p><p class="blockdesc">Adds a new log entry to this project</p>        </div></div></div><div class="blockelem create-flowy noselect"><input type="hidden" name="blockelemtype" class="blockelemtype" value="10"><div class="grabme"><img src="assets/grabme.svg"></div><div class="blockin">                  <div class="blockico"><span></span><img src="assets/log.svg"></div><div class="blocktext">                        <p class="blocktitle">Update logs</p><p class="blockdesc">Edits and deletes log entries in this project</p>        </div></div></div><div class="blockelem create-flowy noselect"><input type="hidden" name="blockelemtype" class="blockelemtype" value="11"><div class="grabme"><img src="assets/grabme.svg"></div><div class="blockin">                  <div class="blockico"><span></span><img src="assets/error.svg"></div><div class="blocktext">                        <p class="blocktitle">Prompt an error</p><p class="blockdesc">Triggers a specified error</p>        </div></div></div>';
        }
    }
    addEventListenerMulti("click", disabledClick, false, ".side");


document.getElementById("removeblock").addEventListener("click", function(){
 flowy.deleteBlocks();
});
var aclick = false;
var noinfo = false;
var beginTouch = function (event) {
    aclick = true;
    noinfo = false;
    if (event.target.closest(".create-flowy")) {
        noinfo = true;
    }
}
var checkTouch = function (event) {
    aclick = false;
}
var doneTouch = function(event) {
    if (event.type === "mouseup" && aclick && !noinfo) {
        if (event.target.closest(".block") && !event.target.closest(".block").classList.contains("dragging")) {
            var blockType = event.target.closest(".block").querySelector(".blockid").value;
            var propId = 'properties-' + blockType;
            if (!document.getElementById(propId)) {
                createPropertiesDiv(blockType);
            }
            showPropertiesDiv(propId);
            var selectedblock = document.querySelectorAll(".selectedblock");
            for (var i = 0; i < selectedblock.length; i++) {
                var str = selectedblock[i].classList.remove("selectedblock");
            }
            event.target.closest(".block").classList.add("selectedblock");        }
    }
}

function createPropertiesDiv(blockType) {
  var div = document.createElement("div");
  div.id = 'properties-' + blockType;
  div.className = 'properties';
  div.innerHTML = '<div id="close"><img src="assets/close.svg"></div><p id="header2">Properties for Block ' + blockType + '</p>';

  // Get the block from the blocks.json file based on the blockType
  var block = blocks.find(function(b) {
    return b.blockelemtype === blockType;
  });

  //first block
  var block = blocks.find(function(b) { return b.blockelemtype === blockType; }) || { fieldtypes: [] };
  if (block.fieldtypes.length === 0) {
    block.fieldtypes = [{name: "Name", type: "text"}];
  }

  // Check if the block and fieldtypes property exist
  if (block && block.fieldtypes) {
    // Generate the properties based on the field types defined in the block
    block.fieldtypes.forEach(function(field) {
      var inputElement;
      if (field.type === 'text') {
        inputElement = '<input type="text" name="' + field.name + '" placeholder="' + field.name + '">';
      } else if (field.type === 'select') {
        var options = field.options ? field.options.map(function(option) {
          return '<option value="' + option + '">' + option + '</option>';
        }).join('') : '';
        inputElement = '<select name="' + field.name + '">' + options + '</select>';
      }
      div.innerHTML += '<div class="inputlabel">' + field.name + '</div><div class="inputfield">' + inputElement + '</div>';
    });
  }

  div.innerHTML += '<div id=propswitch><div id=dataprop>Data</div><div id=alertprop>Alerts</div><div id=logsprop>Logs</div></div><div id=proplist><p class=inputlabel>Select database<div class=dropme>Database 1 <img src=assets/dropdown.svg></div><p class=inputlabel>Check properties<div class=dropme>All<img src=assets/dropdown.svg></div><div class=checkus><img src=assets/checkon.svg><p>Log on successful performance</div><div class=checkus><img src=assets/checkoff.svg><p>Give priority to this block</div></div><div id="divisionthing"></div><div id="removeblock">Delete blocks</div>';

  document.getElementById("properties-container").appendChild(div);
}

function showPropertiesDiv(propId) {
    var props = document.querySelectorAll(".properties");
    props.forEach(function(prop) {
        prop.style.display = 'none'; // Verberg alle properties divs
    });
    var activeProp = document.getElementById(propId);
    activeProp.style.display = 'block'; // Toon de relevante properties div
    activeProp.classList.add("expanded");
    document.getElementById("propwrap").classList.add("itson");
}

function closePropertiesDiv() {
    var expandedProps = document.querySelector(".properties.expanded");
    if (expandedProps) {
        expandedProps.classList.remove("expanded");
        expandedProps.style.display = 'none'; // Verberg de div
        document.getElementById("propwrap").classList.remove("itson");
    }
    var selectedBlock = document.querySelector(".block.selectedblock");
    if (selectedBlock) {
        selectedBlock.classList.remove("selectedblock");
    }
}

document.addEventListener("click", function(event) {
    if (event.target.closest("#close")) {
        closePropertiesDiv();
    }
});

var saveButton = document.getElementById("saveButton");
saveButton.addEventListener("click", function(event) {

  var json = JSON.stringify(flowy.output());    // test -> localStorage
  var file = new File([json], "test.json", {type: "application/octet-stream"});
  var blobUrl = (URL || webkitURL).createObjectURL(file);
  window.location = blobUrl;

});

addEventListener("mousedown", beginTouch, false);
addEventListener("mousemove", checkTouch, false);
addEventListener("mouseup", doneTouch, false);
addEventListenerMulti("touchstart", beginTouch, false, ".block");
});
