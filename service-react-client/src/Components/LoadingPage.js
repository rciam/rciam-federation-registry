import React,{useState, useEffect} from 'react';
import {useParams,Redirect} from "react-router-dom";
import Spinner from 'react-bootstrap/Spinner';
import * as config from '../config.json';

export const LoadingPage = () => {
  // eslint-disable-next-line
  let {code} = useParams();
  const [done,setDone] = useState(false);

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
        setDone(true);
      }
    });
  }
  return (
    <React.Fragment>

      <div className="loading-page">
        {done?<Redirect to='/'/>:<Spinner animation="border" variant="primary" />}
      </div>
    </React.Fragment>
  )
}
