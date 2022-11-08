import React,{useState, useEffect} from 'react';
import {useParams} from "react-router-dom";
import config from '../config.json';
import {LoadingPage} from './LoadingPage.js';

export const Callback = () => {
  // eslint-disable-next-line
  let {tenant_name} = useParams();
  let {code} = useParams();
  const [loading,setLoading] = useState(true);




  useEffect(()=>{
    getToken(code);
    // eslint-disable-next-line
  },[]);

  const getToken = (code)=>{
    fetch(config.host[tenant_name]+'tokens/'+code,{
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
        setLoading(false);
      }
    });
  }
  return (
    <React.Fragment>
      <LoadingPage loading={loading} tenant_name={tenant_name} redirect={"/"+tenant_name+"/home"}/>
    </React.Fragment>
  )
}
