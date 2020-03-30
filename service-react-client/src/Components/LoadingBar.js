import React from 'react';
import ProgressBar from 'react-bootstrap/ProgressBar';
import Spinner from 'react-bootstrap/Spinner';

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

export const ProcessingRequest = (props) => {
  return (
      <React.Fragment>
      {props.active?
        <div className="loader-container">
          <h3>Proccessing Request  . . .</h3>
          <Spinner animation="border" variant="primary" />
        </div>
      :null}

    </React.Fragment>

  )
}
