import React from 'react'
import Block from './Block'
import images from '../images'

function ActionsList(props) {
  return (
    <>
      <Block icon={images.database} title="New database entry" description="Adds a new entry to a specified database" />
      <Block
        icon={images.database}
        title="Update database"
        description="Edits and deletes database entries and properties"
      />
      <Block icon={images.action} title="Perform an action" description="Performs or edits a specified action" />
      <Block icon={images.twitter} title="Make a tweet" description="Makes a tweet with a specified query" />
    </>
  )
}

export default ActionsList
