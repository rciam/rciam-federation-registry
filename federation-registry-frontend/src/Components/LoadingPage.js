import React,{useEffect} from 'react';
import Spinner from 'react-bootstrap/Spinner';
import {useHistory} from "react-router-dom";



export const LoadingPage = (props) => {
  const history = useHistory();

  useEffect(()=>{
    if(!props.loading){
      history.push(props.redirect_url?props.redirect_url:"/"+props.tenant_name+'/home');    
      history.go();  
    }
    // eslint-disable-next-line
  },[props.loading]);

  return (
    <div className="loading-page">
      <Spinner animation="border" variant="primary" />
    </div>
  )
}
