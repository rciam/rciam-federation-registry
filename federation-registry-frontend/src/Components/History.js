import React,{useEffect,useState,useContext} from 'react';
import Badge from 'react-bootstrap/Badge';
import config from '../config.json';
import {LoadingBar} from './LoadingBar';
import ServiceForm from "../ServiceForm.js";
import Table from 'react-bootstrap/Table';
import Button from 'react-bootstrap/Button';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {faEye} from '@fortawesome/free-solid-svg-icons';
import {Link,useParams,useHistory} from "react-router-dom";
import Alert from 'react-bootstrap/Alert';
import Jumbotron from 'react-bootstrap/Jumbotron';
import Container from 'react-bootstrap/Container';
import { useTranslation } from 'react-i18next';
import {Logout,NotFound} from './Modals'
import {userContext} from '../context.js';
import {calcDiff} from '../helpers.js'
import {tenantContext} from '../context.js';
import { diff } from 'deep-diff';



export const HistoryRequest = () =>{
  let {tenant_name,petition_id,service_id} = useParams();
  const [petition,setPetition]  = useState();  
  const [notFound,setNotFound]= useState(false)
  let history = useHistory();
  const [logout,setLogout] = useState();
  // eslint-disable-next-line
  const { t, i18n } = useTranslation();
  // eslint-disable-next-line
  const [user] = useContext(userContext);
  const [oldPetition,setOldPetition] = useState();
  const tenant = useContext(tenantContext);
  const [changes,setChanges] = useState();
   

  useEffect(()=>{ 
    getPetition();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  },[]);

  useEffect(()=>{
    if(petition&&oldPetition){

      let helper = calcDiff(oldPetition.petition,petition.petition,tenant[0].form_config,diff);
      let multivalue_attributes = [];
      for (const service_property in oldPetition.petition) oldPetition.petition[service_property]&&typeof(oldPetition.petition[service_property])==='object'&&multivalue_attributes.push(service_property); 
      for (const service_property in petition.petition) petition.petition[service_property]&&typeof(petition.petition[service_property])==='object'&&!multivalue_attributes.includes(service_property)&&multivalue_attributes.push(service_property);
      multivalue_attributes.forEach(item=>{
        if(helper[item].D){
          petition.petition[item].push(...helper[item].D);
        }
      });
      // eslint-disable-next-line react-hooks/exhaustive-deps
      setPetition(petition);
      setChanges(helper);
    }
  },[petition,oldPetition,tenant])

  const getPetition = ()=> {
    fetch(config.host+'tenants/'+tenant_name+'/petitions/'+petition_id, {
      method: 'GET', // *GET, POST, PUT, DELETE, etc.
      credentials: 'include', // include, *same-origin, omit
      headers: {
      'Content-Type': 'application/json',
      'Authorization': localStorage.getItem('token')
    }}).then(response=>{
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
        setPetition(response);
        if(response.metadata.type==='edit'){
          fetch(config.host+'tenants/'+tenant_name+'/petitions/'+petition_id+'?previous_state=true', {
            method: 'GET', // *GET, POST, PUT, DELETE, etc.
            credentials: 'include', // include, *same-origin, omit
            headers: {
            'Content-Type': 'application/json',
            'Authorization': localStorage.getItem('token')
          }}).then(response=>{
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
              setOldPetition(response)
            }
          });
        }
      }
    });
    
  }

  return (        
  <React.Fragment>
    <div className="links">
      <Link to={"/"+tenant_name+"/home"}>{t('link_home')}</Link>
      <span className="link-seperator">/</span>
      <Link to={"/"+tenant_name+"/services"}>{t('link_petitions')}</Link>
      {service_id?
      <React.Fragment>
      <span className="link-seperator">/</span>
      <span className="fake-link" onClick={()=>{history.push("/"+tenant_name+"/services/"+service_id+"/history")}}>{t('history_title')}</span>
      </React.Fragment>:null
      }      
      <span className="link-seperator">/</span>
      {t('history_view_state')}
    </div>
    <Logout logout={logout}/>
    <NotFound notFound={notFound}/>
    {petition&&(petition.metadata.type!=='edit'||changes)?
      <React.Fragment>
        <Alert variant='warning' className='form-alert'>
         {petition.metadata.status==='approved_with_changes'?"The Reviewer has requested changes to the following":t('history_info_1')}  {petition.metadata.type==='create'?t('registration'):petition.metadata.type==='edit'?t('reconfiguration'):t('deregistration')} {t('history_info_2')}{petition.metadata.status==='approved'?t('history_info_approved'):petition.metadata.status==='reject'?t('history_info_rejected'):petition.metadata.status==='pending'?t('history_info_pending'):""}.
        </Alert>
        {petition.metadata.comment?
          <Jumbotron fluid className="jumbotron-comment">
            <Container>
              <h5>{t('history_commend')}</h5>
              <p className="text-comment">
                {petition.metadata.comment}
              </p>
            </Container>
          </Jumbotron>
        :null}
        <ServiceForm initialValues={petition.petition} changes={changes} user={user} disabled={true}/>
      </React.Fragment>
    :<LoadingBar loading={true}/> 
  }
    
  </React.Fragment>)
}


