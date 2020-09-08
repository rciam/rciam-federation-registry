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



export const InvitationNotFound = (props) => {
  useEffect(()=>{
    console.log(props);
  },[props])
  return (
    <div className="home-container">
      <h1>Invitation {props.expired?'has expired':'not found...'}</h1>
      <p>We are sorry but {props.expired?' the invitation link has expired, ':' there was no invitation found, invitation link is invalid, '}   new invitations can be issued by service owners.</p>
    </div>
  )
}



export const LoadingPage = (props) => {
  return (
    <div className="loading-page">
      {props.loading?<Spinner animation="border" variant="primary" />:<Redirect to='/'/>}
    </div>
  )
}
