import React from 'react'
import Block from './Block'
import images from '../images'

function TriggersList(props) {
  return (
    <>
      <Block icon={images.eye} title="New visitor" description="Triggers when somebody visits a specified page" />
      <Block
        icon={images.action}
        title="Action is performed"
        description="Triggers when somebody performs a specified action"
      />
      <Block icon={images.time} title="Time has passed" description="Triggers after a specified amount of time" />
      <Block icon={images.error} title="Error prompt" description="Triggers when a specified error happens" />
    </>
  )
}

export default TriggersList
