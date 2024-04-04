import React,{useEffect,useState,useContext} from 'react';
import config from '../config.json';
import Button from 'react-bootstrap/Button';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {faPaperPlane,faEnvelope} from '@fortawesome/free-solid-svg-icons';
import {useParams} from "react-router-dom";
import { useTranslation } from 'react-i18next';
import {tenantContext} from '../context.js';
import Col from 'react-bootstrap/esm/Col';
import Row from 'react-bootstrap/esm/Row';
import {Formik} from 'formik';
import Form from 'react-bootstrap/Form';
import * as yup from 'yup';
import {ResponseModal,Logout,ConfirmationModal,SimpleModal} from './Modals.js';
//  import {Debug} from './Debug.js';

 const Error = (props) =>{
  return (
     <React.Fragment>
       {!props.error||!props.show?null:Array.isArray(props.error)?props.error.forEach(error=>{
          <div className={'notifications-error' + (props.possition==='up'?' notifications-error-up':'')}>{error}</div>
       }):<div className='notifications-error'>{props.error}</div>}
     </React.Fragment>
   )
 }
const BroadcastNotifications = (props) =>{
  let {tenant_name,group_id,service_id,petition_id} = useParams();
  const [formValues,setFormValues] = useState();
  const [tenant] = useContext(tenantContext);


  let initialValues_broadcast = {
    environments:[],
    contact_types:["technical"],
    cc_emails:[],
    name:"",
    email_address:"",
    email_subject:"",
    email_body:"",
    notify_admins:"false",
    protocols: ['oidc','saml']
  }
  let initialValues_owners = {
    cc_emails:[],
    name:"",
    email_address:"",
    email_subject:"",
    email_body:"",
    recipients: [],
    service_id: service_id,
    petition_id: petition_id 
  }

  useEffect(()=>{
    if(props.type==="broadcast"){
      initialValues_broadcast.environments = tenant.form_config.integration_environment[0];
      getRecipients({contact_types:initialValues_broadcast.contact_types,environments:initialValues_broadcast.environments,protocols:initialValues_broadcast.protocols});
      setFormValues(initialValues_broadcast);
    }
    else if(props.type==="owners"){
      getOwners();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  },[]);
  
  const [hasSubmitted,setHasSubmitted] = useState(false);
  const [logout,setLogout] = useState(false);
  // eslint-disable-next-line
  const { t, i18n } = useTranslation();
  const [responseTitle,setResponseTitle] = useState();
  const [responseMessage,setResponseMessage] = useState();
  const [recipients,setRecipients] = useState([]);
  const [confirmationData,setConfirmationData] = useState({active:false}) 

  const owner_schema = yup.object({
    name :yup.string().nullable().min(4,t('yup_char_min') + ' ('+4+')').max(360,t('yup_char_max') + ' ('+360+')').required(t('yup_required')),
    email_body: yup.string().nullable().min(4,t('yup_char_min') + ' ('+4+')').max(32000 ,t('yup_char_max') + ' ('+32000 +')').required(t('yup_required')),
    cc_emails: yup.array().nullable().of(yup.string().email(object=>{return object.value})),
    recipients: yup.array().nullable().of(yup.string().email(object=>{return object.value})),
    email_address: yup.string().nullable().email((object)=>{return object.value + ' is not a valid email address'}).required(t('yup_required')),
    email_subject: yup.string().nullable().min(4,t('yup_char_min') + ' ('+4+')').max(998,t('yup_char_max') + ' ('+998+')').required(t('yup_required')),
  });
  const broadcast_schema = yup.object({
    name :yup.string().nullable().min(4,t('yup_char_min') + ' ('+4+')').max(360,t('yup_char_max') + ' ('+360+')').required(t('yup_required')),
    email_body: yup.string().nullable().min(4,t('yup_char_min') + ' ('+4+')').max(32000 ,t('yup_char_max') + ' ('+32000 +')').required(t('yup_required')),
    cc_emails: yup.array().nullable().of(yup.string().email(object=>{return object.value})),
    email_subject: yup.string().nullable().min(4,t('yup_char_min') + ' ('+4+')').max(998,t('yup_char_max') + ' ('+998+')').required(t('yup_required')),
    notify_admins: yup.boolean().nullable().required(t('yup_required')),
    email_address: yup.string().nullable().email((object)=>{return object.value + ' is not a valid email address'}).required(t('yup_required')),
    contact_types: yup.array().nullable().min(1,t('yup_select_option')).of(yup.string().test("Test contact types","Pleace select one of the available options",function(contact_type){
      if(tenant&&tenant.form_config.contact_types.includes(contact_type)){
        return true
      }
      else{
        return false;
      }
    })),
    environments: yup.array().nullable().min(1,t('yup_select_option')).of(yup.string().test("Test environments","Pleace select one of the available options",function(environment){
      if(tenant&&tenant.form_config.integration_environment.includes(environment)){
        return true
      }
      else{
        return false;
      }
    }))

    })

  const sendOwnerNotification = (values) =>{
    values.email_body =  values.email_body.replace(/\/\*[\s\S]*?\*\//g,'');
    values.email_body =  values.email_body.replace(/((\n)|(\\n)|( *\\n)|( *\n)){3,}/g,'\n\n');
    fetch(config.host[tenant_name]+'tenants/'+tenant_name+'/notifications/owners', {
      method: 'PUT', // *GET, POST, PUT, DELETE, etc.
      credentials: 'include', // include, *same-origin, omit
      headers: {
      'Content-Type': 'application/json'
      },
      body: JSON.stringify(values)
    }).then(response=>{
        if(response.status===200){
          return true;
        }
        else if(response.status===401){
          setLogout(true);
          return false;
        }
        else {
          setRecipients([])
          return false
        }
      }).then(response=> {
      if(response){
        
        setResponseTitle('Thank your for submitting your request.');

        if(response){
          setResponseMessage("Notification was successfully sent.");
        }
        else{
          setResponseMessage('We could not send the notification, please try again');
        }
      }
    });
  }

  const getOwners = () => {
    fetch(config.host[tenant_name]+'tenants/'+tenant_name+'/groups/'+group_id+'/members', {
      method: 'GET', // *GET, POST, PUT, DELETE, etc.
      credentials: 'include', // include, *same-origin, omit
      headers: {
      'Content-Type': 'application/json'
      }
    }).then(response=>{
        if(response.status===200){
          return response.json();
        }
        else if(response.status===401){
          setLogout(true);
          return false;
        }
        else {
          setRecipients([])
          return false
        }
      }).then(response=> {
      if(response){
        let owner_emails = [];
        if(response.group_members.length>0){
          response.group_members.forEach(member=>{
            owner_emails.push(member.email);
          })
        }
        initialValues_owners.recipients = owner_emails;
        initialValues_owners.email_body ="Dear Service Owners \n \n /* Comments will be Removed Automatically */ \n/* Write Your Message Here */\n\n\n/* Leave the Following line to include a  button with a link to the Reconfiguration Page*/\n --* Reconfiguration Link *--\n\n /* Write Your Closing Here */"
        setFormValues(initialValues_owners);
      }
    });
  }
  const getRecipients = (data) => {
    fetch(config.host[tenant_name]+'tenants/'+tenant_name+'/notifications/broadcast/recipients?contact_types='+data.contact_types+'&environments='+data.environments+'&protocols='+data.protocols, {
      method: 'GET', // *GET, POST, PUT, DELETE, etc.
      credentials: 'include', // include, *same-origin, omit
      headers: {
      'Content-Type': 'application/json'
      }
    }).then(response=>{
        if(response.status===200){
          return response.json();
        }
        else if(response.status===401){
          setLogout(true);
          return false;
        }
        else {
          setRecipients([])
          return false
        }
      }).then(response=> {
      if(response){
        setRecipients(response);
      }
    });
  }

  const sendNotification = (notification)=> {
    fetch(config.host[tenant_name]+'tenants/'+tenant_name+'/notifications/broadcast', {
      method: 'PUT', // *GET, POST, PUT, DELETE, etc.
      credentials: 'include', // include, *same-origin, omit
      headers: {
      'Content-Type': 'application/json'
      },
      body: JSON.stringify(notification)
    }).then(response=>{
        if(response.status===200){
          return response.json();
        }
        else if(response.status===401){
          // setLogout(true);
          return false;
        }
        else if(response.status===404){
          // setNotFound(true);
          return false;
        }
        else {
          return false
        }
      }).then(response=> {
      if(response){
        setResponseTitle('Thank your for submitting your request.')
        if(response&&response.notified_users>0){
          setResponseMessage('Your notification message was succesfully sent to ' + response.notified_users + ' users.');
        }
        else if(response&&response.notified_users===0){
          setResponseMessage('We could not find any users matching the criteria you provided');          
        }
        else{
          setResponseMessage('We could not send the notification, please try again');
        }
      }
    });
  }

  return (        
  <React.Fragment>
      <Row className="notifications-main-row">
        <Logout logout={logout}/>
        <ResponseModal return_url={'/'+tenant_name+'/home'} message={responseMessage} modalTitle={responseTitle}/>
        {formValues?
          <Formik
            initialValues={formValues}
            validationSchema={props.type==='broadcast'?broadcast_schema:props.type==='owners'?owner_schema:null}
          onSubmit={(values,{setSubmitting}) => {
            setHasSubmitted(true);
            setConfirmationData({active:true})
          }}
          >
            {({
          handleSubmit,
          handleChange,
          submitForm,
          handleBlur,
          values,
          setFieldValue,
          setFieldTouched,
          setTouched,
          touched,
          isValid,
          validateField,
          validateForm,
          setValues,
          setErrors,
          submitCount,
          errors,
          isSubmitting})=>(
            <React.Fragment>
              <Form noValidate onSubmit={handleSubmit}>
              {props.type==="broadcast"?
                <Col className="notifications-left-col" sm="4">
                  <h1>Recipients</h1>
                  <div className="notifications-help">Select the type(s) of the contacts that will receive the notification</div>
                  <hr/>
                  <hr/>
                  <Row className="recipients-container">
                    <div>
                      <FontAwesomeIcon icon={faEnvelope}/>
                    </div>
                    <Button disabled={true}>Number of Recipients: {recipients.length}</Button>
                  </Row>
                  
                  <h3>Contact Types</h3>
                  <hr/>
                  <Form.Check
                    name="all_contacts"
                    label="All Contact Types"
                    checked={values.contact_types.length===tenant.form_config.contact_types.length}
                    disabled={false}
                    onChange={(e)=>{
                      setFieldTouched('contact_types');
                      if(e.target.checked){
                        setFieldValue('contact_types',[...tenant.form_config.contact_types])
                        getRecipients({contact_types:[...tenant.form_config.contact_types],environments:values.environments,protocols:values.protocols});
  
                      }
                      else{
                        setFieldValue('contact_types',[])
                        setRecipients([]);
                      }
                    }}
                    className={"col-form-label checkbox"}
                  />
                  
                  
                  {tenant.form_config.contact_types.map((contact_type,index)=>{
                    return(
                        <Form.Check
                        name={contact_type}
                        label={capitalWords([contact_type])}
                        checked={values.contact_types.includes(contact_type)}
                        disabled={false}
                        key={index}
                        onChange={(e)=>{
                          let contact_types = values.contact_types
                          if(e.target.checked){
                            contact_types.push(e.target.name);
                          }
                          else{
                            removeItemOnce(contact_types,e.target.name);
                          }
                          setFieldTouched('contact_types');
                          getRecipients({contact_types:contact_types,environments:values.environments,protocols:values.protocols});
                          setFieldValue('contact_types',contact_types);
                        }}
                        className={"col-form-label checkbox"}
                      />
                    )
                  })}
                  <Error error={errors.contact_types} show={hasSubmitted||touched.contact_types} />
          
                  <hr/>
                  <h3>Select Service Protocol</h3>
                  <div className="notifications-help">Only service contacts of the selected protocol will receive the notification</div>
                  <hr/>
                  <Form.Check
                        name='oidc'
                        label='OIDC'
                        checked={values.protocols.includes('oidc')}
                        disabled={false}
                        onChange={(e)=>{
                          let protocols = values.protocols
                          if(e.target.checked){
                            protocols.push(e.target.name);
                          }
                          else{
                            removeItemOnce(protocols,e.target.name);
                          }
                          setFieldValue('protocols',protocols);
                          getRecipients({contact_types:values.contact_types,environments:values.environments,protocols:protocols});
                          setFieldTouched('protocols')                    
                        }}
                        className={"col-form-label checkbox"}
                      />
                  <Form.Check
                        name='saml'
                        label='SAML'
                        checked={values.protocols.includes('saml')}
                        disabled={false}
                        onChange={(e)=>{
                          let protocols = values.protocols
                          if(e.target.checked){
                            protocols.push(e.target.name);
                          }
                          else{
                            removeItemOnce(protocols,e.target.name);
                          }
                          setFieldValue('protocols',protocols);
                          getRecipients({contact_types:values.contact_types,environments:values.environments,protocols:protocols});
                          setFieldTouched('protocols')                    
                        }}
                        className={"col-form-label checkbox"}
                      />
                  <hr/>
                  <h3>Select Service Environment</h3>
                  <div className="notifications-help">Only services integrated in the selected environments will receive the notification</div>
                  <hr/> 
                  <Form.Check
                    name="all_environments"
                    label="All Environments"
                    checked={values.environments.length===tenant.form_config.integration_environment.length}
                    disabled={false}
                    onChange={(e)=>{
                      setFieldTouched('environments');
                      if(e.target.checked){
                        getRecipients({contact_types:values.contact_types,environments:[...tenant.form_config.integration_environment],protocols:values.protocols});
                        setFieldValue('environments',[...tenant.form_config.integration_environment])
                      }
                      else{
                        setFieldValue('environments',[]);
                        setRecipients([]);
                      }
                    }}
                    className={"col-form-label checkbox"}
                  />
                  
                  {tenant.form_config.integration_environment.map((environment)=>{
                    return(
                        <Form.Check
                        name={environment}
                        label={capitalWords([environment])}
                        key={environment}
                        checked={values.environments.includes(environment)}
                        disabled={false}
                        onChange={(e)=>{
                          let environments = values.environments
                          if(e.target.checked){
                            environments.push(e.target.name);
                          }
                          else{
                            removeItemOnce(environments,e.target.name);
                          }
                          setFieldValue('environments',environments);
                          getRecipients({contact_types:values.contact_types,environments:environments,protocols:values.protocols});
                          setFieldTouched('environments')                    
                        }}
                        className={"col-form-label checkbox"}
                      />
                    )
                  })}
                  <Error error={errors.environments} show={hasSubmitted||touched.environments}/>
                  <hr/> 
                  <div className='notifications-input-container split-to-rows-media'>
                          <div className='notifications-label'>
                            Cc
                          </div>
                          <div className='notifications-input'>
                            <Form.Control
                              name='cc_emails'
                              placeholder={'Use commas to seperate email addresses'}
                              onChange={(e)=>{
                                  let str = e.target.value;
                                  // Remove spaces
                                  str = str.replace(/(,+\s*)/g, ',');
                                  str = str.replace(/(\s*,+)/g, ',');
                                  str = str.replace(",,", ",");
                                  if(str.slice(-1)===','){
                                    str = str.slice(0,-1);
                                    
                                  };
                                  if(str.slice(0,1)===','){
                                    str = str.slice(1);
                                  }
                                  // str.split(',')
                                  setFieldValue('cc_emails',(str.length>0?str.split(','):[]));
                              }}
                              isInvalid={hasSubmitted?!!errors.cc_emails:(!!errors.cc_emails&&touched.cc_emails)}
                              onBlur={handleBlur}
                              disabled={false}
                              type="text"
                              className={'col-form-label'}
                            />
                            {/* <div className="error-message">{errors.name.split('\n').map((str,index) => <p key={index}>{str}</p>)}</div> */}
                          </div>
                          <Error error={formatCCError(errors.cc_emails)} show={hasSubmitted||touched.cc_emails} />
  
                    </div>
                    
                    <div className='notifications-input-container '>
                          <Form.Check
                              name="notify_admins"
                              label={"Also notify Federation Registry Operators and Managers"}
                              checked={values.notify_admins==='false'||!values.notify_admins?false:true}
                              value= {values.notify_admins}
                              disabled={false}
                              onChange={handleChange}
                              className={"col-form-label checkbox checkbox-cc"}
                            />
                        
                    </div>
  
                </Col>
              :null}
              
              <Col className="notifications-right-col">
                <h1>Notification</h1>
                <hr/>
                <hr/>
                
                  <Row className="notifications-right-row">
                    <Col className="notifications-secondary-col">
                      <h3>Sender Information</h3>
                      <hr/>
                      <div className='notifications-input-container split-to-rows-media'>
                        <div className='notifications-label'>
                          Your name
                          <span> *</span>
                        </div>
                        <div className='notifications-input'>
                          <Form.Control
                            name='name'
                            placeholder={'Type your Full Name'}
                            onChange={handleChange}
                            value={values.name}
                            isInvalid={hasSubmitted?!!errors.name:(!!errors.name&&touched.name)}
                            onBlur={handleBlur}
                            disabled={false}
                            type="text"
                            className={'col-form-label'}
                          />
  
                          {/* <div className="error-message">{errors.name.split('\n').map((str,index) => <p key={index}>{str}</p>)}</div> */}
                        </div>
                        <Error error={errors.name} show={hasSubmitted||touched.name}/>
                      </div>
                      <div className='notifications-input-container split-to-rows-media'>
                        <div className='notifications-label'>
                          Your email address
                          <span> *</span>
                        </div>
                        <div className='notifications-input'>
                          <Form.Control
                            name='email_address'
                            placeholder={'Type your Email Address'}
                            onChange={handleChange}
                            value={values.email_address}
                            isInvalid={hasSubmitted?!!errors.email_address:(!!errors.email_address&&touched.email_address)}
                            onBlur={handleBlur}
                            disabled={false}
                            type="text"
                            className={'col-form-label'}
                          />
  
                        </div>
                        <Error error={errors.email_address} show={hasSubmitted||touched.email_address}/>
                      </div>
                      
                    </Col>
                    
                    {props.type==='owners'?
                      <Col>
                      <h3>Recipient Information</h3>
                      <hr/>
                      <div className='notifications-input-container split-to-rows-media'>
                          <div className='notifications-label'>
                            Recipients
                            <span> *</span>
                          </div>
                          <div className='notifications-input'>
                            <Form.Control
                              name='recipients'
                              placeholder={'Use commas to seperate email addresses'}
                              defaultValue={formatDefaultEmails(values)}
                              onChange={(e)=>{
                                  let str = e.target.value;
                                  // Remove spaces
                                  str = str.replace(/(,+\s*)/g, ',');
                                  str = str.replace(/(\s*,+)/g, ',');
                                  str = str.replace(",,", ",");
                                  if(str.slice(-1)===','){
                                    str = str.slice(0,-1);
                                    
                                  };
                                  if(str.slice(0,1)===','){
                                    str = str.slice(1);
                                  }
                                  // str.split(',')
                                  setFieldValue('recipients',(str.length>0?str.split(','):[]));
                              }}
                              isInvalid={hasSubmitted?!!errors.recipients:(!!errors.recipients&&touched.recipients)}
                              onBlur={handleBlur}
                              disabled={false}
                              type="text"
                              className={'col-form-label'}
                            />
                            {/* <div className="error-message">{errors.name.split('\n').map((str,index) => <p key={index}>{str}</p>)}</div> */}
                          </div>
                          <Error error={formatCCError(errors.recipients)} show={hasSubmitted||touched.recipients} />
      
                        </div>
                        <div className='notifications-input-container split-to-rows-media'>
                          <div className='notifications-label'>
                            Cc
                          </div>
                          <div className='notifications-input'>
                            <Form.Control
                              name='cc_emails'
                              placeholder={'Use commas to seperate email addresses'}
                              onChange={(e)=>{
                                  let str = e.target.value;
                                  // Remove spaces
                                  str = str.replace(/(,+\s*)/g, ',');
                                  str = str.replace(/(\s*,+)/g, ',');
                                  str = str.replace(",,", ",");
                                  if(str.slice(-1)===','){
                                    str = str.slice(0,-1);
                                    
                                  };
                                  if(str.slice(0,1)===','){
                                    str = str.slice(1);
                                  }
                                  // str.split(',')
                                  setFieldValue('cc_emails',(str.length>0?str.split(','):[]));
                              }}
                              isInvalid={hasSubmitted?!!errors.cc_emails:(!!errors.cc_emails&&touched.cc_emails)}
                              onBlur={handleBlur}
                              disabled={false}
                              type="text"
                              className={'col-form-label'}
                            />
                            {/* <div className="error-message">{errors.name.split('\n').map((str,index) => <p key={index}>{str}</p>)}</div> */}
                          </div>
                          <Error error={formatCCError(errors.cc_emails)} show={hasSubmitted||touched.cc_emails} />
      
                        </div>
  
                      </Col>:null
                    }
                    
                    
                  </Row>
                  <hr/>
                  <Row className="notifications-right-row">
  
                    <h3>
                      Notification Content
                    </h3>
                    <hr/>
                    <div className='notifications-input-container split-to-rows-media'>
                      <div className='notifications-label'>
                        Notification/Email Subject
                        <span> *</span>
                      </div>
                      <div className='notifications-input'>
                        <Form.Control
                          name='email_subject'
                          placeholder={'Type the Subject'}
                          onChange={handleChange}
                          value={values.email_subject}
                          isInvalid={hasSubmitted?!!errors.email_subject:(!!errors.email_subject&&touched.email_subject)}
                          onBlur={handleBlur}
                          disabled={false}
                          type="text"
                          className={'col-form-label'}
                        />
                      </div>
                      <Error error={errors.email_subject} possition={'up'} show={hasSubmitted||touched.email_subject}/>
                    </div>
                    <div className='notifications-input-container email-body-notifications-input-container split-to-rows'>
                      <div className='notifications-label'>
                        Email Body
                        <span> *</span>
                      </div>
                      <div className='notifications-input email-body-input-container'>
                        <Form.Control
                          name='email_body'
                          placeholder={'Type your type your message here'}
                          onChange={handleChange}
                          value={values.email_body}
                          isInvalid={hasSubmitted?!!errors.email_body:(!!errors.email_body&&touched.email_body)}
                          onBlur={handleBlur}
                          disabled={false}
                          as="textarea"
                          rows="5"
                          className={'col-form-label email-body-input'}
                        />
                      </div>
                      <Error error={errors.email_body} possition={'up'} show={hasSubmitted||touched.email_body}/>
                    </div>
                    
                  </Row>
                  <Button className='submit-button' type="submit" variant="primary" ><FontAwesomeIcon icon={faPaperPlane}/>Send</Button>
                  
              </Col>
                <SimpleModal isSubmitting={isSubmitting} isValid={!Object.keys(errors).length}/>
                <ConfirmationModal 
                  active={confirmationData.active?true:false} 
                  close={()=>{setConfirmationData({})}} 
                  action={()=>{
                    if(props.type==='broadcast'){
                      sendNotification(values);
                    }
                    else if(props.type==='owners'){ 
                      sendOwnerNotification(values);
                    }
                    setConfirmationData({});
                  }}
                  title={"Are you sure you want to send this notification"} 
                  message={(function(){
                    if(props.type==='broadcast'){
                      return recipients.length + ' users will be notified'
                    }
                    else if( props.type==='owners'){
                      return 'The following address'+(values.recipients.length+values.cc_emails>1?'s':'')+' will recieve the notification <br>' + [...values.recipients,...values.cc_emails].join('<br>')
                    }
                    })()} 
                  accept={'Yes'} 
                  decline={'No'}/>
              {/* <Debug/> */}
              </Form>
            </React.Fragment>
          )}
        </Formik>
        :null}
        
      </Row>
  </React.Fragment>)
}

function formatCCError (errors) {
  let error ="";
  if(errors){
    let errors_length= 0; 
    errors.forEach((e,index)=>{
      if(e){
        errors_length++
      }
      error = error + '"' + e +'", '
    });
    
    error = (errors_length>1?"The following email addresses (":"The following email address (") + error.slice(0,-2) + (errors_length>1?") are not valid":") is not valid");
    return error
  }
  else {
    return ""
  }
}


function removeItemOnce(arr, value) {
  var index = arr.indexOf(value);
  if (index > -1) {
    arr.splice(index, 1);
  }
  return arr;
}

function capitalWords(array) {
   let return_array = array.map((item,index)=>{
      var splitStr = item.toLowerCase().split(' ');
      for (var i = 0; i < splitStr.length; i++) {
          // You do not need to check if i is larger than splitStr length, as your for does that for you
          // Assign it back to the array
          splitStr[i] = splitStr[i].charAt(0).toUpperCase() + splitStr[i].substring(1);
      }
      return splitStr.join(' ');
    })
   return return_array
}

function formatDefaultEmails(values){
  let value = "";
  if(values.recipients.length>1){
    values.recipients.forEach((email,index)=>{
      if(values.recipients.length===index+1){
        value = value + email
      }
      else{
        value = value + email + ", "
      }
        
    });
  }
  else{
    value= values.recipients[0];
  }
  return value;
}
export default BroadcastNotifications