import React from 'react'

import pngs from '../assets/*.png'
import svgs from '../assets/*.svg'
const images = { ...pngs, ...svgs }

function ActionsList(props) {
  return (
    <>
      <div className="blockelem create-flowy noselect">
        <input type="hidden" name="blockelemtype" className="blockelemtype" value="5" />
        <div className="grabme">
          <img src={images.grabme} />
        </div>
        <div className="blockin">
          <div className="blockico">
            <span></span>
            <img src={images.database} />
          </div>
          <div className="blocktext">
            <p className="blocktitle">New database entry</p>
            <p className="blockdesc">Adds a new entry to a specified database</p>
          </div>
        </div>
      </div>
      <div className="blockelem create-flowy noselect">
        <input type="hidden" name="blockelemtype" className="blockelemtype" value="6" />
        <div className="grabme">
          <img src={images.grabme} />
        </div>
        <div className="blockin">
          <div className="blockico">
            <span></span>
            <img src={images.database} />
          </div>
          <div className="blocktext">
            <p className="blocktitle">Update database</p>
            <p className="blockdesc">Edits and deletes database entries and properties</p>
          </div>
        </div>
      </div>
      <div className="blockelem create-flowy noselect">
        <input type="hidden" name="blockelemtype" className="blockelemtype" value="7" />
        <div className="grabme">
          <img src={images.grabme} />
        </div>
        <div className="blockin">
          <div className="blockico">
            <span></span>
            <img src={images.action} />
          </div>
          <div className="blocktext">
            <p className="blocktitle">Perform an action</p>
            <p className="blockdesc">Performs or edits a specified action</p>
          </div>
        </div>
      </div>
      <div className="blockelem create-flowy noselect">
        <input type="hidden" name="blockelemtype" className="blockelemtype" value="8" />
        <div className="grabme">
          <img src={images.grabme} />
        </div>
        <div className="blockin">
          <div className="blockico">
            <span></span>
            <img src={images.twitter} />
          </div>
          <div className="blocktext">
            <p className="blocktitle">Make a tweet</p>
            <p className="blockdesc">Makes a tweet with a specified query</p>
          </div>
        </div>
      </div>
    </>
  )
}

export default ActionsList
