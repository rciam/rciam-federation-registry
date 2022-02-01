import React,{useEffect,useState,useContext} from 'react';
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
import {Logout,NotFound} from './Components/Modals';
import { diff } from 'deep-diff';
import { useTranslation } from 'react-i18next';
import {tenantContext,userContext} from './context.js';

const EditService = (props) => {
    // eslint-disable-next-line
    const { t, i18n } = useTranslation();
    const [petitionData,setPetitionData] = useState();
    const [service,setService] = useState();
    const [editPetition,setEditPetition] = useState();
    const [changes,setChanges] = useState();
    const {tenant_name} = useParams();
    const {service_id} = useParams();
    const {petition_id} = useParams();
    const [logout,setLogout] = useState(false);
    const [notFound,setNotFound] = useState(false);
    const tenant = useContext(tenantContext);
    const [user] = useContext(userContext);
    const [owned,setOwned] = useState(true);
    
    useEffect(()=>{
      
      localStorage.removeItem('url');
      getData();
      // eslint-disable-next-line react-hooks/exhaustive-deps
    },[]);

    useEffect(()=>{
        // eslint-disable-next-line react-hooks/exhaustive-deps
      if(petitionData&&service&&props.review&&!editPetition){
        const changes = diff(service,petitionData.petition);
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
        
        if(petitionData.petition.protocol==='oidc'){
          attributes.push('grant_types','scope','redirect_uris');
        }

        for(let i=0;i<changes.length;i++){
          if(! ['grant_types','scope','contacts','redirect_uris'].includes(changes[i].path[0])){
              helper[changes[i].path[0]]=changes[i].kind;
            }
        }

        helper = calculateMultivalueDiff(service,petitionData.petition,helper);

        attributes.forEach(item=>{
          petitionData.petition[item].push(...helper[item].D);
        });
        
        for(var property in tenant[0].form_config.code_of_condact){
          delete helper[property];
          if(petitionData.petition[property]!==service[property]&&!(!service[property]&&petitionData.petition[property]===false)){
            helper[property] = 'N'; 
          }
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps

        setEditPetition(petitionData.petition);
        setChanges(helper);
      }
      // eslint-disable-next-line react-hooks/exhaustive-deps
    },[petitionData, service, props.review, editPetition]);

    const getData = async () => {
      if(service_id){
        fetch(config.host+'tenants/'+tenant_name+'/services/'+service_id, {
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
            return false
          }
          if(response.status===404){
            
            setNotFound(true);
            return false;
          }
          else {
            return false
          }
          }).then(response=> {
          if(response){
            setOwned(response.owned);
            setService(response.service);
          }
        });
      }
      if(petition_id){
        fetch(config.host+'tenants/'+tenant_name+'/petitions/'+petition_id+'?type=open', {
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
            return false;
          }
          else if(response.status===404){
            setNotFound(true);
            return false;
          }
          else {
            return false
          }
        }).then(response=> {
          if(response){
            if(props.review&&!user.review&&response&&response.petition.integration_environment!=='development'){
              setNotFound(true);
            }
            else{
              setOwned(response.metadata.owned);
              // console.log(...response.metadata)
              setPetitionData(response);
            }
          }
        });
      }
    }

  return (
    <React.Fragment>
      <Logout logout={logout}/>
      <NotFound notFound={notFound}/>
    {!((petitionData||!petition_id)&&(!service_id||service))?<LoadingBar loading={true}/>:
      <React.Fragment>
       {props.review?
        <React.Fragment>
          
          {
            petitionData.metadata.type==='edit'?
              <React.Fragment>
                <Alert variant='warning' className='form-alert'>
                  {t('reconfiguration_info')} It was submitted on {petitionData.metadata.submitted_at.slice(12,19)}(GMT+3) at {petitionData.metadata.submitted_at.slice(0,10).split('-').join('/')}.
                </Alert>
                {editPetition&&changes?
                  <React.Fragment>
                    <RequestedReviewAlert comment={petitionData.metadata.comment} />
                    <ServiceForm disableEnvironment={true} initialValues={editPetition} changes={changes} {...petitionData.metadata} {...props}/>
                  </React.Fragment>
                    :<LoadingBar loading={true}/>
  
                }
              </React.Fragment>
            :petitionData.metadata.type==='create'?
              <React.Fragment>
                <Alert variant='warning' className='form-alert'>
                  {t('edit_create_info')} It was submitted on {petitionData.metadata.submitted_at.slice(12,19)}(GMT+3) at {petitionData.metadata.submitted_at.slice(0,10).split('-').join('/')}.
                </Alert>
                {petitionData?
                  <React.Fragment>
                    <RequestedReviewAlert comment={petitionData.metadata.comment} />
                    <ServiceForm initialValues={petitionData.petition} {...petitionData.metadata} {...props}/>
                  </React.Fragment>:<LoadingBar loading={true}/>}
              </React.Fragment>
            :
              <React.Fragment>
                <Alert variant='warning' className='form-alert'>
                  {t('edit_delete_info')} It was submitted on {petitionData.metadata.submitted_at.slice(12,19)}(GMT+3) at {petitionData.metadata.submitted_at.slice(0,10).split('-').join('/')}.
                </Alert>
                {service?
                  <React.Fragment>
                    <RequestedReviewAlert comment={petitionData.metadata.comment} />
                    <ServiceForm copy={true} initialValues={service} {...petitionData.metadata} {...props}/>
                  </React.Fragment>:<LoadingBar loading={true}/>}
              </React.Fragment>
            }
        </React.Fragment>
      :
      <React.Fragment>
        <NotFound notAuthorised={!owned}/>

        {!petitionData?
          <RequestedChangesAlert tab1={service} tab2={service}  {...props}/>
        :
          petitionData.metadata.type==='edit'?
            <RequestedChangesAlert comment={petitionData.metadata.comment}  tab1={petitionData.petition} tab2={service} {...petitionData.metadata} {...props}/>
          :petitionData.metadata.type==='delete'?
            <RequestedChangesAlert comment={petitionData.metadata.comment} tab1={service} tab2={service} {...petitionData.metadata} {...props}/>
            :petitionData.metadata.type==='create'?
            <React.Fragment>
              {petitionData.metadata.comment?
                <React.Fragment>
                  <Alert variant='warning' className='form-alert'>
                    {t('edit_changes_info')}
                  </Alert>
                  <Jumbotron fluid className="jumbotron-comment">
                    <Container>
                      <h5>Comment from Reviewer</h5>
                      <p className="text-comment">
                        {petitionData.metadata.comment}
                      </p>
                    </Container>
                  </Jumbotron>
                </React.Fragment>
              :petitionData.metadata.type?
                  <Alert variant='warning' className='form-alert'>
                  {t('edit_create_pending_info')}
                  </Alert>
              :null
              }
              {petitionData?<ServiceForm disableEnvironment={true} initialValues={petitionData.petition} {...petitionData.metadata} {...props}/>:<LoadingBar loading={true}/>}
            </React.Fragment>
          :
          <RequestedChangesAlert comment={petitionData?petitionData.metadata.comment:null} tab1={service} tab2={service} {...petitionData.metadata} {...props}/>
        }
      </React.Fragment>
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
  const [deploymentError,setDeploymentError] = useState();
  const {tenant_name} = useParams();
  const {petition_id} = useParams();
  const {service_id} = useParams();
  const [petitionData,setPetitionData] = useState();
  const [owned,setOwned] = useState(false);
  const [logout,setLogout] = useState(false);
  const [notFound,setNotFound] = useState(false);
  useEffect(()=>{
    localStorage.removeItem('url');
    getData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  },[]);

  const getData = () => {
    if(service_id){
      fetch(config.host+'tenants/'+tenant_name+'/services/'+service_id +'/error', {
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
          setDeploymentError(response.error)
        }
      });
      
      fetch(config.host+'tenants/'+tenant_name+'/services/'+service_id, {
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
          return false;
        }
        else if(response.status===404){
          setNotFound(true);
          return false;
        }
        else {
          return false;
        }
      }).then(response=> {
        if(response.service){
          setOwned(response.owned);
          setService(response.service);
        }
      });
    }
    if(petition_id){
      fetch(config.host+'tenants/'+tenant_name+'/petitions/'+petition_id+'?type=open', {
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
          return false;
        }
        else if(response.status===404){
          setNotFound(true);
          return false;
        }
        else {
          return false
        }
      }).then(response=> {
        if(response){
          setPetitionData(response);
        }
      });
    }
  }
  return(
    <React.Fragment>
    <NotFound notFound={notFound}/>
    <Logout logout={logout}/>
    <ErrorComponent deploymentError={deploymentError} setDeploymentError={setDeploymentError} service_id={service_id} setLogout={setLogout}/>
      {service?
        <React.Fragment>        
          {service.created_at?
            <Alert variant='primary' className='form-alert'>
              Service was registered at: <b>{service.created_at.slice(0,10).split('-').join('/')+ ' ' + service.created_at.slice(11,19).split('-').join('/')}</b>
            </Alert>:null}
          <ServiceForm initialValues={service} disabled={true} copyButton={true} owned={owned} {...props}/>
        </React.Fragment>
        :service_id?<LoadingBar loading={true}/>:petitionData?
        <React.Fragment>
          <Alert variant='danger' className='form-alert'>
            {t('view_create_info')}
          </Alert>
          
          
          <ServiceForm initialValues={petitionData.petition} copyButton={true} owned={owned} disabled={true} {...petitionData.metadata} {...props}/>
        </React.Fragment>
      :petition_id?<LoadingBar loading={true}/>:null
      }
    </React.Fragment>
  )
}

