import React,{useEffect,useState,useContext} from 'react';
import Badge from 'react-bootstrap/Badge';
import * as config from '../config.json';
import {LoadingBar,ProcessingRequest} from './LoadingBar';
import ServiceForm from "../ServiceForm.js";
import Table from 'react-bootstrap/Table';
import Button from 'react-bootstrap/Button';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {faEye} from '@fortawesome/free-solid-svg-icons';
import {Link} from "react-router-dom";
import Alert from 'react-bootstrap/Alert';
import Jumbotron from 'react-bootstrap/Jumbotron';
import Container from 'react-bootstrap/Container';
import StringsContext from '../localContext';

export const HistoryList = (props) => {
  const [loadingList,setLoadingList] = useState();
  const [historyList,setHistoryList] = useState();
  const [asyncResponse,setAsyncResponse] = useState(false);
  const [petition,setPetition] = useState(null);
  const [stateProps,setstateProps] = useState();
  const strings = useContext(StringsContext);

  useEffect(()=>{
    setLoadingList(true);
    getHistory();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  },[]);
  useEffect(()=>{
  },[historyList]);


  const getPetition = (id)=> {
    setAsyncResponse(true);
    fetch(config.host+'petition/history/'+id, {
      method: 'GET', // *GET, POST, PUT, DELETE, etc.
      credentials: 'include', // include, *same-origin, omit
      headers: {
      'Content-Type': 'application/json'
    }}).then(response=>response.json()).then(response=> {
      setAsyncResponse(false);
      if(response.petition){
        setPetition(response.petition);
      }
    });
  }

  const getHistory = ()=> {
    fetch(config.host+'petition/history/list/'+props.service_id, {
      method: 'GET', // *GET, POST, PUT, DELETE, etc.
      credentials: 'include', // include, *same-origin, omit
      headers: {
      'Content-Type': 'application/json'
    }}).then(response=>response.json()).then(response=> {
      setLoadingList(false);
      if(response.history){
          setHistoryList(response.history);
      }
    });
  }
  return (
    <React.Fragment>
      <ProcessingRequest active={asyncResponse}/>

      {petition?
        <React.Fragment>
          <div className="links">
            <Link to="/home">{strings.link_home}</Link>
            <span className="link-seperator">/</span>
            <Link to="/petitions">{strings.link_petitions}</Link>
            <span className="link-seperator">/</span>
            <span className="fake-link" onClick={()=>{setPetition(null);}}>{strings.history_title}</span>
            <span className="link-seperator">/</span>
            {strings.history_view_state}
          </div>
          <Alert variant='warning' className='form-alert'>
            {strings.history_info_1} {stateProps[0]==='create'?strings.registration:stateProps[0]==='edit'?strings.reconfiguration:strings.deregistration} {strings.history_info_2}{stateProps[1]==='approved'?strings.history_info_approved:stateProps[1]==='rejected'?strings.history_info_rejected:stateProps[1]==='pending'?strings.history_info_pending:strings.history_info_changes}.
          </Alert>
          {stateProps[2]?
            <Jumbotron fluid className="jumbotron-comment">
              <Container>
                <h5>{strings.history_commend}</h5>
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
            <Link to="/home">{strings.link_home}</Link>
            <span className="link-seperator">/</span>
            <Link to="/petitions">{strings.history_title}</Link>
            <span className="link-seperator">/</span>
            {strings.history_title}
          </div>
          <Table striped bordered hover className="history-table">
            <thead>
              <tr>
                <td>{strings.history_td_date}</td>
                <td>{strings.history_td_type}</td>
                <td>{strings.history_td_status}</td>
                <td></td>
              </tr>
            </thead>
            <tbody>
              {historyList?historyList.map((item,index)=>{
                return(
                <tr key={index}>
                  <td>{item.reviewed_at?item.reviewed_at.slice(0,10).split('-').join('/'):strings.history_not_reviewed}</td>
                  <td><Badge className="status-badge" variant='info'>{item.type==="create"?strings.registration:item.type==="edit"?strings.reconfiguration:strings.deregistration} {strings.history_info_2}</Badge></td>
                  <td><Badge className="status-badge" variant={item.status==="pending"?'warning':item.status==="reject"?'danger':'success'}>{item.status}</Badge></td>
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
