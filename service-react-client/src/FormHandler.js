import React,{useEffect,useState} from 'react';
import initialValues from './initialValues';
import {useParams} from "react-router-dom";
import * as config from './config.json';
import ServiceForm from "./ServiceForm.js";
import ErrorComponent from "./Components/Error.js"
import {LoadingBar} from './Components/LoadingBar';
import Tabs from 'react-bootstrap/Tabs';
import Tab from 'react-bootstrap/Tab';
import Alert from 'react-bootstrap/Alert';
import Jumbotron from 'react-bootstrap/Jumbotron';
import Container from 'react-bootstrap/Container';
import {Logout} from './Components/Modals';
import { diff } from 'deep-diff';
import { useTranslation } from 'react-i18next';


const EditService = (props) => {
    // eslint-disable-next-line
    const { t, i18n } = useTranslation();
    const [petition,setPetition] = useState();
    const [service,setService] = useState();
    const [editPetition,setEditPetition] = useState();
    const [changes,setChanges] = useState();
    const {tenant_name} = useParams();
    const {logout,setLogout} = useState(false);
    useEffect(()=>{
      getData();
      // eslint-disable-next-line react-hooks/exhaustive-deps
    },[]);

    useEffect(()=>{
        // eslint-disable-next-line react-hooks/exhaustive-deps
      if(petition&&service&&props.review&&!editPetition){
        const changes = diff(service,petition);
        let helper = {
          grant_types: {
            D:[],
            N:[],
          },
          scope: {
            D:[],
            N:[]
          },
          contacts: {
            D:[],
            N:[]
          },
          redirect_uris: {
            D:[],
            N:[]
          }
        };
        let attributes = ['contacts'];
        if(petition.protocol==='oidc'){
          attributes.push('grant_types','scope','redirect_uris');
        }
        for(let i=0;i<changes.length;i++){
          if(! ['grant_types','scope','contacts','redirect_uris'].includes(changes[i].path[0])){
              helper[changes[i].path[0]]=changes[i].kind;
            }
        }
        helper = calculateMultivalueDiff(service,petition,helper);
        attributes.forEach(item=>{
          petition[item].push(...helper[item].D);
        });
        // eslint-disable-next-line react-hooks/exhaustive-deps
        setEditPetition(petition);
        setChanges(helper);



      }
      // eslint-disable-next-line react-hooks/exhaustive-deps
    },[petition, service, props.review, editPetition]);

    const getData = () => {
      if(props.service_id){
        fetch(config.host+'tenants/'+tenant_name+'/services/'+props.service_id, {
          method: 'GET', // *GET, POST, PUT, DELETE, etc.
          credentials: 'include', // include, *same-origin, omit
          headers: {
            'Content-Type': 'application/json',
            'Authorization': localStorage.getItem('token')
          }
        }).then(response=>{
          if(response.status===200){
            return response.json();
          }else if(response.status===401){
            setLogout(true);
          }
          else {
            return false
          }
          }).then(response=> {
          if(response){
            setService(response.service);
          }
        });
      }
      if(props.petition_id&&props.type!=='delete'){
        fetch(config.host+'tenants/'+tenant_name+'/petitions/'+props.petition_id+'?type=open', {
          method: 'GET', // *GET, POST, PUT, DELETE, etc.
          credentials: 'include', // include, *same-origin, omit
          headers: {
            'Content-Type': 'application/json',
            'Authorization': localStorage.getItem('token')
          }
        }).then(response=>{
          if(response.status===200){
            return response.json();
          }else if(response.status===401){
            setLogout(true);
          }
          else {
            return false
          }
        }).then(response=> {
          if(response){
            setPetition(response.petition);
          }
        });
      }
    }

  return (
    <React.Fragment>
    {props.review?
      <React.Fragment>
      <Logout logout={logout}/>
      {props.type==='edit'?
        <React.Fragment>
          <Alert variant='warning' className='form-alert'>
            {t('reconfiguration_info')}
          </Alert>
          {editPetition&&changes?<ServiceForm initialValues={editPetition} changes={changes} {...props}/>:<LoadingBar loading={true}/>}
        </React.Fragment>

      :props.type==='create'?
        <React.Fragment>
          <Alert variant='warning' className='form-alert'>
            {t('edit_create_info')}
          </Alert>
          {petition?<ServiceForm initialValues={petition} {...props}/>:<LoadingBar loading={true}/>}
        </React.Fragment>
      :
        <React.Fragment>
          <Alert variant='warning' className='form-alert'>
            {t('edit_delete_info')}
          </Alert>
          {service?<ServiceForm initialValues={service} {...props} />:<LoadingBar loading={true}/>}
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
                {t('edit_changes_info')}
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
              {t('edit_create_pending_info')}
              </Alert>
          :null
          }
          {petition?<ServiceForm initialValues={petition} {...props}/>:<LoadingBar loading={true}/>}
        </React.Fragment>
        :
        <RequestedChangesAlert comment={props.comment} tab1={service} tab2={service} {...props}/>
      }
    </React.Fragment>
    }


    </React.Fragment>
  )
}


