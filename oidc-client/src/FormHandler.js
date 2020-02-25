import React,{useEffect,useState} from 'react';
import initialValues from './initialValues';
import * as config from './config.json';
//import {useParams} from "react-router-dom";
import PetitionForm from "./PetitionForm.js";
import {FormAlert} from "./Components/FormAlert.js";
import {LoadingBar} from './Components/LoadingBar';
import Tabs from 'react-bootstrap/Tabs';
import Tab from 'react-bootstrap/Tab';
import Alert from 'react-bootstrap/Alert';





const EditClient = (props) => {
    const [petition,setPetition] = useState();
    const [service,setService] = useState();

    useEffect(()=>{

      getData();
      // eslint-disable-next-line react-hooks/exhaustive-deps
    },[]);

    const getData = () => {
      if(props.service_id){
        fetch(config.host+'getservice/'+props.service_id, {
          method: 'GET', // *GET, POST, PUT, DELETE, etc.
          credentials: 'include', // include, *same-origin, omit
          headers: {
            'Content-Type': 'application/json'
          }
        }).then(response=>response.json()).then(response=> {

          if(response.service){

            setService(response.service);
          }
        });
      }
      if(props.petition_id&&props.type!=='delete'){
        fetch(config.host+'getpetition/'+props.petition_id, {
          method: 'GET', // *GET, POST, PUT, DELETE, etc.
          credentials: 'include', // include, *same-origin, omit
          headers: {
            'Content-Type': 'application/json'
          }
        }).then(response=>response.json()).then(response=> {

          if(response.petition){
            setPetition(response.petition);
          }
        });
      }
    }

  return (
    <React.Fragment>
    {props.review?
      <React.Fragment>
      {props.type==='edit'?

          <Tabs className="edit-tabs" defaultActiveKey="petition" id="uncontrolled-tab-example">
            <Tab eventKey="petition" title='Edit Petition Request'>
                <Alert variant='warning' className='form-alert'>
                  This is reconfiguration request, you can also view the deployed version in the View Deployed Service tab.
                </Alert>
              {petition?<PetitionForm initialValues={petition} {...props}/>:<LoadingBar loading={true}/>}
            </Tab>
            <Tab eventKey="service" title="View Deployed Service">
              {service?<PetitionForm initialValues={service} disabled={true}  />:<LoadingBar loading={true}/>}
            </Tab>
          </Tabs>
      :props.type==='create'?
        <React.Fragment>
          <Alert variant='warning' className='form-alert'>
            This is registration request.
          </Alert>
          {petition?<PetitionForm initialValues={petition} {...props}/>:<LoadingBar loading={true}/>}
        </React.Fragment>
      :
        <React.Fragment>
          <Alert variant='warning' className='form-alert'>
            User requested to deregister the following service.
          </Alert>
          {service?<PetitionForm initialValues={service} {...props} />:<LoadingBar loading={true}/>}
        </React.Fragment>
      }
    </React.Fragment>
    :
    <React.Fragment>
      {props.type==='edit'||props.type==='delete'?
        <Tabs className="edit-tabs" defaultActiveKey="petition" id="uncontrolled-tab-example">
          <Tab eventKey="petition" title={props.type==='edit'||props.type==='create'?'Edit Petition':'Edit Service'}>
            <FormAlert type={props.type}/>
            {props.type==='delete'?
              <Alert variant='danger' className='form-alert'>
                There is a deregistration request currently pending for this service. Sumbiting an new request will cancel the deragistration.
              </Alert>:
              <Alert variant='warning' className='form-alert'>
                There is a deregistration request currently pending for this service. You can modify or cancel it here.
              </Alert>}
            {((petition&&props.type!=='delete')||(props.type==="delete"&&service)||(!props.type&&service))?<PetitionForm initialValues={props.type==="edit"?petition:service} {...props}/>:<LoadingBar loading={true}/>}
          </Tab>
          <Tab eventKey="service" title="View Deployed Service">
            {service?<PetitionForm initialValues={service} disabled={true}  />:<LoadingBar loading={true}/>}
          </Tab>
        </Tabs>
        :props.petition_id?
        <React.Fragment>
        {petition?<PetitionForm initialValues={petition} {...props}/>:<LoadingBar loading={true}/>}
        </React.Fragment>
        :
        <React.Fragment>
        {service?<PetitionForm initialValues={service} {...props}/>:<LoadingBar loading={true}/>}
        </React.Fragment>
      }
    </React.Fragment>
    }


    </React.Fragment>
  )
}


const ViewClient = (props)=>{
  const [service,setService] = useState();
  const [petition,setPetition] = useState();
  useEffect(()=>{

    getData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  },[]);

  const getData = () => {
    if(props.service_id){
      fetch(config.host+'getservice/'+props.service_id, {
        method: 'GET', // *GET, POST, PUT, DELETE, etc.
        credentials: 'include', // include, *same-origin, omit
        headers: {
          'Content-Type': 'application/json'
        }
      }).then(response=>response.json()).then(response=> {

        if(response.service){

          setService(response.service);
        }
      });
    }
    if(props.petition_id&&props.type!=='delete'){
      fetch(config.host+'getpetition/'+props.petition_id, {
        method: 'GET', // *GET, POST, PUT, DELETE, etc.
        credentials: 'include', // include, *same-origin, omit
        headers: {
          'Content-Type': 'application/json'
        }
      }).then(response=>response.json()).then(response=> {

        if(response.petition){
          setPetition(response.petition);
        }
      });
    }
  }
  return(
    <React.Fragment>
      {service?<PetitionForm initialValues={service} disabled={true}  />:!service&&petition?
        <React.Fragment>

          <Alert variant='danger' className='form-alert'>
            This service is not registered yet, it is currently pending approval from an administrator
          </Alert>:
          <PetitionForm initialValues={petition} disabled={true}/>
        </React.Fragment>
      :<LoadingBar loading={true}/>}
      {
      }
    </React.Fragment>
  )
}

const NewClient = (props)=>{
  return (
    <React.Fragment>
      <PetitionForm user={props.user} initialValues={initialValues}/>
    </React.Fragment>
  )
}

export {
   EditClient,
   NewClient,
   ViewClient
}
