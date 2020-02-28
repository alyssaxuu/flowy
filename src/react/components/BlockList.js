import React, { useState } from 'react'
import TriggersList from './TriggersList'
import ActionsList from './ActionsList'
import LoggersList from './LoggersList'

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

export default function(props) {
  const [activeTab, setActiveTab] = useState('triggers')

  return (
    <>
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
    </>
  )
}
