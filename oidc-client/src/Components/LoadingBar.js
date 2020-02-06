import React from 'react';
import ProgressBar from 'react-bootstrap/ProgressBar';

export const LoadingBar = (props) => {

  return (
    <React.Fragment>
    {props.loading?
      <div className="loading-container">
        <h1>Loading...</h1>
        <div className="progress-bar-container">
          <ProgressBar animated now={100} />
        </div>
      </div>
      :
      <React.Fragment>
        <div>
        {props.children}
        </div>
      </React.Fragment>
    }
      </React.Fragment>
  )
}