const RequestedReviewAlert = (props) => {
  // eslint-disable-next-line
  const { t, i18n } = useTranslation();

  return(
    <React.Fragment>
        {props.comment?
            <React.Fragment>
              <Alert variant='warning' className='form-alert'>
                An Operator has requested reviewal for the following request
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
          :null
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
          {props.tab1?<ServiceForm disableEnvironment={true} initialValues={props.tab1} {...props}/>:<LoadingBar loading={true}/>}
        </Tab>
      <Tab eventKey="service" title="View Deployed Service">
        {props.tab2?<ServiceForm initialValues={props.tab2} disabled={true} {...props} />:<LoadingBar loading={true}/>}
      </Tab>
    </Tabs>
    </React.Fragment>
  )
}

const CopyService = (props)=> {

  const [service,setService] = useState();
  const {tenant_name} = useParams();
  const [logout,setLogout] = useState(false);
  const [notFound,setNotFound] = useState(false);
  // eslint-disable-next-line
  const { t, i18n } = useTranslation();

  useEffect(()=>{
    getData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  },[]);
  const getData = () => {
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
          return false
        }
        if(response.status===404){
          setNotFound(true);
          return false;
        }
        else {
          return false
        }
        }).then(response=> {
        if(response){
          response.service.integration_environment=props.integration_environment;
          setService(response.service);
        }
      });
  }
  return (
    <React.Fragment>
      <NotFound notFound={notFound}/>
      <Logout logout={logout}/>
      {service?<ServiceForm initialValues={service} copy={true} />:<LoadingBar loading={true}/>}
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
  if(!old_values.contacts){
    old_values.contacts = [];
  }
  if(!new_values.contacts){
    new_values.contacts = [];
  }

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
    if(!old_values.redirect_uris){
      old_values.redirect_uris = [];
    }
    if(!new_values.redirect_uris){
      new_values.redirect_uris = [];
    }
    if(!old_values.scope){
      old_values.scope = [];
    }
    if(!new_values.scope){
      new_values.scope = [];
    }
    if(!old_values.grant_types){
      old_values.scope = [];
    }
    if(!new_values.grant_types){
      new_values.scope = [];
    }

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
   ViewService,
   CopyService
}
