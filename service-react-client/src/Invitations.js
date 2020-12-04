import React,{useState,useEffect} from 'react';
import {useParams} from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import * as config from './config.json';
import Button from 'react-bootstrap/Button';
import {Logout} from './Components/Modals';
import {ProcessingRequest,LoadingBar} from './Components/LoadingBar';
import Col from 'react-bootstrap/Col';
import Row from 'react-bootstrap/Row';


const InvitationsPage = (props) => {
  useEffect(()=>{

    if(props.invitations){
      setInvitations(props.invitations);
    }
    else {
      getInvitations()
    }

    // eslint-disable-next-line react-hooks/exhaustive-deps
  },[]);

  let {tenant_name} = useParams();
  const [logout,setLogout] = useState(false);
  const [sending,setSending] = useState();
  const [invitations,setInvitations] = useState([]);
  const [loading,setLoading] = useState(false);

  // eslint-disable-next-line
  const { t, i18n } = useTranslation();


  const getInvitations = () => {
    setLoading(true)
    fetch(config.host+'tenants/'+tenant_name+'/invitations', {
      method: 'GET', // *GET, POST, PUT, DELETE, etc.
      credentials: 'include', // include, *same-origin, omit
      headers: {
      'Content-Type': 'application/json',
      'Authorization': localStorage.getItem('token')
    }}).then(response=>{
      if(response.status===200){
        return response.json();
      }
      else if(response.status===401){
        setLogout(true);
      }
      else {
        return false
      }
    }).then(response=> {
        if(response){
          setInvitations(response);
        }
        else{
          setInvitations([]);
        }
        setLoading(false);
      });
  }

  const invitationResponse =  (id,action) => {
    setSending(true);
    fetch(config.host+'tenants/'+tenant_name+'/invitations/'+id+'/'+action, {
      method: 'PUT', // *GET, POST, PUT, DELETE, etc.
      credentials: 'include', // include, *same-origin, omit
      headers: {
        'Content-Type': 'application/json',
        'Authorization': localStorage.getItem('token')
      }
    }).then(
      response =>
      {
        if(response.status===200){
          return true
        }
        else if(response.status===401){
          setLogout(true);
        }
        else {
          return false
        }
      }
    ).then(response=> {
      if(response){
        let new_invitations = [];
        invitations.forEach((invitation,index)=>{
          if(invitation.id!==id){
            new_invitations.push(invitation);
          }
        })

        setInvitations(new_invitations);
      }
      setSending(false);
    });

  }

  return(
    <React.Fragment>
      <Logout logout={logout}/>
      <LoadingBar loading={loading}>
        <ProcessingRequest active={sending}/>
        {invitations.length>0?
          <React.Fragment>
           {invitations.map((invitation,index)=>{
             return(

               <div key={index} className='invitation-container'>
                <Row >
                  <Col className="d-flex">
                    <div className="justify-content-center align-self-center"><h3> You have been invited by <a href={"mailto: "+invitation.invited_by}>{invitation.invited_by}</a> to manage a service named: {invitation.service_name}</h3> </div>

                  </Col>
                  <Col md="auto" className="d-flex">
                    <div className="justify-content-center align-self-center">
                      <Button variant="success" onClick={()=>{invitationResponse(invitation.id,'accept')}} >{t('invitations_accept')}</Button>
                      <Button variant="danger" onClick={()=>{invitationResponse(invitation.id,'decline')}} >{t('invitations_decline')}</Button>
                    </div>
                  </Col>
                </Row>
               </div>
             )
           })}
          </React.Fragment>
          :
          <React.Fragment>
            <div className='invitation-container'>
              <h3>
                No invitations pending ...
              </h3>
            </div>
          </React.Fragment>
        }
  `   </LoadingBar>
    </React.Fragment>
  )
}
export default InvitationsPage;
