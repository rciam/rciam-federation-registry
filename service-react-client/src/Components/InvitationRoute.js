import React,{useState, useEffect} from 'react';
import {useParams,Redirect} from "react-router-dom";
import Spinner from 'react-bootstrap/Spinner';

export const InvitationRoute = () => {
  // eslint-disable-next-line
  let {code} = useParams();
  const [loading,setLoading] = useState(true);


  useEffect(()=>{
    setInvitationToken(code);
    // eslint-disable-next-line
  },[]);

  const setInvitationToken = (code)=>{
    localStorage.setItem('invitation',code);
    setLoading(false);

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