export const HistoryList = (props) => {
  const [historyList,setHistoryList] = useState();
  let history = useHistory();
  const [notFound,setNotFound] = useState();
  const [logout,setLogout] = useState();
  // eslint-disable-next-line
  const { t, i18n } = useTranslation();
  let {tenant_name,service_id} = useParams();

  useEffect(()=>{
    getHistory();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  },[]);


  

  const getHistory = ()=> {
    fetch(config.host+'tenants/'+tenant_name+'/services/'+service_id+'/petitions', {
      method: 'GET', // *GET, POST, PUT, DELETE, etc.
      credentials: 'include', // include, *same-origin, omit
      headers: {
      'Content-Type': 'application/json',
      'Authorization': localStorage.getItem('token')
    }}).then(response=>{
      if(response.status===200){
        return response.json();
      }
      else if(response.status===401){
        setLogout(true);
        return false;
      }
      else if(response.status===404){
        setNotFound(true);
        return false
      }
      else {
        return false
      }
    }).then(response=> {
      if(response.history){
          setHistoryList(response.history);
      }
    });
  }
  return (
    <React.Fragment>
      <NotFound notFound={notFound}/>
      <Logout logout={logout}/>

      <div className="links">
        <Link to={"/"+tenant_name+"/home"}>{t('link_home')}</Link>
        <span className="link-seperator">/</span>
        <Link to={"/"+tenant_name+"/services"}>{t('history_title')}</Link>
        <span className="link-seperator">/</span>
        {t('history_title')}
      </div>
      {historyList?
        <Table striped bordered hover className="history-table">
        <thead>
          <tr>
            <td>{t('history_td_date')}</td>
            <td>{t('history_td_type')}</td>
            <td>{t('history_td_status')}</td>
            <td></td>
          </tr>
        </thead>
        <tbody>
          {historyList.map((item,index)=>{
            return(
            <tr key={index}>
              <td>{item.reviewed_at?item.reviewed_at.slice(0,10).split('-').join('/'):t('history_not_reviewed')}</td>
              <td><Badge className="status-badge" variant='info'>{item.type==="create"?t('registration'):item.type==="edit"?t('reconfiguration'):t('deregistration')} {t('history_info_2')}</Badge></td>
              <td><Badge className="status-badge" variant={item.status==="pending"||item.status==="approved_with_changes"?'warning':item.status==="reject"?'danger':'success'}>{item.status==='reject'?'rejected':item.status}</Badge></td>
              <td>
                  <Button variant="secondary" onClick={()=>{history.push("/"+tenant_name+"/services/"+service_id+"/requests/"+item.id+"/history")}}
                  >
                    <FontAwesomeIcon icon={faEye}/>View
                  </Button>
              </td>
            </tr>
            )
          })}
        </tbody>
      </Table>
      :
      <LoadingBar loading={true} />}
    </React.Fragment>
  )
}
