import React from 'react';
import Form from 'react-bootstrap/Form';
import Col from 'react-bootstrap/Col';
import Row from 'react-bootstrap/Row';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {faQuestionCircle} from '@fortawesome/free-solid-svg-icons';
import OverlayTrigger from 'react-bootstrap/OverlayTrigger';
import Tooltip from 'react-bootstrap/Tooltip';
import parse from 'html-react-parser';

export default function InputRow(props){
  return (
    <React.Fragment>
      {props.hide?null:
        <Form.Group as={Row}>
          <Form.Label column="true" sm="2" className='col-form-label text-right list-input-label'>
            <Row className="input-title-row">
              <Col>{props.title}</Col>
              {props.moreInfo&&props.moreInfo.tooltip?
              <OverlayTrigger
              placement='top'
              overlay={
                <Tooltip id={`tooltip-top`}>
                  {props.moreInfo.tooltip}
                </Tooltip>
              }
            >
              <Col md="auto" className='more_info_field'>
                <FontAwesomeIcon icon={faQuestionCircle} /> 
              </Col>
            </OverlayTrigger>
              :null}
            </Row>
          </Form.Label>
          {props.required?<span className="required_indicator">*</span>:null}
          <Col sm="8" className={props.extraClass?props.extraClass:''}>
          {props.children}
          {props.description||(props.moreInfo&&props.moreInfo.description)?
            <Form.Text className="text-muted text-left">
              {parse(props.moreInfo&&props.moreInfo.description?props.moreInfo.description:props.description)}
            </Form.Text>
            :''}
            {props.error && props.touched ? (
              <div className="error-message">{props.error.split('\n').map((str,index) => <p key={index}>{str}</p>)}</div>
            ) : null}
          </Col>
          </Form.Group>
      }
  </React.Fragment>
  )


}
