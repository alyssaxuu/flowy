import React, { useState } from 'react'
import BlockList from './BlockList'
import Footer from './Footer'
import images from '../images'

export default function({ open, onToggle }) {
  return (
    <>
      <div id="leftcard" className={open ? 'expanded' : ''}>
        <div id="closecard" onClick={onToggle}>
          <img src={images.closeleft} />
        </div>
        <p id="header">Blocks</p>
        <div id="search">
          <img src={images.search} />
          <input type="text" placeholder="Search blocks" />
        </div>
        <BlockList />
        <Footer />
      </div>
    </>
  )
}
