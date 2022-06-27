import React,{useEffect,useState,useContext} from 'react';
import config from '../config.json';
import Button from 'react-bootstrap/Button';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {faPaperPlane} from '@fortawesome/free-solid-svg-icons';
import {useParams,useHistory} from "react-router-dom";
import { useTranslation } from 'react-i18next';
import {tenantContext} from '../context.js';
import Form from 'react-bootstrap/Form';
import Table from 'react-bootstrap/Table';
import InputGroup from 'react-bootstrap/InputGroup';
import {ResponseModal,Logout,ConfirmationModal} from './Modals.js';
//  import {Debug} from './Debug.js';

const OutdatedNotifications = () =>{
  let {tenant_name} = useParams();
  const [logout,setLogout] = useState(false);
  // eslint-disable-next-line
  const { t, i18n } = useTranslation();
  const tenant = useContext(tenantContext);
  const [responseTitle,setResponseTitle] = useState();
  const [responseMessage,setResponseMessage] = useState();
  const [integrationEnvironment,setIntegrationEnvironment] = useState('production');
  const [confirmationData,setConfirmationData] = useState({active:false}) 
  const history = useHistory();

  const [outdatedServices,setOutdatedService] = useState(()=>{
      let outdated_services = {};
      tenant[0].form_config.integration_environment.forEach(integration_environment=>{
      outdated_services[integration_environment] = 0;
      });
      return outdated_services;
    })

  useEffect(()=>{
    getOutdatedServices();
    // eslint-disable-next-line
  },[]);

  const getOutdatedServices = ()=> {
    fetch(config.host+'tenants/'+tenant_name+'/services?outdated=true', {
      method: 'GET', // *GET, POST, PUT, DELETE, etc.
      credentials: 'include', // include, *same-origin, omit
      headers: {
      'Content-Type': 'application/json',
      'Authorization': localStorage.getItem('token'),
      }
    }).then(response=>{
        if(response.status===200){
          return response.json();
        }
        else if(response.status===401){
          setLogout(true);
          return false;
        }
        else if(response.status===404){
          return false;
        }
        else {
          return false
        }
      }).then(response=> {
      if(response){
        let outdated_services  = {...outdatedServices};
        for(const integration_environment in outdated_services){
          outdated_services[integration_environment] = 0;
        }
        if(response.length>0){
          response.forEach(outdated_service=>{
            outdated_services[outdated_service.integration_environment]++;
          })
        }
        setOutdatedService(outdated_services);
      }
    });
  }

  const sendNotification = (notification)=> {
    fetch(config.host+'tenants/'+tenant_name+'/notifications/outdated', {
      method: 'PUT', // *GET, POST, PUT, DELETE, etc.
      credentials: 'include', // include, *same-origin, omit
      headers: {
      'Content-Type': 'application/json',
      'Authorization': localStorage.getItem('token'),
      },
      body: JSON.stringify({integration_environment:integrationEnvironment})
    }).then(response=>{
        if(response.status===200){
          return response.json();
        }
        else if(response.status===401){
          // setLogout(true);
          return false;
        }
        else if(response.status===404){
          // setNotFound(true);
          return false;
        }
        else {
          return false
        }
      }).then(response=> {
      if(response){
        setResponseTitle('Thank your for submitting your request.')
        if(response&&response.user_count>0){
          setResponseMessage(response.user_count + ' notification'+(response.user_count>1?'s where ':' was ')+'sent to service owners');
        }
        else if(response&&response.user_count===0){
          setResponseMessage('We could not find any service owners for outdated services in the ' + integrationEnvironment + ' environment');          
        }
        else{
          setResponseMessage('We could not send the notification, please try again');
        }
      }
    });
  }

  return (        
  <React.Fragment>
      <div className="outdated-notifications-container">
        <Logout logout={logout}/>
        
        <ConfirmationModal active={confirmationData.active?true:false} setActive={setConfirmationData} action={()=>{sendNotification(integrationEnvironment);}} title={"Are you sure you want to send this notification"} message={"This notification is targeting the owners of outdated services registered in the " +capitalize(integrationEnvironment) + ' environment'} accept={'Yes'} decline={'No'}/>
        <ResponseModal return_url={'/'+tenant_name+'/home'} message={responseMessage} modalTitle={responseTitle}/>
        <h1>Send Alert for Outdated Services</h1>
        <p>Send alert to owners of services with oudated configuration of the selected environment.</p>
        <div className="outdated-notifications-input-container">
          <InputGroup className="mb-3">
            <Form.Control
              as="select"
              onChange={(e)=>{
                setIntegrationEnvironment(e.target.value)
              }}>
            >              
              {tenant[0].form_config.integration_environment.map((environment,index)=>{return <option key={index} value={environment}>{capitalize(environment)}</option>})}
            </Form.Control>
            <InputGroup.Append>
              <Button variant="primary" onClick={()=>{setConfirmationData({active:true})}}><FontAwesomeIcon icon={faPaperPlane}/> Send</Button>
            </InputGroup.Append>
          </InputGroup>
        </div>
        <hr/>
        <div className="outdated-notifications-services-container">
          <h1>Outdated Services</h1>
          <Table striped bordered hover className="outdated-table">
          
            <thead>
              <tr>
                <th>Integration Environment</th>
                <th>Outdated Services</th>
              </tr>
            </thead>
            <tbody>
              {
                Object.keys(outdatedServices).map(environment=>{
                  return(
                    <tr key={environment} onClick={()=>{history.push("/"+tenant_name+"/services?outdated=true&integration_environment="+environment)}}>
                    <td><span className="fake-link">{capitalize(environment)}</span></td>
                    <td><span className="fake-link">{outdatedServices[environment]}</span></td>
                  </tr>
                  );
                })}
            </tbody>
          </Table>
        </div>
        
      </div>
  </React.Fragment>)
}


const capitalize = (s) => {
  if (typeof s !== 'string') return ''
  return s.charAt(0).toUpperCase() + s.slice(1)
  }

export default OutdatedNotifications