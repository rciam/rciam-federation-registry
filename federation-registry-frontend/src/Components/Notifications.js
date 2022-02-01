import React,{useEffect,useState,useContext} from 'react';
import * as config from '../config.json';
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
import {ResponseModal,Logout} from './Modals.js';
 import {Debug} from './Debug.js';

 const Error = (props) =>{
  return (
     <React.Fragment>
       {!props.error||!props.show?null:Array.isArray(props.error)?props.error.forEach(error=>{
          <div className={'notifications-error' + (props.possition==='up'?' notifications-error-up':'')}>{error}</div>
       }):<div className='notifications-error'>{props.error}</div>}
     </React.Fragment>
   )
 }

const Notifications = () =>{
  let {tenant_name} = useParams();
  let initialValues = {
    environments: ['production'],
    contact_types: ['technical'],
    cc_emails: ['kozas-sparrow@hotmail.com'],
    name: "Andreas Kozadinos 44",
    email_address: "koza-sparrow@hotmail.com",
    email_subject: "Test Notification",
    email_body: "This is not good bad bad",
    notify_admins: "false"
  }

  useEffect(()=>{
    getRecipients({contact_types:initialValues.contact_types,environments:initialValues.environments});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  },[]);
  
  const [hasSubmitted,setHasSubmitted] = useState(false);
  const [logout,setLogout] = useState(false);
  // eslint-disable-next-line
  const { t, i18n } = useTranslation();
  const tenant = useContext(tenantContext);
  const [responseTitle,setResponseTitle] = useState();
  const [responseMessage,setResponseMessage] = useState();
  const [recipients,setRecipients] = useState([]);
  

  const schema = yup.object({
    name :yup.string().nullable().min(4,t('yup_char_min') + ' ('+4+')').max(36,t('yup_char_max') + ' ('+36+')').required(t('yup_required')),
    email_body: yup.string().nullable().min(4,t('yup_char_min') + ' ('+4+')').max(4064,t('yup_char_max') + ' ('+4064+')').required(t('yup_required')),
    cc_emails: yup.array().nullable().of(yup.string().email(object=>{return object.value})),
    email_subject: yup.string().nullable().min(4,t('yup_char_min') + ' ('+4+')').max(64,t('yup_char_max') + ' ('+64+')').required(t('yup_required')),
    notify_admins: yup.boolean().nullable().required(t('yup_required')),
    email_address: yup.string().nullable().email().required(t('yup_required')),
    contact_types: yup.array().nullable().min(1,t('yup_select_option')).of(yup.string().test("Test contact types","Pleace select one of the available options",function(contact_type){
      if(tenant&&tenant[0]&&tenant[0].form_config.contact_types.includes(contact_type)){
        return true
      }
      else{
        return false;
      }
    })),
    environments: yup.array().nullable().min(1,t('yup_select_option')).of(yup.string().test("Test environments","Pleace select one of the available options",function(environment){
      if(tenant&&tenant[0]&&tenant[0].form_config.integration_environment.includes(environment)){
        return true
      }
      else{
        return false;
      }
    }))

    // Everytime client_id changes we make a fetch request to see if it is available.
    // policy_uri:yup.string().nullable().when('integration_environment',{
    //   is:'production',
    //   then: yup.string().nullable().required(t('yup_required')).matches(reg.regSimpleUrl,t('yup_url')),
    //   otherwise: yup.string().nullable().matches(reg.regSimpleUrl,t('yup_url'))
    //   })
    })
  const getRecipients = (data) => {
    fetch(config.host+'tenants/'+tenant_name+'/notifications/recipients?contact_types='+data.contact_types+'&environments='+data.environments, {
      method: 'GET', // *GET, POST, PUT, DELETE, etc.
      credentials: 'include', // include, *same-origin, omit
      headers: {
      'Content-Type': 'application/json',
      'Authorization': localStorage.getItem('token'),
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
          return false
        }
      }).then(response=> {
      if(response){
        setRecipients(response);
      }
    });
  }

  const sendNotification = (notification)=> {
    fetch(config.host+'tenants/'+tenant_name+'/notifications', {
      method: 'PUT', // *GET, POST, PUT, DELETE, etc.
      credentials: 'include', // include, *same-origin, omit
      headers: {
      'Content-Type': 'application/json',
      'Authorization': localStorage.getItem('token'),
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
        console.log(response);
      }
    });
  }

  return (        
  <React.Fragment>
      <Row className="notifications-main-row">
        <Logout logout={logout}/>
        <ResponseModal return_url={'/'+tenant_name+'/home'} message={responseMessage} modalTitle={responseTitle}/>
        <Formik
         initialValues={initialValues}
         validationSchema={schema}
        onSubmit={(values,{setSubmitting}) => {
          setHasSubmitted(true);
          sendNotification(values);
        }}
      >
        {({
      handleSubmit,
      handleChange,
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
          <Col className="notifications-left-col" sm="4">
            <h1>Recipients</h1>
            <div className="notifications-help">Select the type(s) of the contacts that will receive the notification</div>
            <hr/>
            <hr/>
            <Row className="recipients-container">
              <div>
                <FontAwesomeIcon icon={faEnvelope}/>
              </div>
               <Button disabled={true}>Selected Target(s): {recipients.length}</Button>
            </Row>
            
            <h3>Contact Types</h3>
            <hr/>
            <Form.Check
              name="all_contacts"
              label="All Contact Types"
              checked={values.contact_types.length===tenant[0].form_config.contact_types.length}
              disabled={false}
              onChange={(e)=>{
                setFieldTouched('contact_types');
                if(e.target.checked){
                  setFieldValue('contact_types',[...tenant[0].form_config.contact_types])
                  getRecipients({contact_types:[...tenant[0].form_config.contact_types],environments:values.environments});

                }
                else{
                  setFieldValue('contact_types',[])
                  setRecipients([]);
                }
              }}
              className={"col-form-label checkbox"}
            />
            
            
            {tenant[0].form_config.contact_types.map((contact_type,index)=>{
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
                    getRecipients({contact_types:contact_types,environments:values.environments});
                    setFieldValue('contact_types',contact_types);
                  }}
                  className={"col-form-label checkbox"}
                />
              )
            })}
            <Error error={errors.contact_types} show={hasSubmitted||touched.contact_types} />
     
            <hr/>
            <h3>Select Service Environment</h3>
            <div className="notifications-help">Only services integrated in the selected environments will receive the notification</div>
            <hr/> 
            <Form.Check
              name="all_environments"
              label="All Environments"
              checked={values.environments.length===tenant[0].form_config.integration_environment.length}
              disabled={false}
              onChange={(e)=>{
                setFieldTouched('environments');
                if(e.target.checked){
                  getRecipients({contact_types:values.contact_types,environments:[...tenant[0].form_config.integration_environment]});
                  setFieldValue('environments',[...tenant[0].form_config.integration_environment])
                }
                else{
                  setFieldValue('environments',[]);
                  setRecipients([]);
                }
              }}
              className={"col-form-label checkbox"}
            />
            
            {tenant[0].form_config.integration_environment.map((environment)=>{
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
                    getRecipients({contact_types:values.contact_types,environments:environments});
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
                            console.log(str);
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
                        label={"Also notify " + tenant_name.toUpperCase() +" Operators and Managers"}
                        checked={values.notify_admins}
                        value= {values.notify_admins}
                        disabled={false}
                        onChange={handleChange}
                        className={"col-form-label checkbox checkbox-cc"}
                      />
                   
              </div>

          </Col>
          <Col className="notifications-right-col">
            <h1>Notification</h1>
            <hr/>
            <hr/>
            
              <Row>
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
                  <hr/>
              </Row>
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
                <div className='notifications-input-container split-to-rows'>
                  <div className='notifications-label'>
                    Email Body
                    <span> *</span>
                  </div>
                  <div className='notifications-input'>
                    <Form.Control
                      name='email_body'
                      placeholder={'Type the Subject'}
                      onChange={handleChange}
                      value={values.email_body}
                      isInvalid={hasSubmitted?!!errors.email_body:(!!errors.email_body&&touched.email_body)}
                      onBlur={handleBlur}
                      disabled={false}
                      as="textarea"
                      rows="5"
                      className={'col-form-label'}
                    />
                  </div>
                  <Error error={errors.email_body} possition={'up'} show={hasSubmitted||touched.email_body}/>
                </div>
                <Button className='submit-button' type="submit" disabled={false} variant="primary" ><FontAwesomeIcon icon={faPaperPlane}/>Send</Button>
            
          </Col>
          <Debug/>
          </Form>
        </React.Fragment>
      )}
      
      </Formik>
      </Row>
  </React.Fragment>)
}

function formatCCError (errors) {
  let error ="";
  if(errors){
     
    errors.forEach((e,index)=>{
      error = error + '"' + e +'", '
    });
    error = (errors.length>1?"The following email addresses (":"The following email address (") + error.slice(0,-2) + (errors.length>1?") are not valid":") is not valid");
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

export default Notifications