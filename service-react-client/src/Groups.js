import React,{useState,useEffect} from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {faCheckSquare,faBan} from '@fortawesome/free-solid-svg-icons';
import { useTranslation } from 'react-i18next';
import Form from 'react-bootstrap/Form';
import * as config from './config.json';
import InputGroup from 'react-bootstrap/InputGroup';
import Button from 'react-bootstrap/Button';
import Table from 'react-bootstrap/Table';
import Row from 'react-bootstrap/Row';
import {LoadingBar,ProcessingRequest} from './Components/LoadingBar';
import Badge from 'react-bootstrap/Badge';
import * as yup from 'yup';
import Alert from 'react-bootstrap/Alert';






const GroupsPage = (props) => {
  useEffect(()=>{
    getData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  },[]);
  const getData = () => {
    getGroupMembers(props.group_id);
  }


  const getGroupMembers = (group_id) => {
    setLoading(true);
    fetch(config.host+'group/'+group_id, {
      method: 'GET', // *GET, POST, PUT, DELETE, etc.
      credentials: 'include', // include, *same-origin, omit
      headers: {
      'Content-Type': 'application/json',
      'Authorization': localStorage.getItem('token')
      }}).then(response=>{
          if(response.status===200){
            return response.json();
          }
          else {return false}
        }).then(response=> {
        if(response){
          let count = 0;
          response.group_members.forEach((member, i) => {
            if(member.group_manager&&!member.pending){
              count = count +1;
            }
          });
          setGroupManagers(count);
          setGroup(response.group_members);
          setLoading(false);
        }
    });
  }

  const cancelInvitation = (id,group_id)=>{
    setSending(true);
    fetch(config.host+'invitation/cancel/'+id, {
      method: 'PUT', // *GET, POST, PUT, DELETE, etc.
      credentials: 'include', // include, *same-origin, omit
      headers: {
        'Content-Type': 'application/json',
        'Authorization': localStorage.getItem('token')
      },
      body:JSON.stringify({group_id:group_id})
    }).then(response=> {
      setSending(false);
      getData()
    });
  }


  const sendInvitation = (invitation,setSending,setInvitationResult) => {
    setSending(true);
    fetch(config.host+'invitation', {
      method: 'POST', // *GET, POST, PUT, DELETE, etc.
      credentials: 'include', // include, *same-origin, omit
      headers: {
        'Content-Type': 'application/json',
        'Authorization': localStorage.getItem('token')
      },
      body:JSON.stringify(invitation)
    }).then(response=> {
      setSending(false);

      setInvitationResult({success:(response.status===200)?true:false,email:invitation.email});
      getData();
    });
  }

  const removeMember = (sub,group_id) => {
    setSending(true);
    fetch(config.host+'group/remove_member', {
      method: 'PUT', // *GET, POST, PUT, DELETE, etc.
      credentials: 'include', // include, *same-origin, omit
      headers: {
        'Content-Type': 'application/json',
        'Authorization': localStorage.getItem('token')
      },
      body:JSON.stringify({sub:sub,group_id:group_id})
    }).then(response=> {
      setSending(false);
      getData()
    });
  }

  const [group_managers,setGroupManagers] = useState();
  const [invitationResult,setInvitationResult] = useState();
  const [sending,setSending] = useState();
  const [loading,setLoading] = useState();
  const [group,setGroup] = useState([]);
  const [email,setEmail] = useState('');
  const [role,setRole] = useState('member');

  const [error,setError] = useState('');
  // eslint-disable-next-line
  const { t, i18n } = useTranslation();
  let schema = yup.object({
    email:yup.string().email(t('yup_email')).required(t('yup_contact_empty')),
    role:yup.string().test('testRole','Select a role',function(value){return ['member','manager'].includes(value)}).required('Select a role')
  });
  const checkError = async () => {
    setError('');
    return await schema.validate({email:email,role:role}).then(()=>{return true}).catch(function(value){
      setError(value.errors[0]);
      return false;
    });
  }


  const sendInvite = async () => {
        let test = await checkError();
        if(test){
          sendInvitation({email:email,group_manager:(role==='manager'),group_id:props.group_id},setSending,setInvitationResult);
        }
  }


  return(
    <React.Fragment>
      <ProcessingRequest active={sending}/>
      <LoadingBar loading={loading}>
      <h3 className="group_title">Group Members</h3>
      <Table striped bordered hover size='sm' className="groups-table">
        <thead>
          <tr>
            <th>{t('username')}</th>
            <th>Email</th>
            <th>{t('is_group_manager')}</th>
            <th>{t('group_status')}</th>
            {props.group_manager==='true'?<th>Action</th>:null}
          </tr>
        </thead>
        <tbody>
        {group.map((user,index)=>{
          return (
            <tr key={index}>
              <td>{user.username}</td>
              <td>{user.email}</td>
              <td>{user.group_manager?<FontAwesomeIcon icon={faCheckSquare}/>:null}</td>
              <td>{user.pending?<Badge variant="warning">{t('pending')}</Badge>:<Badge variant="primary">{t('active')}</Badge>}</td>
              {props.group_manager==='true'?<td>
              <Button
                variant="danger"
                onClick={()=>{if(user.pending){cancelInvitation(user.invitation_id,user.group_id)}else{removeMember(user.sub,user.group_id)} }}
                disabled={group.length<1||(group_managers<2&&user.group_manager)}
              >
                <FontAwesomeIcon icon={faBan} />
              </Button></td>:null}
            </tr>
          )
        })}
        </tbody>
      </Table>
      {invitationResult?
        <Alert variant={invitationResult.success?'success':'danger'}>
          {invitationResult.success?t('invitation_success'):t('invitation_error')}{invitationResult.email}
        </Alert>:null
      }
      {props.group_manager==='true'?
        <React.Fragment>
          <h3 className="group_title">Send Invites</h3>
          <Row className="group_invite_row">
            <InputGroup className={error?'invalid-input mb-3':'mb-3'}>
              <Form.Control
                value={email}
                onChange={(e)=>{setEmail(e.target.value);}}
                onFocus={()=>{setInvitationResult(null);}}
                onBlur={()=>{checkError();}}
                column="true"
                lg='2'
                type="text"
                className='col-form-label.sm'
                placeholder={t('yup_email')}
              />
              <InputGroup.Prepend>
                  <Form.Control as="select" value={role} className="input-hide" onChange={(e)=>{
                    setRole(e.target.value)
                  }}>
                    <option key='member' value='member'>{t('group_member')}</option>
                      <option key='manager' value='manager'>{t('group_manager')}</option>
                  </Form.Control>
              </InputGroup.Prepend>
              <InputGroup.Prepend>
                  <Button
                    variant="outline-primary"
                    onClick={()=>{
                      sendInvite();
                    }}
                  >
                    {t('group_send_invitation')}
                  </Button>
              </InputGroup.Prepend>
            </InputGroup>
          </Row>
          <div className='invitation-error'>
            {error}
          </div>
        </React.Fragment>
      :null}


      </LoadingBar>
    </React.Fragment>
  )
}
export default GroupsPage;
