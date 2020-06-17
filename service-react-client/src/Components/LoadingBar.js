import React,{useContext} from 'react';
import ProgressBar from 'react-bootstrap/ProgressBar';
import Spinner from 'react-bootstrap/Spinner';
import StringsContext from '../localContext';
export const LoadingBar = (props) => {
  const strings = useContext(StringsContext);
  return (
    <React.Fragment>
    {props.loading?
      <div className="loading-container">
        <h1>{strings.loading_msg}</h1>
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
  const strings = useContext(StringsContext);
  return (
      <React.Fragment>
      {props.active?
        <div className="loader-container">
          <h3>{strings.proccessing_request}</h3>
          <Spinner animation="border" variant="primary" />
        </div>
      :null}

    </React.Fragment>

  )
}
