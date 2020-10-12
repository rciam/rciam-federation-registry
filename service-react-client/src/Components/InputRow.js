import React from 'react';
import Form from 'react-bootstrap/Form';
import Col from 'react-bootstrap/Col';
import Row from 'react-bootstrap/Row';


export default function InputRow(props){
  return (
    <Form.Group as={Row}>
      <Form.Label column="true" sm="2" className='col-form-label text-right list-input-label'>
        {props.title}
      </Form.Label>
      <Col sm="8" className={props.extraClass?props.extraClass:''}>
       {props.children}
      {props.description?
        <Form.Text className="text-muted text-left">
          {props.description}
        </Form.Text>
      :''}
      {props.error && props.touched ? (
            <div className="error-message">{props.error}</div>
          ) : null}
    </Col>
  </Form.Group>
  )


}
