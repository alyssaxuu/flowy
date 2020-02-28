import React, { useState, useEffect, useCallback } from 'react'
import flowy from '../..'
import Navigation from './Navigation'
import LeftCard from './LeftCard'
import RightCard from './RightCard'
import images from '../images'
import useEventListener from './hooks/useEventListener'

import '../../engine/index.css'
import '../main.css'

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

// See: https://engineering.datorama.com/mastering-drag-drop-using-reactjs-hooks-fb58dc1f816f
function App(props) {
  const [aclick, setAClick] = useState(false)
  const [leftcard, setLeftCard] = useState(true)
  const [rightcard, setRightCard] = useState(false)
  const [tempblock, setTempBlock] = useState(null)
  const [tempblock2, setTempBlock2] = useState(null)

  const beginTouch = () => setAClick(() => true)
  const checkTouch = () => setAClick(() => false)
  const doneTouch = ({ target, type }) => {
    const block = target.closest('.block')

    if (type !== 'mouseup' || !aclick || rightcard || !block) {
      return
    }

    setTempBlock(() => block)
    setRightCard(() => true)

    block.classList.add('selectedblock')
  }

  const drag = block => {
    block.classList.add('blockdisabled')
    setTempBlock2(() => block)
  }

  const release = useCallback(() => {
    tempblock2.classList.remove('blockdisabled')
  }, [tempblock2])

  useEffect(() => {
    flowy(document.getElementById('canvas'), drag, release, snapping)
  }, [drag, release, snapping])

  useEventListener('mousedown', beginTouch)
  useEventListener('mousemove', checkTouch)
  useEventListener('mouseup', doneTouch)

  useEffect(() => {
    addEventListenerMulti('touchstart', beginTouch, false, '.block')
  }, [beginTouch])

  return (
    <>
      <Navigation title="Your automation pipeline" description="Marketing automation" />
      <LeftCard open={leftcard} onClose={() => setLeftCard(false)} />
      <RightCard
        open={rightcard}
        onClose={() => {
          setRightCard(false)

          setTimeout(function() {
            // TODO: Somehow delay "propwrap" style change
          }, 300)
          tempblock.classList.remove('selectedblock')
        }}
      />
      <div id="canvas"></div>
    </>
  )
}

export default App
