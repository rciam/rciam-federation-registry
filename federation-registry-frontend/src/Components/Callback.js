import React,{useState, useEffect} from 'react';
import {useParams} from "react-router-dom";
import * as config from '../config.json';
import useGlobalState from '../useGlobalState.js';
import {LoadingPage} from './LoadingPage.js';

export const Callback = () => {
  // eslint-disable-next-line
  let {tenant_name} = useParams();
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
          log_state:true
        });
        setLoading(false);

      }
    });
  }
  return (
    <React.Fragment>
      <LoadingPage loading={loading} tenant_name={tenant_name}/>
    </React.Fragment>
  )
}
