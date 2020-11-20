import React,{useState, useEffect} from 'react';
import {useParams} from "react-router-dom";
import {LoadingPage} from './LoadingPage.js';

export const InvitationRoute = () => {
  // eslint-disable-next-line
  let {code} = useParams();
  let {tenant_name} = useParams();
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
      <LoadingPage loading={loading} tenant_name={tenant_name}/>
    </React.Fragment>
  )
}



export const InvitationNotFound = (props) => {
  return (
    <div className="home-container">
      <h1>Invitation {props.error==='expired'?'has expired':props.error==='member'?'invalid':'not found...'}</h1>
      <p>We are sorry but {props.error==='expired'?' the invitation link has expired, new invitations can be issued by service owners.':props.error==='member'?' you cannot accept the invitation because you are already a member of the owners group.':' there was no invitation found, invitation link is invalid, new invitations can be issued by service owners.'}   </p>
    </div>
  )
}
