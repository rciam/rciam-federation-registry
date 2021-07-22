import React from 'react';
import OverlayTrigger from 'react-bootstrap/OverlayTrigger';
import Button from 'react-bootstrap/Button';
import InputGroup from 'react-bootstrap/InputGroup';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {faCopy} from '@fortawesome/free-solid-svg-icons';
import Tooltip from 'react-bootstrap/Tooltip';

export default function CopyToClipboardComponent(props){
  const copyToClipboard = (e) => {
    var textField = document.createElement('textarea')
     textField.innerText = props.value;
     document.body.appendChild(textField)
     textField.select()
     document.execCommand('copy')
     textField.remove()
     e.target.focus();
  };
  return (

        <InputGroup.Append onClick={copyToClipboard}>
          <OverlayTrigger
            placement='top'
            overlay={
              <Tooltip id={`tooltip-top`}>
                Copy Value to Clipboard
              </Tooltip>
            }
          >
            <Button className='copy-clip-button' variant="outline-secondary"><FontAwesomeIcon icon={faCopy}/></Button>
          </OverlayTrigger>
        </InputGroup.Append>

  )
}
