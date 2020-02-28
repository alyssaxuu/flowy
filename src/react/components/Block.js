import React from 'react'
import images from '../images'

export default function({ icon, title, description }) {
  return (
    <>
      <div className="blockelem create-flowy noselect">
        <input type="hidden" name="blockelemtype" className="blockelemtype" value="1" />
        <div className="grabme">
          <img src={images.grabme} />
        </div>
        <div className="blockin">
          <div className="blockico">
            <span></span>
            <img src={icon} />
          </div>
          <div className="blocktext">
            <p className="blocktitle">{title}</p>
            <p className="blockdesc">{description}</p>
          </div>
        </div>
      </div>
    </>
  )
}
