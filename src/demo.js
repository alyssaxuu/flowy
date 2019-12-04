/* global $ */

import flowy from './flowy'
import './demo.css'
import './flowy.css'

// this just sets up path-conversion for parcel
import pngs from './assets/*.png'
import svgs from './assets/*.svg'
const images = { ...pngs, ...svgs }

// all HTML templates go here
const templates = {}
templates.blocklist = `
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

templates.blocks = [
  `<div class="blockyleft">
    <img src="${images.eyeblue}">
    <p class="blockyname">New visitor</p>
  </div>
  <div class="blockyright"><img src="${images.more}"></div>
  <div class="blockydiv"></div>
  <div class="blockyinfo">When a <span>new visitor</span> goes to <span>Site 1</span></div>`,

  `<div class="blockyleft">
    <img src="${images.actionblue}">
    <p class="blockyname">Action is performed</p>
  </div>
  <div class="blockyright"><img src="${images.more}"></div>
  <div class="blockydiv"></div>
  <div class="blockyinfo">When <span>Action 1</span> is performed</div>`,

  `<div class="blockyleft">
    <img src="${images.timeblue}">
    <p class="blockyname">Time has passed</p>
  </div>
  <div class="blockyright"><img src="${images.more}"></div>
  <div class="blockydiv"></div>
  <div class="blockyinfo">When <span>10 seconds</span> have passed</div>`,

  `<div class="blockyleft">
    <img src="${images.errorblue}">
    <p class="blockyname">Error prompt</p>
  </div>
  <div class="blockyright"><img src="${images.more}"></div>
  <div class="blockydiv"></div>
  <div class="blockyinfo">When <span>Error 1</span> is triggered</div>`,

  `<div class="blockyleft">
    <img src="${images.databaseorange}">
    <p class="blockyname">New database entry</p>
  </div>
  <div class="blockyright"><img src="${images.more}"></div>
  <div class="blockydiv"></div>
  <div class="blockyinfo">Add <span>Data object</span> to <span>Database 1</span></div>`,

  `<div class="blockyleft">
    <img src="${images.databaseorange}">
    <p class="blockyname">Update database</p>
  </div>
  <div class="blockyright"><img src="${images.more}"></div>
  <div class="blockydiv"></div>
  <div class="blockyinfo">Update <span>Database 1</span></div>`,

  `<div class="blockyleft">
    <img src="${images.actionorange}">
    <p class="blockyname">Perform an action</p>
  </div>
  <div class="blockyright"><img src="${images.more}"></div>
  <div class="blockydiv"></div>
  <div class="blockyinfo">Perform <span>Action 1</span></div>`,

  `<div class="blockyleft">
    <img src="${images.twitterorange}">
    <p class="blockyname">Make a tweet</p>
  </div>
  <div class="blockyright"><img src="${images.more}"></div>
  <div class="blockydiv"></div>
  <div class="blockyinfo">Tweet <span>Query 1</span> with the account <span>@alyssaxuu</span></div>`,

  `<div class="blockyleft">
    <img src="${images.logred}">
    <p class="blockyname">Add new log entry</p>
  </div>
  <div class="blockyright"><img src="${images.more}"></div>
  <div class="blockydiv"></div>
  <div class="blockyinfo">Add new <span>success</span> log entry</div>`,

  `<div class="blockyleft">
    <img src="${images.logred}">
    <p class="blockyname">Update logs</p>
  </div>
  <div class="blockyright"><img src="${images.more}"></div>
  <div class="blockydiv"></div>
  <div class="blockyinfo">Edit <span>Log Entry 1</span></div>`,

  `<div class="blockyleft">
    <img src="${images.errorred}">
    <p class="blockyname">Prompt an error</p>
  </div>
  <div class="blockyright"><img src="${images.more}"></div>
  <div class="blockydiv"></div>
  <div class="blockyinfo">Trigger <span>Error 1</span></div>`
]

templates.blocklists = {
  triggers: `<div class="blockelem create-flowy noselect">
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
</div>`,

  actions: `<div class="blockelem create-flowy noselect">
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
</div>`,

  loggers: `<div class="blockelem create-flowy noselect">
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
</div>`
}

$(document).ready(function () {
  var rightcard = false
  var tempblock
  var tempblock2
  $('#blocklist').html(templates.blocklist)
  flowy($('#canvas'), drag, release, snapping)
  function snapping (drag, first) {
    drag.children('.grabme').remove()
    drag.children('.blockin').remove()
    drag.append(templates.blocks[parseInt(drag.children('.blockelemtype').val()) - 1])
  }
  function drag (block) {
    block.addClass('blockdisabled')
    tempblock2 = block
  }
  function release () {
    tempblock2.removeClass('blockdisabled')
  }
  $(document).on('click', '.navdisabled', function () {
    $('.navactive').addClass('navdisabled')
    $('.navactive').removeClass('navactive')
    $(this).addClass('navactive')
    $(this).removeClass('navdisabled')
    $('#blocklist').html(templates.blocklists[$(this).attr('id')])
  })
  $('#close').click(function () {
    if (rightcard) {
      rightcard = false
      $('#properties').removeClass('expanded')
      setTimeout(function () {
        $('#propwrap').removeClass('itson')
      }, 300)
      tempblock.removeClass('selectedblock')
    }
  })
  $('#removeblock').on('click', function () {
    flowy.deleteBlocks()
  })
  $(document).on('mousedown', '.block', function (event) {
    $(document).on('mouseup mousemove', '.block', function handler (event) {
      if (event.type === 'mouseup') {
        if (!rightcard) {
          tempblock = $(this)
          rightcard = true
          $('#properties').addClass('expanded')
          $('#propwrap').addClass('itson')
          tempblock.addClass('selectedblock')
        }
      }
      $(document).off('mouseup mousemove', handler)
    })
  })
})
