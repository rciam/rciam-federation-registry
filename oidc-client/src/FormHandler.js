import React,{useEffect,useState} from 'react';
import initialValues from './initialValues';
import * as config from './config.json';
//import {useParams} from "react-router-dom";
import PetitionForm from "./PetitionForm.js";
//import {FormAlert} from "./Components/FormAlert.js";
import {LoadingBar} from './Components/LoadingBar';
import Tabs from 'react-bootstrap/Tabs';
import Tab from 'react-bootstrap/Tab';
import Alert from 'react-bootstrap/Alert';
//import Form from 'react-bootstrap/Form';
import Jumbotron from 'react-bootstrap/Jumbotron';
import Container from 'react-bootstrap/Container';



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
                  This is a reconfiguration request, you can also view the deployed version in the View Deployed Service tab.
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
            This is a registration request.
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
      {props.type==='edit'?
        <RequestedChangesAlert comment={props.comment}  tab1={petition} tab2={service} {...props}/>
      :props.type==='delete'?
        <RequestedChangesAlert comment={props.comment} tab1={service} tab2={service} {...props}/>
        :props.type==='create'?
        <React.Fragment>
          {props.comment?
            <React.Fragment>
              <Alert variant='warning' className='form-alert'>
                An administrator has reviewed your registration request and has requested changes.
              </Alert>
              <Jumbotron fluid className="jumbotron-comment">
                <Container>
                  <h5>Comment from admin:</h5>
                  <p className="text-comment">
                    {props.comment}
                  </p>
                </Container>
              </Jumbotron>
            </React.Fragment>
          :props.type?
              <Alert variant='warning' className='form-alert'>
              This is a registration request which is currently pending approval from an administrator. You can modify or cancel it here.
              </Alert>
          :null
          }
          {petition?<PetitionForm initialValues={petition} {...props}/>:<LoadingBar loading={true}/>}
        </React.Fragment>
        :
        <RequestedChangesAlert comment={props.comment} tab1={service} tab2={service} {...props}/>
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
      {service?<PetitionForm initialValues={service} disabled={true}  />:props.service_id?<LoadingBar loading={true}/>:petition?
        <React.Fragment>

          <Alert variant='danger' className='form-alert'>
            This service is not registered yet, it is currently pending approval from an administrator
          </Alert>
          <PetitionForm initialValues={petition} disabled={true}/>
        </React.Fragment>
      :props.petition_id?<LoadingBar loading={true}/>:null
      }
    </React.Fragment>
  )
}
const RequestedChangesAlert = (props) => {
  return(
    <React.Fragment>
      <Tabs className="edit-tabs" defaultActiveKey="petition" id="uncontrolled-tab-example">
        <Tab eventKey="petition" title='Edit Request'>
          {props.comment?
            <React.Fragment>
              <Alert variant='warning' className='form-alert'>
                An administrator has reviewed your {props.type} request and has requested changes.
              </Alert>
              <Jumbotron fluid className="jumbotron-comment">
                <Container>
                  <h5>Comment from admin:</h5>
                  <p className="text-comment">
                    {props.comment}
                  </p>
                </Container>
              </Jumbotron>
            </React.Fragment>
          :props.type?
              <Alert variant='warning' className='form-alert'>
              This is a {props.type==='delete'?'deregistration':props.type==='edit'?'reconfiguration':'registration'} request which is currently pending approval from an administrator. You can modify or cancel it here.
              </Alert>
          :null
          }
          {props.tab1?<PetitionForm initialValues={props.tab1} {...props}/>:<LoadingBar loading={true}/>}
        </Tab>
      <Tab eventKey="service" title="View Deployed Service">
        {props.tab2?<PetitionForm initialValues={props.tab2} disabled={true}  />:<LoadingBar loading={true}/>}
      </Tab>
    </Tabs>
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
