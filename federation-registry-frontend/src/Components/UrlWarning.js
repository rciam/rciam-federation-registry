import React, { useState, useEffect } from 'react';
import { faExclamationTriangle } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { reg } from '../regex';

var urlCheckTimeout;
var urlCheckTimeoutResponse;

/**
 * URL Warning component - displays a warning when a URL doesn't seem to exist.
 */
export const UrlWarning = (props) => {
  const [active, setActive] = useState(!!props.overwriteWarning);

  useEffect(() => {
    if (!props.overwriteWarning) {
      setActive(false);
      clearTimeout(urlCheckTimeout);
      if (props.touched && props.url && reg.regSimpleUrl.test(props.url)) {
        const exists = async (url) => {
          const result = await fetch(url, {
            method: 'HEAD',
            mode: 'no-cors'
          });
          return result.ok;
        };
        urlCheckTimeout = setTimeout(() => {
          urlCheckTimeoutResponse = setTimeout(() => {
            setActive(true);
            clearTimeout(urlCheckTimeout);
          }, 3000);
          exists(props.url)
            .then((result) => {
              clearTimeout(urlCheckTimeoutResponse);
              setActive(false);
            })
            .catch((err) => {
              clearTimeout(urlCheckTimeoutResponse);
              setActive(true);
            });
        }, 1000);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [props.url, props.touched]);

  return (
    <React.Fragment>
      {(active && !props.disableCheck) || props.overwriteWarning ? (
        <div className="pkce-tooltip">
          <FontAwesomeIcon icon={faExclamationTriangle} />
          {props.overwriteWarning
            ? props.overwriteWarning
            : "The provided url does not seem to exist"}
        </div>
      ) : null}
    </React.Fragment>
  );
};

export default UrlWarning;
