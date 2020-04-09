import React,{useEffect,useState} from 'react';
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


export const HistoryList = (props) => {
  const [loadingList,setLoadingList] = useState();
  const [historyList,setHistoryList] = useState();
  const [asyncResponse,setAsyncResponse] = useState(false);
  const [petition,setPetition] = useState(null);
  const [stateProps,setstateProps] = useState();

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
      if(response){
        setAsyncResponse(false);
        if(response.success){
          setPetition(response.petition);
        }
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
        if(response.success){
          setLoadingList(false);
          if(response.history){
              setHistoryList(response.history);
          }
        }
      });



  }
  return (
    <React.Fragment>
      <ProcessingRequest active={asyncResponse}/>

      {petition?
        <React.Fragment>
          <div className="links">
            <Link to="/home">Home</Link>
            <span className="link-seperator">/</span>
            <Link to="/petitions">Manage Services</Link>
            <span className="link-seperator">/</span>
            <span className="fake-link" onClick={()=>{setPetition(null);}}>Service History</span>
            <span className="link-seperator">/</span>
            View State
          </div>
          <Alert variant='warning' className='form-alert'>
            The following {stateProps[0]==='create'?'Creation':stateProps[0]==='edit'?'Reconfiguration':'Deregistration'} Request {stateProps[1]==='approved'?'was Approved':stateProps[1]==='reject'?'was Rejected':stateProps[1]==='pending'?'is Pending Review':'was Aprroved with Changes'}.
          </Alert>
          {stateProps[2]?
            <Jumbotron fluid className="jumbotron-comment">
              <Container>
                <h5>Comment from admin:</h5>
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
            <Link to="/home">Home</Link>
            <span className="link-seperator">/</span>
            <Link to="/petitions">Manage Services</Link>
            <span className="link-seperator">/</span>
            Service History
          </div>
          <Table striped bordered hover className="history-table">
            <thead>
              <tr>
                <td>Date</td>
                <td>Type of Request</td>
                <td>Review Status</td>
                <td></td>
              </tr>
            </thead>
            <tbody>
              {historyList?historyList.map((item,index)=>{
                return(
                <tr key={index}>
                  <td>{item.reviewed_at?item.reviewed_at.slice(0,10).split('-').join('/'):'Not yet reviewed'}</td>
                  <td><Badge className="status-badge" variant='info'>{item.type==="create"?"Creation":item.type==="edit"?"Reconfiguration":"Deregistration"} Request</Badge></td>
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

export const HistoryView = (props) => {
  return (
    <h1>hello guys</h1>
  )
}
