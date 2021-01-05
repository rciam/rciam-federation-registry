import React from 'react';
import ProgressBar from 'react-bootstrap/ProgressBar';
import Spinner from 'react-bootstrap/Spinner';
import { useTranslation } from 'react-i18next';
export const LoadingBar = (props) => {
  // eslint-disable-next-line
  const { t, i18n } = useTranslation();
  return (
    <React.Fragment>
    {props.loading?
      <div className="loading-container">
        <h1>{t('loading_msg')}</h1>
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
  // eslint-disable-next-line
  const { t, i18n } = useTranslation();
  return (
      <React.Fragment>
      {props.active?
        <div className="loader-container">
          <h3>{t('proccessing_request')}</h3>
          <Spinner animation="border" variant="primary" />
        </div>
      :null}

    </React.Fragment>

  )
}
