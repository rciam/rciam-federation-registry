import React,{useState,useEffect} from 'react';

import { useTranslation } from 'react-i18next';
import * as config from './config.json';
import Button from 'react-bootstrap/Button';
import {ProcessingRequest} from './Components/LoadingBar';
import Col from 'react-bootstrap/Col';
import Row from 'react-bootstrap/Row';


const InvitationsPage = (props) => {
  useEffect(()=>{
    setInvitations(props.invitations);

    // eslint-disable-next-line react-hooks/exhaustive-deps
  },[]);

  const [sending,setSending] = useState();
  const [invitations,setInvitations] = useState([]);

  // eslint-disable-next-line
  const { t, i18n } = useTranslation();




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
        invitations.foreach((invitation,index)=>{
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
      <ProcessingRequest active={sending}/>
      {invitations?
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
        :null}

    </React.Fragment>
  )
}
export default InvitationsPage;
