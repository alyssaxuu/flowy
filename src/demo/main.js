import flowy from '..'
import '../engine/index.css'
import './main.css'

// for Parcel
import pngs from './assets/*.png'
import svgs from './assets/*.svg'
const images = { ...pngs, ...svgs }

document.addEventListener('DOMContentLoaded', function() {
  var rightcard = false
  var tempblock
  var tempblock2

  document.getElementById('blocklist').innerHTML = `
      <div class="blockelem create-flowy noselect">
        <input type="hidden" name="blockelemtype" class="blockelemtype" value="1">
        <div class="grabme"><img src="${images.grabme}"></div>
        <div class="blockin">
          <div class="blockico"><span></span><img src="${images.eye}"></div>
          <div class="blocktext">
            <p class="blocktitle">New visitor</p>
            <p class="blockdesc">Triggers when somebody visits a specified page</p>
          </div>
        </div>
      </div>
      <div class="blockelem create-flowy noselect">
        <input type="hidden" name="blockelemtype" class="blockelemtype" value="2">
        <div class="grabme"><img src="${images.grabme}"></div>
        <div class="blockin">
          <div class="blockico"><span></span><img src="${images.action}"></div>
          <div class="blocktext">
            <p class="blocktitle">Action is performed</p>
            <p class="blockdesc">Triggers when somebody performs a specified action</p>
          </div>
        </div>
      </div>
      <div class="blockelem create-flowy noselect">
        <input type="hidden" name="blockelemtype" class="blockelemtype" value="3">
        <div class="grabme"><img src="${images.grabme}"></div>
        <div class="blockin">
          <div class="blockico"><span></span><img src="${images.time}"></div>
          <div class="blocktext">
            <p class="blocktitle">Time has passed</p>
            <p class="blockdesc">Triggers after a specified amount of time</p>
          </div>
        </div>
      </div>
      <div class="blockelem create-flowy noselect">
        <input type="hidden" name="blockelemtype" class="blockelemtype" value="4">
        <div class="grabme"><img src="${images.grabme}"></div>
        <div class="blockin">
          <div class="blockico"><span></span><img src="${images.error}"></div>
          <div class="blocktext">
            <p class="blocktitle">Error prompt</p>
            <p class="blockdesc">Triggers when a specified error happens</p>
          </div>
        </div>
      </div>
    `

  flowy(document.getElementById('canvas'), drag, release, snapping)

  function addEventListenerMulti(type, listener, capture, selector) {
    var nodes = document.querySelectorAll(selector)

    nodes.forEach(node => node.addEventListener(type, listener, capture))
  }

  function snapping(drag, first) {
    var grab = drag.querySelector('.grabme')
    grab.remove()
    var blockin = drag.querySelector('.blockin')
    blockin.remove()
    var blockelemtype = parseInt(drag.querySelector('.blockelemtype').value)

    switch (blockelemtype) {
      case 1:
        drag.innerHTML += `
          <div class='blockyleft'>
            <img src='${images.eyeblue}'>
            <p class='blockyname'>New visitor</p>
          </div>
          <div class='blockyright'><img src='${images.more}'></div>
          <div class='blockydiv'></div>
          <div class='blockyinfo'>When a <span>new visitor</span> goes to <span>Site 1</span></div>
        `
        break
      case 2:
        drag.innerHTML += `
          <div class='blockyleft'>
            <img src='${images.actionblue}'>
            <p class='blockyname'>Action is performed</p>
          </div>
          <div class='blockyright'><img src='${images.more}'></div>
          <div class='blockydiv'></div>
          <div class='blockyinfo'>When <span>Action 1</span> is performed</div>
        `
        break
      case 3:
        drag.innerHTML += `
          <div class='blockyleft'>
            <img src='${images.timeblue}'>
            <p class='blockyname'>Time has passed</p>
          </div>
          <div class='blockyright'><img src='${images.more}'></div>
          <div class='blockydiv'></div>
          <div class='blockyinfo'>When <span>10 seconds</span> have passed</div>
        `
        break
      case 4:
        drag.innerHTML += `
          <div class='blockyleft'>
            <img src='${images.errorblue}'>
            <p class='blockyname'>Error prompt</p>
          </div>
          <div class='blockyright'><img src='${images.more}'></div>
          <div class='blockydiv'></div>
          <div class='blockyinfo'>When <span>Error 1</span> is triggered</div>
        `
        break
      case 5:
        drag.innerHTML += `
          <div class='blockyleft'>
            <img src='${images.databaseorange}'>
            <p class='blockyname'>New database entry</p>
          </div>
          <div class='blockyright'><img src='${images.more}'></div>
          <div class='blockydiv'></div>
          <div class='blockyinfo'>Add <span>Data object</span> to <span>Database 1</span></div>
        `
        break
      case 6:
        drag.innerHTML += `
          <div class='blockyleft'>
            <img src='${images.databaseorange}'>
            <p class='blockyname'>Update database</p>
          </div>
          <div class='blockyright'><img src='${images.more}'></div>
          <div class='blockydiv'></div>
          <div class='blockyinfo'>Update <span>Database 1</span></div>
        `
        break
      case 7:
        drag.innerHTML += `
          <div class='blockyleft'>
            <img src='${images.actionorange}'>
            <p class='blockyname'>Perform an action</p>
          </div>
          <div class='blockyright'><img src='${images.more}'></div>
          <div class='blockydiv'></div><div class='blockyinfo'>Perform <span>Action 1</span></div>
        `
        break
      case 8:
        drag.innerHTML += `
          <div class='blockyleft'>
            <img src='${images.twitterorange}'>
            <p class='blockyname'>Make a tweet</p>
          </div>
          <div class='blockyright'><img src='${images.more}'></div>
          <div class='blockydiv'></div>
          <div class='blockyinfo'>Tweet <span>Query 1</span> with the account <span>@alyssaxuu</span></div>
        `
        break
      case 9:
        drag.innerHTML += `
          <div class='blockyleft'>
            <img src='${images.logred}'>
            <p class='blockyname'>Add new log entry</p>
          </div>
          <div class='blockyright'><img src='${images.more}'></div>
          <div class='blockydiv'></div>
          <div class='blockyinfo'>Add new <span>success</span> log entry</div>
        `
        break
      case 10:
        drag.innerHTML += `
          <div class='blockyleft'>
            <img src='${images.logred}'>
            <p class='blockyname'>Update logs</p>
          </div>
          <div class='blockyright'><img src='${images.more}'></div>
          <div class='blockydiv'></div>
          <div class='blockyinfo'>Edit <span>Log Entry 1</span></div>
        `
        break
      case 11:
        drag.innerHTML += `
          <div class='blockyleft'>
            <img src='${images.errorred}'>
            <p class='blockyname'>Prompt an error</p>
          </div>
          <div class='blockyright'><img src='${images.more}'></div>
          <div class='blockydiv'></div>
          <div class='blockyinfo'>Trigger <span>Error 1</span></div>
        `
        break
    }

    return true
  }

  function drag(block) {
    block.classList.add('blockdisabled')
    tempblock2 = block
  }

  function release() {
    tempblock2.classList.remove('blockdisabled')
  }

  var disabledClick = function() {
    document.querySelector('.navactive').classList.add('navdisabled')
    document.querySelector('.navactive').classList.remove('navactive')

    this.classList.add('navactive')
    this.classList.remove('navdisabled')

    switch (this.getAttribute('id')) {
      case 'triggers':
        document.getElementById('blocklist').innerHTML = `
          <div class="blockelem create-flowy noselect">
            <input type="hidden" name="blockelemtype" class="blockelemtype" value="1">
            <div class="grabme"><img src="${images.grabme}"></div>
            <div class="blockin">
              <div class="blockico"><span></span><img src="${images.eye}"></div>
              <div class="blocktext">
                <p class="blocktitle">New visitor</p>
                <p class="blockdesc">Triggers when somebody visits a specified page</p>
              </div>
            </div>
          </div>
          <div class="blockelem create-flowy noselect">
            <input type="hidden" name="blockelemtype" class="blockelemtype" value="2">
            <div class="grabme"><img src="${images.grabme}"></div>
            <div class="blockin">
              <div class="blockico"><span></span><img src="${images.action}"></div>
              <div class="blocktext">
                <p class="blocktitle">Action is performed</p>
                <p class="blockdesc">Triggers when somebody performs a specified action</p>
              </div>
            </div>
          </div>
          <div class="blockelem create-flowy noselect">
            <input type="hidden" name="blockelemtype" class="blockelemtype" value="3">
            <div class="grabme"><img src="${images.grabme}"></div>
            <div class="blockin">
              <div class="blockico"><span></span><img src="${images.time}"></div>
              <div class="blocktext">
                <p class="blocktitle">Time has passed</p>
                <p class="blockdesc">Triggers after a specified amount of time</p>
              </div>
            </div>
          </div>
          <div class="blockelem create-flowy noselect">
            <input type="hidden" name="blockelemtype" class="blockelemtype" value="4">
            <div class="grabme"><img src="${images.grabme}"></div>
            <div class="blockin">
              <div class="blockico"><span></span><img src="${images.error}"></div>
              <div class="blocktext">
                <p class="blocktitle">Error prompt</p>
                <p class="blockdesc">Triggers when a specified error happens</p>
              </div>
            </div>
          </div>
        `
        break
      case 'actions':
        document.getElementById('blocklist').innerHTML = `
        <div class="blockelem create-flowy noselect">
          <input type="hidden" name="blockelemtype" class="blockelemtype" value="5">
          <div class="grabme"><img src="${images.grabme}"></div>
          <div class="blockin">
            <div class="blockico"><span></span><img src="${images.database}"></div>
            <div class="blocktext">
              <p class="blocktitle">New database entry</p>
              <p class="blockdesc">Adds a new entry to a specified database</p>
            </div>
          </div>
        </div>
        <div class="blockelem create-flowy noselect">
          <input type="hidden" name="blockelemtype" class="blockelemtype" value="6">
          <div class="grabme"><img src="${images.grabme}"></div>
          <div class="blockin">
            <div class="blockico"><span></span><img src="${images.database}"></div>
            <div class="blocktext">
              <p class="blocktitle">Update database</p>
              <p class="blockdesc">Edits and deletes database entries and properties</p>
            </div>
          </div>
        </div>
        <div class="blockelem create-flowy noselect">
          <input type="hidden" name="blockelemtype" class="blockelemtype" value="7">
          <div class="grabme"><img src="${images.grabme}"></div>
          <div class="blockin">
            <div class="blockico"><span></span><img src="${images.action}"></div>
            <div class="blocktext">
              <p class="blocktitle">Perform an action</p>
              <p class="blockdesc">Performs or edits a specified action</p>
            </div>
          </div>
        </div>
        <div class="blockelem create-flowy noselect">
          <input type="hidden" name="blockelemtype" class="blockelemtype" value="8">
          <div class="grabme"><img src="${images.grabme}"></div>
          <div class="blockin">
            <div class="blockico"><span></span><img src="${images.twitter}"></div>
            <div class="blocktext">
              <p class="blocktitle">Make a tweet</p>
              <p class="blockdesc">Makes a tweet with a specified query</p>
            </div>
          </div>
        </div>
      `
        break
      case 'loggers':
        document.getElementById('blocklist').innerHTML = `
          <div class="blockelem create-flowy noselect">
            <input type="hidden" name="blockelemtype" class="blockelemtype" value="9">
            <div class="grabme"><img src="${images.grabme}"></div>
            <div class="blockin">
              <div class="blockico"><span></span><img src="${images.log}"></div>
              <div class="blocktext">
                <p class="blocktitle">Add new log entry</p>
                <p class="blockdesc">Adds a new log entry to this project</p>
              </div>
            </div>
          </div>
          <div class="blockelem create-flowy noselect">
            <input type="hidden" name="blockelemtype" class="blockelemtype" value="10">
            <div class="grabme"><img src="${images.grabme}"></div>
            <div class="blockin">
              <div class="blockico"><span></span><img src="${images.log}"></div>
              <div class="blocktext">
                <p class="blocktitle">Update logs</p>
                <p class="blockdesc">Edits and deletes log entries in this project</p>
              </div>
            </div>
          </div>
          <div class="blockelem create-flowy noselect">
            <input type="hidden" name="blockelemtype" class="blockelemtype" value="11">
            <div class="grabme"><img src="${images.grabme}"></div>
            <div class="blockin">
              <div class="blockico"><span></span><img src="${images.error}"></div>
              <div class="blocktext">
                <p class="blocktitle">Prompt an error</p>
                <p class="blockdesc">Triggers a specified error</p>
              </div>
            </div>
          </div>
        `
        break
    }
  }

  addEventListenerMulti('click', disabledClick, false, '.side')

  document.getElementById('close').addEventListener('click', function() {
    if (rightcard) {
      rightcard = false
      document.getElementById('properties').classList.remove('expanded')
      setTimeout(function() {
        document.getElementById('propwrap').classList.remove('itson')
      }, 300)
      tempblock.classList.remove('selectedblock')
    }
  })

  document.getElementById('removeblock').addEventListener('click', function() {
    flowy.deleteBlocks()
  })

  var aclick = false

  var beginTouch = function() {
    aclick = true
  }

  var checkTouch = function() {
    aclick = false
  }

  var doneTouch = function(event) {
    if (event.type !== 'mouseup' || !aclick) {
      return
    }
    if (rightcard || !event.target.closest('.block')) {
      return
    }

    tempblock = event.target.closest('.block')
    rightcard = true
    document.getElementById('properties').classList.add('expanded')
    document.getElementById('propwrap').classList.add('itson')
    tempblock.classList.add('selectedblock')
  }

  addEventListener('mousedown', beginTouch, false)
  addEventListener('mousemove', checkTouch, false)
  addEventListener('mouseup', doneTouch, false)
  addEventListenerMulti('touchstart', beginTouch, false, '.block')
})
