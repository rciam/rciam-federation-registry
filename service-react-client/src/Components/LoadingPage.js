import React,{useState, useEffect} from 'react';
import {useParams,Redirect} from "react-router-dom";
import Spinner from 'react-bootstrap/Spinner';
import * as config from '../config.json';
import useGlobalState from '../useGlobalState.js';

export const CallbackPage = () => {
  // eslint-disable-next-line
  let {code} = useParams();
  const [loading,setLoading] = useState(true);
  const globalState = useGlobalState();

  useEffect(()=>{
    getToken(code);

    // eslint-disable-next-line
  },[]);

  const getToken = (code)=>{
    fetch(config.host+'tokens/'+code,{
      method:'GET',
      credentials:'include',
      headers:{
        'Content-Type': 'application/json'
      }
    }).then(response => {
      if(response.status===200){
        return response.json();
      }
      else {
        return false
      }
    }).then(response=>{
      if(response){
        localStorage.setItem('token','Bearer '+response.token);
        globalState.setLogState({
          tenant:'EGI',
          log_state:true
        });
        setTimeout(function(){
          setLoading(false);

      }, 1000);
      }
    });
  }
  return (
    <React.Fragment>
      <LoadingPage loading={loading}/>
    </React.Fragment>
  )
}

export const LoadingPage = (props) => {
  return (
    <div className="loading-page">
      {props.loading?<Spinner animation="border" variant="primary" />:<Redirect to='/'/>}
    </div>
  )
}
