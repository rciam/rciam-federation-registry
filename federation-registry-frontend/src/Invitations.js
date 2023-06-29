import React,{useState,useEffect} from 'react';
import {useParams} from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import config from './config.json';
import Button from 'react-bootstrap/Button';
import {Logout,NotFound} from './Components/Modals';
import {ProcessingRequest,LoadingBar} from './Components/LoadingBar';
import Col from 'react-bootstrap/Col';
import Row from 'react-bootstrap/Row';


const InvitationsPage = (props) => {
  // eslint-disable-next-line
  const reg = /^((([a-z]|\d|[!#\$%&'\*\+\-\/=\?\^_`{\|}~]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])+(\.([a-z]|\d|[!#\$%&'\*\+\-\/=\?\^_`{\|}~]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])+)*)|((\x22)((((\x20|\x09)*(\x0d\x0a))?(\x20|\x09)+)?(([\x01-\x08\x0b\x0c\x0e-\x1f\x7f]|\x21|[\x23-\x5b]|[\x5d-\x7e]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(\\([\x01-\x09\x0b\x0c\x0d-\x7f]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF]))))*(((\x20|\x09)*(\x0d\x0a))?(\x20|\x09)+)?(\x22)))@((([a-z]|\d|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(([a-z]|\d|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])*([a-z]|\d|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])))\.)+(([a-z]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(([a-z]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])*([a-z]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])))$/

  useEffect(()=>{
    localStorage.removeItem('url');
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
  const [notFound,setNotFound] = useState(false);
  // eslint-disable-next-line
  const { t, i18n } = useTranslation();


  const getInvitations = () => {
    setLoading(true)
    fetch(config.host[tenant_name]+'tenants/'+tenant_name+'/invitations', {
      method: 'GET', // *GET, POST, PUT, DELETE, etc.
      credentials: 'include', // include, *same-origin, omit
      headers: {
      'Content-Type': 'application/json'
    }}).then(response=>{
      if(response.status===200){
        return response.json();
      }
      else if(response.status===401){
        setLogout(true);
        return false;
      }
      else if(response.status===404){
        setNotFound(true);
        return false;
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
    fetch(config.host[tenant_name]+'tenants/'+tenant_name+'/invitations/'+id+'/'+action, {
      method: 'PUT', // *GET, POST, PUT, DELETE, etc.
      credentials: 'include', // include, *same-origin, omit
      headers: {
        'Content-Type': 'application/json'
      }
    }).then(
      response =>
      {
        if(response.status===200){
          return true
        }
        else if(response.status===401){
          setLogout(true);
          return false;
        }
        else if(response.status===404){
          setNotFound(true);
          return false;
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
      <NotFound notFound={notFound}/>
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

                  <div className="justify-content-center align-self-center"><h3> You have been invited by <span className="fake-link"><a href={reg.test(String(invitation.invited_by).toLowerCase())?"mailto: "+invitation.invited_by:null}>{invitation.invited_by}</a></span> to manage a service named: {invitation.service_name?invitation.service_name:'Name not yet defined'}</h3> </div>
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
