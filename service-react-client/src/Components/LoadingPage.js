import React,{useState, useEffect} from 'react';
import {useParams,Redirect} from "react-router-dom";
import Spinner from 'react-bootstrap/Spinner';
import * as config from '../config.json';

export const CallbackPage = () => {
  // eslint-disable-next-line
  let {code} = useParams();
  const [loading,setLoading] = useState(true);

  useEffect(()=>{
    getToken(code);
    // eslint-disable-next-line
  },[]);

  const getToken = (code)=>{
    console.log('we make request');
    fetch(config.host+'token/'+code,{
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
      console.log(response);
      if(response){
        localStorage.setItem('token','Bearer '+response.token);
        setLoading(false);
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
