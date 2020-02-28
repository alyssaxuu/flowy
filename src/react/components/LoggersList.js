import React from 'react'
import Block from './Block'
import images from '../images'

function LoggersList(props) {
  return (
    <>
      <Block icon={images.log} title="Add new log entry" description="Adds a new log entry to this project" />
      <Block icon={images.log} title="Update logs" description="Edits and deletes log entries in this project" />
      <Block icon={images.error} title="Prompt an error" description="Triggers a specified error" />
    </>
  )
}

export default LoggersList
