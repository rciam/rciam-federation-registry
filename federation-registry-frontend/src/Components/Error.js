import React,{useState,useContext} from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {faSortDown,faSortUp} from '@fortawesome/free-solid-svg-icons';
import * as config from '../config.json';
import ButtonGroup from 'react-bootstrap/ButtonGroup';
import Alert from 'react-bootstrap/Alert';
import Row from 'react-bootstrap/Row';
import Col from 'react-bootstrap/Col';
import Collapse from 'react-bootstrap/Collapse';
import Form from 'react-bootstrap/Form';
import 'bootstrap/dist/css/bootstrap.min.css';
import Button from 'react-bootstrap/Button';
//import { useTranslation } from 'react-i18next';
import {useParams } from "react-router-dom";
import {tenantContext} from '../context.js';

const ErrorComponent = (props) => {
  const [action,setAction] = useState();
  const [expand,setExpand] = useState(false);
  // eslint-disable-next-line
  const [tenant,setTeanant] = useContext(tenantContext);
  const [loading,setLoading] = useState(false);

  const [response,setResponse] = useState(false);
  //const { t, i18n } = useTranslation();
  let {tenant_name} = useParams();
  const [error,setError] = useState();
  const resendDeployment = () => {
    setLoading(true);
    fetch(config.host+'tenants/'+tenant_name+'/services/'+props.service_id +'/error?action=resend', {
      method: 'PUT', // *GET, POST, PUT, DELETE, etc.
      credentials: 'include', // include, *same-origin, omit
      headers: {
      'Content-Type': 'application/json',
      'Authorization': localStorage.getItem('token')
      }
    }).then(res=> {

      if(res.status===200){
        setResponse('success')
        props.setDeploymentError();

      }else if(res.status===401){
        setResponse('failed');
        props.setLogout(true);
      }
      else{
        setResponse('failed');
      }
      setLoading(false);
    });

  }

  const buttonAction = () =>{

      if(expand){
        if(action){
          if(action==='resend'){
            resendDeployment();
          }
          console.log("Take action: " + action);
        }
        else {
          setError('Select action to take');
        }
      }else{
        setError(false);
        setExpand(true);
      }
  }

  return (
    <React.Fragment >
    {props.deploymentError?
      <React.Fragment>
        <Alert show={true} variant="danger" style={{marginTop:'1rem'}}>
          <Alert.Heading><b>Deployment Error: {props.deploymentError.error_code}</b></Alert.Heading>
          <p style={{marginTop:'1rem'}}>
            <b>Error Description: </b>{props.deploymentError.error_description}
            <br style={{marginBottom:'0.3rem'}}/>
            <b>Date</b>: {props.deploymentError.error_date.slice(0,10)} {props.deploymentError.error_date.slice(11,20)}
          </p>

          <hr/>
          <Alert show={true} variant="light" style={{color:tenant.color}} className={expand?"error-action-alert":"error-action-alert-hidden"}>
          <div className="d-flex justify-content-end">
          {error&&expand?
            <div className="review-error" style={{marginRight:'0.5rem',color:'#721c24'}}>
              <b>{error}</b>
            </div>
            :null}

          <ButtonGroup>
            <Button className="review-button" variant="secondary" onClick={()=> buttonAction()}>{expand?'Submit Action':
              <React.Fragment>
                Take Action
                <FontAwesomeIcon icon={faSortDown}/>
              </React.Fragment>
              }</Button>
              {expand?
                <Button variant="secondary" style={{padding:'0.4rem'}} className="review-button-expand" onClick={()=>setExpand(!expand)}>
                  <FontAwesomeIcon style={{marginTop:'0.5rem'}} icon={faSortUp}/>
                </Button>:null}

          </ButtonGroup>
          {loading?<div className="error-loader"></div>:null}
          </div>
          <Collapse in={expand}>
            <Form.Group>
              <Row>
                <Col md="auto" className="review-radio-col">
                  <Form.Check
                    type="radio"
                    name="formHorizontalRadios"
                    id="formHorizontalRadios1"
                    onChange={(e)=>{if(e.target.checked){setAction(e.target.value)}}}
                    value="resend"
                    checked={action==='resend'}
                  />
                </Col>
                <Col onClick={()=>{
                  setAction('resend');
                }}>
                  <Row>
                    <strong>
                      Retry Deployment
                    </strong>
                  </Row>
                  <Row className="review-option-desc">
                    Resend deployment configuration
                  </Row>
                </Col>
              </Row>
              <Row>
                <Col md="auto" className="review-radio-col">
                  <Form.Check
                    disabled={true}
                    type="radio"
                    name="formHorizontalRadios"
                    id="formHorizontalRadios2"
                    onChange={(e)=>{if(e.target.checked){setAction(e.target.value)}}}
                    value="revert"
                    checked={action==='revert'}
                  />
                </Col>
                <Col onClick={()=>{
                    //setAction('revert');
                }}>
                  <Row>
                    <strong>
                      Revert
                    </strong>
                  </Row>
                  <Row className="review-option-desc">
                    Revert service to the previous deployed state
                  </Row>
                </Col>
              </Row>
            </Form.Group>
          </Collapse>
          </Alert>
        </Alert>
      </React.Fragment>:null
    }
    <Alert show={response} variant={response==='success'?'success':'danger'} style={{marginTop:'1rem'}}>
      {response==='success'?'Deployment has been reset and is currently pending':'Request Failed please try again'}
    </Alert>


    </React.Fragment>
  )
}
export default ErrorComponent
