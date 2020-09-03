import React,{useState,useEffect} from 'react';

import { useTranslation } from 'react-i18next';
import * as config from './config.json';
import Button from 'react-bootstrap/Button';
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


  const [sending,setSending] = useState();
  const [invitations,setInvitations] = useState([]);
  const [loading,setLoading] = useState(false);

  // eslint-disable-next-line
  const { t, i18n } = useTranslation();


  const getInvitations = () => {
    setLoading(true)
    fetch(config.host+'invitation', {
      method: 'GET', // *GET, POST, PUT, DELETE, etc.
      credentials: 'include', // include, *same-origin, omit
      headers: {
      'Content-Type': 'application/json',
      'Authorization': localStorage.getItem('token')
    }}).then(response=>{
      if(response.status===200){
        return response.json();
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
    fetch(config.host+'invitation/'+action+'/'+id, {
      method: 'PUT', // *GET, POST, PUT, DELETE, etc.
      credentials: 'include', // include, *same-origin, omit
      headers: {
        'Content-Type': 'application/json',
        'Authorization': localStorage.getItem('token')
      }
    }).then(response=> {
      if(response.status===200){
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
      <LoadingBar loading={loading}>
        <ProcessingRequest active={sending}/>
        {invitations.length>0?
          <React.Fragment>
           {invitations.map((invitation,index)=>{
             return(

               <div key={index} className='invitation-container'>
                <Row>
                  <Col>
                    <h3 className="align-middle"> You have been invited by <a href={"mailto: "+invitation.invited_by}>{invitation.invited_by}</a> to participate in his group</h3>
                  </Col>
                  <Col md="auto">
                    <div>
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