const ViewService = (props)=>{
  // eslint-disable-next-line
  const { t, i18n } = useTranslation();
  const [service,setService] = useState();
  const [petition,setPetition] = useState();
  const [deploymentError,setDeploymentError] = useState();
  const {tenant_name} = useParams();
  const {logout,setLogout} = useState(false);
  
  useEffect(()=>{

    getData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  },[]);

  const getData = () => {
    if(props.service_id){
      if(props.get_error){
          fetch(config.host+'tenants/'+tenant_name+'/services/'+props.service_id +'/error', {
            method: 'GET', // *GET, POST, PUT, DELETE, etc.
            credentials: 'include', // include, *same-origin, omit
            headers: {
            'Content-Type': 'application/json',
            'Authorization': localStorage.getItem('token')
            }
        }).then(response=> {
          if(response.status===200){
            return response.json();
          }else if(response.status===401){
            setLogout(true);
          }
          else {
            return false
          }
        }).then(response=> {
          if(response){
            console.log(response)
            setDeploymentError(response.error)
          }
          else{
            setLogout(true)
          }
        });
      }
      fetch(config.host+'tenants/'+tenant_name+'/services/'+props.service_id, {
        method: 'GET', // *GET, POST, PUT, DELETE, etc.
        credentials: 'include', // include, *same-origin, omit
        headers: {
          'Content-Type': 'application/json',
          'Authorization': localStorage.getItem('token')
        }
      }).then(response=>{
        if(response.status===200){
          return response.json();
        }
        else if(response.status===401){
          setLogout(true);
        }
        else {
          return false
        }
      }).then(response=> {
        if(response.service){
          setService(response.service);
        }
      });
    }
    if(props.petition_id&&props.type!=='delete'){
      fetch(config.host+'tenants/'+tenant_name+'/petitions/'+props.petition_id+'?type=open', {
        method: 'GET', // *GET, POST, PUT, DELETE, etc.
        credentials: 'include', // include, *same-origin, omit
        headers: {
          'Content-Type': 'application/json',
          'Authorization': localStorage.getItem('token')
        }
      }).then(response=>{
        if(response.status===200){
          return response.json();
        }
        else if(response.status===401){
          setLogout(true);
        }
        else {
          return false
        }
      }).then(response=> {
        if(response.petition){
          setPetition(response.petition);
        }
      });
    }
  }
  return(
    <React.Fragment>
    <Logout logout={logout}/>
    <ErrorComponent deploymentError={deploymentError} setDeploymentError={setDeploymentError} service_id={props.service_id} setLogout={setLogout}/>
      {service?<ServiceForm initialValues={service} disabled={true} {...props} />:props.service_id?<LoadingBar loading={true}/>:petition?
        <React.Fragment>
          <Alert variant='danger' className='form-alert'>
            {t('view_create_info')}
          </Alert>
          <ServiceForm initialValues={petition} disabled={true} {...props}/>
        </React.Fragment>
      :props.petition_id?<LoadingBar loading={true}/>:null
      }
    </React.Fragment>
  )
}


const RequestedChangesAlert = (props) => {
  // eslint-disable-next-line
  const { t, i18n } = useTranslation();

  return(
    <React.Fragment>
      <Tabs className="edit-tabs" defaultActiveKey="petition" id="uncontrolled-tab-example">
        <Tab eventKey="petition" title='Edit Request'>
          {props.comment?
            <React.Fragment>
              <Alert variant='warning' className='form-alert'>
                {t('changes_info_1_1')}{props.type}{t('changes_info_1_2')}
              </Alert>
              <Jumbotron fluid className="jumbotron-comment">
                <Container>
                  <h5>{t('changes_title')}</h5>
                  <p className="text-comment">
                    {props.comment}
                  </p>
                </Container>
              </Jumbotron>
            </React.Fragment>
          :props.type?
              <Alert variant='warning' className='form-alert'>
              {t('changes_info_2_1')} {props.type==='delete'?'deregistration':props.type==='edit'?'reconfiguration':'registration'} {t('changes_info_2_2')}
              </Alert>
          :null
          }
          {props.tab1?<ServiceForm initialValues={props.tab1} {...props}/>:<LoadingBar loading={true}/>}
        </Tab>
      <Tab eventKey="service" title="View Deployed Service">
        {props.tab2?<ServiceForm initialValues={props.tab2} disabled={true} {...props} />:<LoadingBar loading={true}/>}
      </Tab>
    </Tabs>
    </React.Fragment>
  )
}

const NewService = (props)=>{
  return (
    <React.Fragment>

      <ServiceForm user={props.user} initialValues={initialValues} {...props}/>
    </React.Fragment>
  )
}

function calculateMultivalueDiff(old_values,new_values,edits){
  let new_cont = [];
  let old_cont = [];
  let items;


  new_values.contacts.forEach(item=>{
    new_cont.push(item.email+' '+item.type);
  });
  old_values.contacts.forEach(item=>{
    old_cont.push(item.email+' '+item.type);
  });
  edits.contacts.N = new_cont.filter(x=>!old_cont.includes(x));
  edits.contacts.D = old_cont.filter(x=>!new_cont.includes(x));
  if(edits.contacts.D.length>0){
      edits.contacts.D.forEach((item,index)=>{
        items = item.split(' ');
        edits.contacts.D[index] = {email:items[0],type:items[1]};
      })
  }
  if(edits.contacts.N.length>0){
      edits.contacts.N.forEach((item,index)=>{
        items = item.split(' ');
        edits.contacts.N[index] = {email:items[0],type:items[1]};
    })
  }
  if(new_values.protocol==='oidc'){
    edits.grant_types.N = new_values.grant_types.filter(x=>!old_values.grant_types.includes(x));
    edits.grant_types.D = old_values.grant_types.filter(x=>!new_values.grant_types.includes(x));
    edits.scope.N = new_values.scope.filter(x=>!old_values.scope.includes(x));
    edits.scope.D = old_values.scope.filter(x=>!new_values.scope.includes(x));
    edits.redirect_uris.N = new_values.redirect_uris.filter(x=>!old_values.redirect_uris.includes(x));
    edits.redirect_uris.D = old_values.redirect_uris.filter(x=>!new_values.redirect_uris.includes(x));
  }
  return edits
}

export {
   EditService,
   NewService,
   ViewService
}
