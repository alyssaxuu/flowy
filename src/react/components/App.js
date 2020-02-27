import React, { useState } from 'react'
import TriggersList from './TriggersList'
import ActionsList from './ActionsList'
import LoggersList from './LoggersList'

import pngs from '../assets/*.png'
import svgs from '../assets/*.svg'
const images = { ...pngs, ...svgs }

const TABS = {
  triggers: {
    name: 'Triggers',
    Component: TriggersList
  },
  actions: {
    name: 'Actions',
    Component: ActionsList
  },
  loggers: {
    name: 'Loggers',
    Component: LoggersList
  }
}

function App(props) {
  const [activeTab, setActiveTab] = useState('triggers')

  return (
    <>
      <div id="navigation">
        <div id="leftside">
          <div id="details">
            <div id="back">
              <img src={images.arrow} />
            </div>
            <div id="names">
              <p id="title">Your automation pipeline</p>
              <p id="subtitle">Marketing automation</p>
            </div>
          </div>
        </div>
        <div id="centerswitch">
          <div id="leftswitch">Diagram view</div>
          <div id="rightswitch">Code editor</div>
        </div>
        <div id="buttonsright">
          <div id="discard">Discard</div>
          <div id="publish">Publish to site</div>
        </div>
      </div>
      <div id="leftcard">
        <div id="closecard">
          <img src={images.closeleft} />
        </div>
        <p id="header">Blocks</p>
        <div id="search">
          <img src={images.search} />
          <input type="text" placeholder="Search blocks" />
        </div>
        <div id="subnav">
          {Object.entries(TABS).map(([key, { name }]) => (
            <div
              key={key}
              id={key}
              className={`${activeTab === key ? 'navactive' : 'navdisabled'} side`}
              onClick={() => setActiveTab(key)}
            >
              {name}
            </div>
          ))}
        </div>
        <div id="blocklist">{React.createElement(TABS[activeTab].Component)}</div>

        <div id="footer">
          <a href="https://github.com/alyssaxuu/flowy/" target="_blank">
            GitHub
          </a>
          <span>·</span>
          <a href="https://twitter.com/alyssaxuu/status/1199724989353730048" target="_blank">
            Twitter
          </a>
          <span>·</span>
          <a href="https://alyssax.com" target="_blank">
            <p>Made with</p>
            <img src={images.heart} />
            <p>by</p>
            Alyssa X
          </a>
        </div>
      </div>
      <div id="propwrap">
        <div id="properties">
          <div id="close">
            <img src={images.close} />
          </div>
          <p id="header2">Properties</p>
          <div id="propswitch">
            <div id="dataprop">Data</div>
            <div id="alertprop">Alerts</div>
            <div id="logsprop">Logs</div>
          </div>
          <div id="proplist">
            <p className="inputlabel">Select database</p>
            <div className="dropme">
              Database 1 <img src={images.dropdown} />
            </div>
            <p className="inputlabel">Check properties</p>
            <div className="dropme">
              All
              <img src={images.dropdown} />
            </div>
            <div className="checkus">
              <img src={images.checkon} />
              <p>Log on successful performance</p>
            </div>
            <div className="checkus">
              <img src={images.checkoff} />
              <p>Give priority to this block</p>
            </div>
          </div>
          <div id="divisionthing"></div>
          <div id="removeblock">Delete blocks</div>
        </div>
      </div>
      <div id="canvas"></div>
    </>
  )
}

export default App
