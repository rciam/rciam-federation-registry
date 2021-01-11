import React,{useEffect,useState} from 'react';
import Badge from 'react-bootstrap/Badge';
import * as config from '../config.json';
import {LoadingBar,ProcessingRequest} from './LoadingBar';
import ServiceForm from "../ServiceForm.js";
import Table from 'react-bootstrap/Table';
import Button from 'react-bootstrap/Button';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {faEye} from '@fortawesome/free-solid-svg-icons';
import {Link,useParams} from "react-router-dom";
import Alert from 'react-bootstrap/Alert';
import Jumbotron from 'react-bootstrap/Jumbotron';
import Container from 'react-bootstrap/Container';
import { useTranslation } from 'react-i18next';
import {Logout} from './Modals'

export const HistoryList = (props) => {
  const [loadingList,setLoadingList] = useState();
  const [historyList,setHistoryList] = useState();
  const [asyncResponse,setAsyncResponse] = useState(false);
  const [petition,setPetition] = useState(null);
  const [stateProps,setstateProps] = useState();
  const [logout,setLogout] = useState();
  // eslint-disable-next-line
  const { t, i18n } = useTranslation();
  let {tenant_name} = useParams();

  useEffect(()=>{
    setLoadingList(true);
    getHistory();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  },[]);
  useEffect(()=>{
  },[historyList]);


  const getPetition = (id)=> {
    setAsyncResponse(true);
    fetch(config.host+'tenants/'+tenant_name+'/petitions/'+id, {
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
          props.logout();
        }
        else {
          return false
        }
      }).then(response=> {
      setAsyncResponse(false);
      if(response.petition){
        setPetition(response.petition);
      }
    });
  }

  const getHistory = ()=> {
    fetch(config.host+'tenants/'+tenant_name+'/services/'+props.service_id+'/petitions', {
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
      }
      else {
        return false
      }
    }).then(response=> {
      setLoadingList(false);
      if(response.history){
          setHistoryList(response.history);
      }
    });
  }
  return (
    <React.Fragment>
      <Logout logout={logout}/>
      <ProcessingRequest active={asyncResponse}/>

      {petition?
        <React.Fragment>
          <div className="links">
            <Link to={"/"+tenant_name+"/home"}>{t('link_home')}</Link>
            <span className="link-seperator">/</span>
            <Link to={"/"+tenant_name+"/petitions"}>{t('link_petitions')}</Link>
            <span className="link-seperator">/</span>
            <span className="fake-link" onClick={()=>{setPetition(null);}}>{t('history_title')}</span>
            <span className="link-seperator">/</span>
            {t('history_view_state')}
          </div>
          <Alert variant='warning' className='form-alert'>
            {t('history_info_1')} {stateProps[0]==='create'?t('registration'):stateProps[0]==='edit'?t('reconfiguration'):t('deregistration')} {t('history_info_2')}{stateProps[1]==='approved'?t('history_info_approved'):stateProps[1]==='rejected'?t('history_info_rejected'):stateProps[1]==='pending'?t('history_info_pending'):t('history_info_changes')}.
          </Alert>
          {stateProps[2]?
            <Jumbotron fluid className="jumbotron-comment">
              <Container>
                <h5>{t('history_commend')}</h5>
                <p className="text-comment">
                  {stateProps[2]}
                </p>
              </Container>
            </Jumbotron>
          :null}

          <ServiceForm initialValues={petition} disabled={true}/>
        </React.Fragment>
        :!loadingList?
        <React.Fragment>
          <div className="links">
            <Link to={"/"+tenant_name+"/home"}>{t('link_home')}</Link>
            <span className="link-seperator">/</span>
            <Link to={"/"+tenant_name+"/petitions"}>{t('history_title')}</Link>
            <span className="link-seperator">/</span>
            {t('history_title')}
          </div>
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
              {historyList?historyList.map((item,index)=>{
                return(
                <tr key={index}>
                  <td>{item.reviewed_at?item.reviewed_at.slice(0,10).split('-').join('/'):t('history_not_reviewed')}</td>
                  <td><Badge className="status-badge" variant='info'>{item.type==="create"?t('registration'):item.type==="edit"?t('reconfiguration'):t('deregistration')} {t('history_info_2')}</Badge></td>
                  <td><Badge className="status-badge" variant={item.status==="pending"||item.status==="approved_with_changes"?'warning':item.status==="reject"?'danger':'success'}>{item.status}</Badge></td>
                  <td>
                      <Button variant="secondary" onClick={()=>{
                        let indx = index;
                        while(historyList[indx].type==='delete'){
                          indx--;
                        }
                        let id = historyList[indx].id;
                        setstateProps([item.type,item.status,item.comment]);
                        getPetition(id,item.type,item.status);}}
                      >
                        <FontAwesomeIcon icon={faEye}/>View
                      </Button>
                  </td>
                </tr>
                )
              }):null}
            </tbody>
          </Table>
        </React.Fragment>
        :
      <LoadingBar/>}
    </React.Fragment>
  )
}
