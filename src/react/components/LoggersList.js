import React from 'react'
import images from '../images'

function LoggersList(props) {
  return (
    <>
      <div className="blockelem create-flowy noselect">
        <input type="hidden" name="blockelemtype" className="blockelemtype" value="9" />
        <div className="grabme">
          <img src={images.grabme} />
        </div>
        <div className="blockin">
          <div className="blockico">
            <span></span>
            <img src={images.log} />
          </div>
          <div className="blocktext">
            <p className="blocktitle">Add new log entry</p>
            <p className="blockdesc">Adds a new log entry to this project</p>
          </div>
        </div>
      </div>
      <div className="blockelem create-flowy noselect">
        <input type="hidden" name="blockelemtype" className="blockelemtype" value="10" />
        <div className="grabme">
          <img src={images.grabme} />
        </div>
        <div className="blockin">
          <div className="blockico">
            <span></span>
            <img src={images.log} />
          </div>
          <div className="blocktext">
            <p className="blocktitle">Update logs</p>
            <p className="blockdesc">Edits and deletes log entries in this project</p>
          </div>
        </div>
      </div>
      <div className="blockelem create-flowy noselect">
        <input type="hidden" name="blockelemtype" className="blockelemtype" value="11" />
        <div className="grabme">
          <img src={images.grabme} />
        </div>
        <div className="blockin">
          <div className="blockico">
            <span></span>
            <img src={images.error} />
          </div>
          <div className="blocktext">
            <p className="blocktitle">Prompt an error</p>
            <p className="blockdesc">Triggers a specified error</p>
          </div>
        </div>
      </div>
    </>
  )
}

export default LoggersList
