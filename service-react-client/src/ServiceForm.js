import React,{useState,useEffect,useContext,useRef} from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {faCheckCircle,faBan,faSortDown} from '@fortawesome/free-solid-svg-icons';
import Tabs from 'react-bootstrap/Tabs';
import Tab from 'react-bootstrap/Tab';
import ButtonGroup from 'react-bootstrap/ButtonGroup';
import Row from 'react-bootstrap/Row';
import {ProcessingRequest} from './Components/LoadingBar';
import Col from 'react-bootstrap/Col';
import Collapse from 'react-bootstrap/Collapse';
import {useParams } from "react-router-dom";
import { diff } from 'deep-diff';
import {tenantContext} from './context.js';
//import {Debug} from './Components/Debug.js';
import {SimpleModal,ResponseModal,Logout} from './Components/Modals.js';
import Form from 'react-bootstrap/Form';
import 'bootstrap/dist/css/bootstrap.min.css';
import {Formik} from 'formik';
import * as config from './config.json';
import * as formConfig from './form-config.json';
import InputRow from './Components/InputRow.js';
import Button from 'react-bootstrap/Button';
import * as yup from 'yup';
import { useTranslation } from 'react-i18next';
import {SimpleInput,DeviceCode,Select,ListInput,LogoInput,TextAria,ListInputArray,CheckboxList,SimpleCheckbox,ClientSecret,TimeInput,RefreshToken,Contacts} from './Components/Inputs.js'// eslint-disable-next-line
const {reg} = require('./regex.js');



const ServiceForm = (props)=> {
  // eslint-disable-next-line
  const { t, i18n } = useTranslation();
  let {tenant_name} = useParams();
  // eslint-disable-next-line
  const [tenant,setTenant] = useContext(tenantContext);

  useEffect(()=>{
    if(props.disabled||props.review){
      setDisabled(true);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  },[]);


  // Returns true
  yup.addMethod(yup.array, 'unique', function(message, mapper = a => a) {
      return this.test('unique', message, function(list) {
          return list.length  === new Set(list.map(mapper)).size;
      });
  });


  const schema = yup.object({
    service_name:yup.string().min(4,t('yup_char_min') + ' ('+4+')').max(36,t('yup_char_max') + ' ('+36+')').required(t('yup_required')),
    // Everytime client_id changes we make a fetch request to see if it is available.
    client_id:yup.string().nullable().when('protocol',{
      is:'oidc',
      then: yup.string().min(4,t('yup_char_min') + ' ('+4+')').max(36,t('yup_char_max') + ' ('+36+')').test('testAvailable',t('yup_client_id_available'),function(value){
          return new Promise((resolve,reject)=>{
            if(props.initialValues.client_id===value||!value||value.length<4||value.length>36)
              {resolve(true)}
            else{
              if(value===checkedId &&formRef.current.values.integration_environment===checkedEnvironment){
                resolve(availabilityCheck);
              }
              setCheckingAvailability(true);
              fetch(config.host+'tenants/'+tenant_name+'/check-availability?value='+ value +'&protocol=oidc&environment='+formRef.current.values.integration_environment, {
                method:'GET',
                credentials:'include',
                headers:{
                  'Content-Type':'application/json',
                  'Authorization': localStorage.getItem('token')
                }}).then(response=>{
                  if(response.status===200){
                    return response.json();
                  }
                  else {
                    return false
                  }
                }).then(response=>{
                    setCheckedId(value);
                    setCheckingAvailability(false);
                    setCheckedEnvironment(formRef.current.values.integration_environment);
                    if(response){
                      setCheckedId(value);
                      setAvailabilityCheck(response.available);
                      resolve(response.available)}
                    else{
                      resolve(false);
                    }
                  }
                ).catch(()=>{resolve(true)});
            }
          })
      })
    }),
    redirect_uris:yup.array().nullable().when('protocol',{
      is:'oidc',
      then: yup.array().of(yup.string().matches(reg.regUrl,t('yup_secure_url'))).unique(t('yup_redirect_uri_unique')).required(t('yup_required'))
    }),
    logo_uri:yup.string().required(t('yup_required')).test('testImage',t('yup_image_url'),function(value){ return imageError}),
    policy_uri:yup.string().required(t('yup_required')).matches(reg.regSimpleUrl,t('yup_url')),
    service_description:yup.string().required(t('yup_required')),
    contacts:yup.array().of(yup.object().shape({
        email:yup.string().email(t('yup_email')).required(t('yup_contact_empty')),
        type:yup.string().required(t('yup_required'))
      })).test('testContacts',t('yup_contact_unique'),function(value){
          const array = [];
          value.map(s=>array.push(s.email+s.type));
          const unique = array.filter((v, i, a) => a.indexOf(v) === i);
          if(unique.length===array.length){return true}else{return false}
          }).required(t('yup_required')),
    scope:yup.array().nullable().when('protocol',{
      is:'oidc',
      then: yup.array().of(yup.string().min(1,t('yup_scope')).max(50,t('yup_char_max') + ' ('+ 50 +')').matches(reg.regScope,t('yup_scope_reg'))).unique(t('yup_scope_unique')).required(t('yup_required'))
    }),
    grant_types:yup.array().nullable().when('protocol',{
      is:'oidc',
      then: yup.array().of(yup.string().test('testGrantTypes','error-granttypes',function(value){return formConfig.grant_types.includes(value)})).required(t('yup_select_option'))
    }),
    id_token_timeout_seconds:yup.number().nullable().when('protocol',{
      is:'oidc',
      then: yup.number().min(0).max(1000000,t('yup_exceeds_max'))}),
    access_token_validity_seconds:yup.number().nullable().when('protocol',{
      is:'oidc',
      then: yup.number().min(0).max(1000000,t('yup_exceeds_max'))}),
    refresh_token_validity_seconds:yup.number().nullable().when('protocol',{
      is:'oidc',
      then: yup.number().min(0).max(34128000,t('yup_exceeds_max'))}),
    device_code_validity_seconds:yup.number().nullable().when('protocol',{
      is:'oidc',
      then: yup.number().min(0).max(34128000,t('yup_exceeds_max')).required(t('yup_required'))
    }),
    code_challenge_method:yup.string().nullable().when('protocol',{
      is:'oidc',
      then: yup.string().matches(reg.regCodeChalMeth).required(t('yup_required'))
    }),
    allow_introspection:yup.boolean().nullable().when('protocol',{
      is:'oidc',
      then: yup.boolean().required()
    }),
    generate_client_secret:yup.boolean().nullable().when('protocol',{
      is:'oidc',
      then: yup.boolean().required()
    }),
    reuse_refresh_tokens:yup.boolean().nullable().when('protocol',{
      is:'oidc',
      then: yup.boolean().required()
    }),
    protocol: yup.string().test('testProtocol',t('yup_protocol'),function(value){return ['saml','oidc'].includes(value)}).required(t('yup_protocol')),
    integration_environment:yup.string().test('testIntegrationEnv','Invalid Value',function(value){return tenant.form_config.integration_environment.includes(value)}).required(t('yup_select_option')),
    clear_access_tokens_on_refresh:yup.boolean().nullable().when('protocol',{
      is:'oidc',
      then: yup.boolean().required()
    }),
    client_secret:yup.string().nullable().when('protocol',{
      is:'oidc',
      then: yup.string().when('generate_client_secret',{
        is:false,
        then: yup.string().required(t('yup_required')).min(4,t('yup_char_min') + ' ('+4+')').max(16,t('yup_char_min') + ' ('+16+')')
      }).nullable()
    }),
    metadata_url:yup.string().nullable().when('protocol',{
      is:'saml',
      then: yup.string().required(t('yup_required')).matches(reg.regSimpleUrl,'Enter a valid Url')
    }),
    entity_id:yup.string().matches(reg.regUrl,t('yup_secure_url')).nullable().when('protocol',{
      is:'saml',
      then: yup.string().min(4,t('yup_char_min') + ' ('+4+')').test('testAvailable',t('yup_entity_id'),function(value){
          return new Promise((resolve,reject)=>{
            if(props.initialValues.entity_id===value||!value||!reg.regUrl.test(value))
              {resolve(true)}
            else{
              if(value===checkedId &&formRef.current.values.integration_environment===checkedEnvironment){
                resolve(availabilityCheck);
              }
              setCheckingAvailability(true);
              fetch(config.host+'tenants/'+tenant_name+'/check-availability?value='+ value +'&protocol=saml&environment='+ formRef.current.values.integration_environment, {
                method:'GET',
                credentials:'include',
                headers:{
                  'Content-Type':'application/json',
                  'Authorization': localStorage.getItem('token')
                }}).then(response=>{
                  if(response.status===200){
                    return response.json();
                  }
                  else {
                    return false
                  }
                }).then(response=>{
                    setCheckedId(value);
                    setCheckedEnvironment(formRef.current.values.integration_environment);
                    setCheckingAvailability(false);
                    if(response){
                      setCheckedId(value);
                      setAvailabilityCheck(response.available);
                      resolve(response.available)}
                    else{
                      resolve(false);
                    }
                  }
                  ).catch(()=>{resolve(true)})
            }
          })
      })
    })
  });

  const [logout,setLogout] = useState(false);
  const [availabilityCheck,setAvailabilityCheck] = useState(true);
  const formRef = useRef();
  const [disabled,setDisabled] = useState(false);
  const [hasSubmitted,setHasSubmitted] = useState(false);
  const [message,setMessage] = useState();
  const [modalTitle,setModalTitle] = useState(null);
  const [checkingAvailability,setCheckingAvailability] = useState(false);
  const [imageError,setImageError] = useState(false); //
  const [checkedId,setCheckedId] = useState(); // Variable containing the last client Id checked for availability to limit check requests
  const [checkedEnvironment,setCheckedEnvironment] = useState();
  const [asyncResponse,setAsyncResponse] = useState(false);
  const createNewPetition = (petition) => {
    // eslint-disable-next-line
    let type;
    if(props.service_id){
      petition.type='edit';
      type='reconfiguration';
      petition.service_id=props.service_id;
    }
    else{
      petition.type='create';
      type='registration'
      petition.service_id=null;
    }
    if (diff(petition,props.initialValues)){
      setAsyncResponse(true);
      fetch(config.host+'tenants/'+tenant_name+'/petitions', {
        method: 'POST', // *GET, POST, PUT, DELETE, etc.
        credentials: 'include', // include, *same-origin, omit
        headers: {
        'Content-Type': 'application/json',
        'Authorization': localStorage.getItem('token')
        },
        body: JSON.stringify(petition)
      }).then(response=> {
        setAsyncResponse(false);
        setModalTitle(t('new_petition_title'));
        if(response.status===200){
          setMessage(t('petition_success_msg'));
        }
        else if(response.status===401){
          setLogout(true);
        }
        else{
          setMessage(t('petition_error_smg') + response.status);
        }
      });
    }
    else{
      setAsyncResponse(false);
      setModalTitle(t('petition_no_change_title'));
      setMessage(t('petition_no_change_msg'));
    }
  }
  const editPetition = (petition) => {
    petition.type=props.type;
    petition.service_id=props.service_id;
    if(props.type === 'delete'){
      petition.type = 'edit';
    }
    if(diff(petition,props.initialValues)){
      setAsyncResponse(true);
      fetch(config.host+'tenants/'+tenant_name+'/petitions/'+props.petition_id, {
        method: 'PUT', // *GET, POST, PUT, DELETE, etc.
        credentials: 'include', // include, *same-origin, omit
        headers: {
        'Content-Type': 'application/json',
        'Authorization': localStorage.getItem('token')
        },
        body: JSON.stringify(petition) // body data type must match "Content-Type" header
      }).then(response=> {
        setAsyncResponse(false);
        setModalTitle(t('edit_petition_tilte'));
        if(response.status===200){
          setMessage(t('petition_success_msg'));
        }
        else if(response.status===401){
          setLogout(true);
        }
        else{
          setMessage(t('petition_error_msg') + response.status);
        }
      });
    }
    else{
      setModalTitle(t('petition_no_change_title'));
      setMessage(t('petition_no_change_msg'));
    }
  }
  const deletePetition = ()=>{
    setAsyncResponse(true);
    fetch(config.host+'tenants/'+tenant_name+'/petitions/'+props.petition_id, {
      method: 'DELETE', // *GET, POST, PUT, DELETE, etc.
      credentials: 'include', // include, *same-origin, omit
      headers: {
      'Content-Type': 'application/json',
      'Authorization': localStorage.getItem('token')
    }}).then(response=> {
      setModalTitle(t('request_submit_title'));
      setAsyncResponse(false);
      if(response.status===200){
        setMessage(t('request_cancel_success_msg'));
      }
      else if(response.status===401){
        setLogout(true);
      }
      else{
      setMessage(t('request_cancel_fail_msg+response.status'));
      }
    });
  }
  const reviewPetition = (comment,type)=>{
      setModalTitle(t('review_'+props.type+'_title'))
      setAsyncResponse(true);
      fetch(config.host+'tenants/'+tenant_name+'/petitions/'+props.petition_id+'/review', {
        method: 'PUT', // *GET, POST, PUT, DELETE, etc.
        credentials: 'include', // include, *same-origin, omit
        headers: {
        'Content-Type': 'application/json',
        'Authorization': localStorage.getItem('token')
        },
        body:JSON.stringify({comment:comment,type:type})
    }).then(response=> {
        setAsyncResponse(false);
        if(response.status===200){
          setMessage(t('review_success'));
        }
        else if(response.status===401){
          setLogout(true);
        }
        else{
          setMessage(t('review_error +response.status'));
        }
      });
  }



  const postApi=(data)=>{
    data = gennerateValues(data);
    if(!props.type){
      createNewPetition(data);
    }
    else {
      data.type = props.type;
      editPetition(data);
    }
  }



  return(
    <React.Fragment>
    <Logout logout={logout}/>
    <Formik
    initialValues={props.initialValues}
      validationSchema={schema}
      innerRef={formRef}
      onSubmit={(values,{setSubmitting}) => {
        setHasSubmitted(true);
        postApi(values);
      }}
    >
    {({
      handleSubmit,
      handleChange,
      handleBlur,
      values,
      setFieldValue,
      setFieldTouched,
      touched,
      isValid,
      validateField,
      setValues,
      setErrors,
      submitCount,
      errors,
      isSubmitting})=>(
      <div className="tab-panel">

              <ProcessingRequest active={asyncResponse}/>
              <Form noValidate onSubmit={handleSubmit}>


                {props.disabled?null:
                  <div className="form-controls-container">
                    {props.review?
                      <ReviewComponent reviewPetition={reviewPetition}/>
                      :
                      <React.Fragment>
                        <Button className='submit-button' type="submit" variant="primary" ><FontAwesomeIcon icon={faCheckCircle}/>{t('button_submit')}</Button>
                        {props.petition_id?<Button variant="danger" onClick={()=>deletePetition()}><FontAwesomeIcon icon={faBan}/>{t('button_cancel_request')}</Button>:null}
                      </React.Fragment>
                    }
                  </div>
                }
                <div className="form-tabs-contianer">
                <Tabs className="form-tabs" defaultActiveKey="general" id="uncontrolled-tab-example">

                  <Tab eventKey="general" title={t('form_tab_general')}>

                    <InputRow title={t('form_service_name')} description={t('form_service_name_desc')} error={errors.service_name} touched={touched.service_name}>
                      <SimpleInput
                        name='service_name'
                        placeholder={t('form_type_prompt')}
                        onChange={handleChange}
                        value={values.service_name}
                        isInvalid={hasSubmitted?!!errors.service_name:(!!errors.service_name&&touched.service_name)}
                        onBlur={handleBlur}
                        disabled={disabled}
                        changed={props.changes?props.changes.service_name:null}
                       />
                     </InputRow>


                      <InputRow title={t('form_integration_environment')} extraClass='select-col' error={errors.integration_environment} touched={touched.integration_environment}>
                        <Select
                          onBlur={handleBlur}
                          optionsTitle={capitalWords(tenant.form_config.integration_environment)}
                          options={tenant.form_config.integration_environment}
                          name="integration_environment"
                          values={values}
                          isInvalid={hasSubmitted?!!errors.integration_environment:(!!errors.integration_environment&&touched.integration_environment)}
                          onChange={handleChange}
                          disabled={disabled}
                          changed={props.changes?props.changes.integration_environment:null}
                        />
                      </InputRow>
                      <InputRow title={t('form_logo')}>
                        <LogoInput
                          setImageError={setImageError}
                          value={values.logo_uri}
                          name='logo_uri'
                          description={t('form_logo_desc')}
                          onChange={handleChange}
                          error={errors.logo_uri}
                          touched={touched.logo_uri}
                          onBlur={handleBlur}
                          validateField={validateField}
                          isInvalid={hasSubmitted?!!errors.logo_uri:(!!errors.logo_uri&&touched.logo_uri)}
                          disabled={disabled}
                          changed={props.changes?props.changes.logo_uri:null}
                        />
                      </InputRow>
                      <InputRow title={t('form_description')} description={t('form_description_desc')} error={errors.service_description} touched={touched.service_description}>
                        <TextAria
                          value={values.service_description}
                          onChange={handleChange}
                          onBlur={handleBlur}
                          name='service_description'
                          placeholder={t('form_type_prompt')}
                          isInvalid={hasSubmitted?!!errors.service_description:(!!errors.service_description&&touched.service_description)}
                          disabled={disabled}
                          changed={props.changes?props.changes.service_description:null}
                        />
                      </InputRow>
                      <InputRow title={t('form_policy_uri')} description={t('form_policy_uri_desc')} error={errors.policy_uri} touched={touched.policy_uri}>
                        <SimpleInput
                          name='policy_uri'
                          placeholder={t('form_url_placeholder')}
                          onChange={handleChange}
                          value={values.policy_uri}
                          isInvalid={hasSubmitted?!!errors.policy_uri:(!!errors.policy_uri&&touched.policy_uri)}
                          onBlur={handleBlur}
                          disabled={disabled}
                          changed={props.changes?props.changes.policy_uri:null}
                        />
                      </InputRow>

                      <InputRow title={t('form_contacts')} error={typeof(errors.contacts)=='string'?errors.contacts:null} touched={touched.contacts} description={t('form_contacts_desc')}>
                        <Contacts
                          values={values.contacts}
                          placeholder={t('form_type_prompt')}
                          name='contacts'
                          empty={typeof(errors.contacts)=='string'?true:false}
                          error={errors.contacts}
                          touched={touched.contacts}
                          onChange={handleChange}
                          onBlur={handleBlur}
                          setFieldTouched={setFieldTouched}
                          disabled={disabled}
                          changed={props.changes?props.changes.contacts:null}
                        />
                      </InputRow>
                    </Tab>
                    <Tab eventKey="protocol" title={t('form_tab_protocol')}>
                      <InputRow title={t('form_protocol')} extraClass='select-col' error={errors.protocol} touched={touched.code_challenge_method}>
                        <Select
                          onBlur={handleBlur}
                          optionsTitle={['Select one option','OIDC Service','SAML Service']}
                          options={['','oidc','saml']}
                          name="protocol"
                          values={values}
                          isInvalid={hasSubmitted?!!errors.protocol:(!!errors.protocol&&touched.protocol)}
                          onChange={handleChange}
                          disabled={disabled||props.initialValues.protocol}
                          changed={props.changes?props.changes.protocol:null}
                        />
                      </InputRow>
                      {values.protocol==='oidc'?
                        <React.Fragment>
                          <InputRow title={t('form_client_id')} description={t('form_client_id_desc')} error={errors.client_id} touched={touched.client_id}>
                            <SimpleInput
                              name='client_id'
                              placeholder={t('form_type_prompt')}
                              onChange={(e)=>{
                                setFieldTouched('client_id');
                                handleChange(e);
                              }}
                              value={values.client_id}
                              isInvalid={hasSubmitted?!!errors.client_id:(!!errors.client_id&&touched.client_id)}
                              onBlur={handleBlur}
                              disabled={disabled}
                              isloading={values.client_id&&values.client_id!==checkedId&&checkingAvailability?1:0}
                             />
                           </InputRow>
                           <InputRow title={t('form_redirect_uris')} error={typeof(errors.redirect_uris)=='string'?errors.redirect_uris:null}  touched={touched.redirect_uris} description={t('form_redirect_uris_desc')}>
                             <ListInput
                               values={values.redirect_uris}
                               placeholder={t('form_type_prompt')}
                               empty={(typeof(errors.redirect_uris)=='string')?true:false}
                               name='redirect_uris'
                               error={errors.redirect_uris}
                               touched={touched.redirect_uris}
                               onBlur={handleBlur}
                               onChange={handleChange}
                               setFieldTouched={setFieldTouched}
                               disabled={disabled}
                               changed={props.changes?props.changes.redirect_uris:null}
                             />
                           </InputRow>
                          <InputRow title={t('form_scope')} description={t('form_scope_desc')}>
                            <ListInputArray
                              name='scope'
                              values={values.scope}
                              placeholder={t('form_type_prompt')}
                              defaultValues= {formConfig.scope}
                              error={errors.scope}
                              touched={touched.scope}
                              disabled={disabled}
                              onBlur={handleBlur}
                              changed={props.changes?props.changes.scope:null}
                            />
                          </InputRow>
                          <InputRow title={t('form_grant_types')} error={errors.grant_types} touched={true}>
                            <CheckboxList
                              name='grant_types'
                              values={values.grant_types}
                              listItems={formConfig.grant_types}
                              disabled={disabled}
                              changed={props.changes?props.changes.grant_types:null}

                            />
                          </InputRow>
                          <InputRow title={t('form_refresh_token_validity_seconds')} extraClass='time-input' error={errors.refresh_token_validity_seconds} touched={touched.refresh_token_validity_seconds}>
                            <RefreshToken
                              values={values}
                              onBlur={handleBlur}
                              isInvalid={hasSubmitted?!!errors.refresh_token_validity_seconds:(!!errors.refresh_token_validity_seconds&&touched.refresh_token_validity_seconds)}
                              onChange={handleChange}
                              disabled={disabled}
                              changed={props.changes}
                            />
                          </InputRow>
                          <InputRow title={t('form_device_code_validity_seconds')} extraClass='time-input' error={errors.device_code_validity_seconds} touched={touched.device_code_validity_seconds}>
                            <DeviceCode
                              onBlur={handleBlur}
                              values={values}
                              isInvalid={hasSubmitted?!!errors.device_code_validity_seconds:(!!errors.device_code_validity_seconds&&touched.device_code_validity_seconds)}
                              onChange={handleChange}
                              disabled={disabled}
                              changed={props.changes}
                            />
                          </InputRow>
                          <InputRow title={t('form_code_challenge_method')} extraClass='select-col' error={errors.code_challenge_method} touched={touched.code_challenge_method}>
                            <Select
                              onBlur={handleBlur}
                              optionsTitle={['No code challenge','Plain code challenge','SHA-256 hash algorithm']}
                              options={['','plain','S256']}
                              name="code_challenge_method"
                              values={values}
                              isInvalid={hasSubmitted?!!errors.code_challenge_method:(!!errors.code_challenge_method&&touched.code_challenge_method)}
                              onChange={handleChange}
                              disabled={disabled}
                              changed={props.changes?props.changes.code_challenge_method:null}
                            />
                          </InputRow>
                          <InputRow title={t('form_allow_introspection')}>
                            <SimpleCheckbox
                              name='allow_introspection'
                              label={t('form_allow_introspection_desc')}
                              onChange={handleChange}
                              disabled={disabled}
                              value={values.allow_introspection}
                              changed={props.changes?props.changes.allow_introspection:null}
                            />
                          </InputRow>
                          <InputRow title={t('form_client_secret')}>
                            <ClientSecret
                              onChange={handleChange}
                              feedback='not good'
                              client_secret={values.client_secret}
                              error={errors.client_secret}
                              touched={touched.client_secret}
                              isInvalid={hasSubmitted?!!errors.client_secret:(!!errors.client_secret&&touched.client_secret)}
                              onBlur={handleBlur}
                              generate_client_secret={values.generate_client_secret}
                              disabled={disabled}
                              changed={props.changes?props.changes.client_secret:null}
                            />
                          </InputRow>
                          <InputRow title={t('form_access_token_validity_seconds')} extraClass='time-input' error={errors.access_token_validity_seconds} touched={touched.access_token_validity_seconds} description={t('form_access_token_validity_seconds_desc')}>
                            <TimeInput
                              name='access_token_validity_seconds'
                              value={values.access_token_validity_seconds}
                              isInvalid={hasSubmitted?!!errors.access_token_validity_seconds:(!!errors.access_token_validity_seconds&&touched.access_token_validity_seconds)}
                              onBlur={handleBlur}
                              onChange={handleChange}
                              disabled={disabled}
                              changed={props.changes?props.changes.access_token_validity_seconds:null}
                            />
                          </InputRow>
                          <InputRow title={t('form_id_token_timeout_seconds')} extraClass='time-input' error={errors.id_token_timeout_seconds} touched={touched.id_token_timeout_seconds} description={t('form_id_token_timeout_seconds_desc')}>
                            <TimeInput
                              name='id_token_timeout_seconds'
                              value={values.id_token_timeout_seconds}
                              isInvalid={hasSubmitted?!!errors.id_token_timeout_seconds:(!!errors.id_token_timeout_seconds&&touched.id_token_timeout_seconds)}
                              onBlur={handleBlur}
                              onChange={handleChange}
                              disabled={disabled}
                              changed={props.changes?props.changes.id_token_timeout_seconds:null}
                            />
                          </InputRow>
                        </React.Fragment>
                    :null}
                    {values.protocol==='saml'?
                      <React.Fragment>
                        <InputRow title={t('form_entity_id')} description={t('form_entity_id_desc')} error={errors.entity_id} touched={touched.entity_id}>
                          <SimpleInput
                            name='entity_id'
                            placeholder={t('form_type_prompt')}
                            onChange={(e)=>{
                              setFieldTouched('entity_id');
                              handleChange(e);
                            }}
                            value={values.entity_id}
                            isInvalid={hasSubmitted?!!errors.entity_id:(!!errors.entity_id&&touched.entity_id)}
                            onBlur={handleBlur}
                            disabled={disabled}
                            isloading={values.entity_id&&values.entity_id!==checkedId&&checkingAvailability?1:0}
                           />
                         </InputRow>
                         <InputRow title={t('form_metadata_url')} description={t('form_metadata_url_desc')} error={errors.metadata_url} touched={touched.metadata_url}>
                           <SimpleInput
                             name='metadata_url'
                             placeholder='Type something'
                             onChange={handleChange}
                             value={values.metadata_url}
                             isInvalid={hasSubmitted?!!errors.metadata_url:(!!errors.metadata_url&&touched.metadata_url)}
                             onBlur={handleBlur}
                             disabled={disabled}
                             changed={props.changes?props.changes.metadata_url:null}
                            />
                          </InputRow>
                       </React.Fragment>
                     :null}
                    </Tab>

                  </Tabs>
                  </div>
                  {props.disabled?null:
                    <div className="form-controls-container">
                      {props.review?
                          <ReviewComponent reviewPetition={reviewPetition}/>
                        :
                        <React.Fragment>
                          <Button className='submit-button' type="submit" variant="primary" ><FontAwesomeIcon icon={faCheckCircle}/>Submit</Button>
                          {props.type==='delete'||props.type==='edit'?<Button variant="danger" onClick={()=>deletePetition()}><FontAwesomeIcon icon={faBan}/>Cancel Request</Button>:null}
                        </React.Fragment>
                      }
                    </div>

                  }
                  <ResponseModal message={message} modalTitle={modalTitle}/>
                  <SimpleModal isSubmitting={isSubmitting} isValid={isValid}/>

                </Form>




      </div>
      )}
    </Formik>
  </React.Fragment>
  );
}

const ReviewComponent = (props)=>{

  const [type,setType] = useState();
  const [expand,setExpand] = useState(false);
  const [error,setError] = useState(false);
  const [comment,setComment] = useState();
  // eslint-disable-next-line
  const { t, i18n } = useTranslation();

  const handleReview = () =>{

      if(expand){
        if(type){

          if((type==='changes'&&comment)||type!=='changes'){
            props.reviewPetition(comment,type);
          }
          else{
            setError(t('review_comment_required_msg'));
          }
        }
        else {
          setError(t('review_select_option_msg'));
        }
      }else{
        setError(false);
        setExpand(true);
      }
  }
  return (
    <React.Fragment>
        <Row className="review-button-row">
          <ButtonGroup>
            <Button className="review-button" variant="success" onClick={()=> handleReview()}>{expand?t('review_submit'):
              <React.Fragment>
                {t('review')}
                <FontAwesomeIcon icon={faSortDown}/>
              </React.Fragment>
              }</Button>
              {expand?
                <Button variant="success" className="review-button-expand" onClick={()=>setExpand(!expand)}>
                  <FontAwesomeIcon icon={faSortDown}/>
                </Button>:null}

          </ButtonGroup>
          {error&&expand?
            <div className="review-error">
              {error}
            </div>
            :null}
        </Row>
        <Collapse in={expand}>
        <div className="expand-container">
        <div className="review-controls flex-column">
        <Form.Group>
          <Row>
            <Col md="auto" className="review-radio-col">
              <Form.Check
                type="radio"
                name="formHorizontalRadios"
                id="formHorizontalRadios1"
                onChange={(e)=>{if(e.target.checked){setType(e.target.value)}}}
                value="approve"
                checked={type==='approve'}
              />
            </Col>
            <Col onClick={()=>{
              setType('approve');
            }}>
              <Row>
                <strong>
                  {t('review_approve')}
                </strong>
              </Row>
              <Row className="review-option-desc">
                {t('review_approve_desc')}
              </Row>
            </Col>
          </Row>
          <Row>
            <Col md="auto" className="review-radio-col">
              <Form.Check
                type="radio"
                name="formHorizontalRadios"
                id="formHorizontalRadios2"
                onChange={(e)=>{if(e.target.checked){setType(e.target.value)}}}
                value="reject"
                checked={type==='reject'}
              />
            </Col>
            <Col onClick={()=>{
                setType('reject');
            }}>
              <Row>
                <strong>
                  {t('review_reject')}
                </strong>
              </Row>
              <Row className="review-option-desc">
                {t('review_reject_desc')}
              </Row>
            </Col>
          </Row>
          <Row>
            <Col md="auto" className="review-radio-col">
              <Form.Check
                type="radio"
                name="formHorizontalRadios"
                id="formHorizontalRadios3"
                onChange={(e)=>{if(e.target.checked){setType(e.target.value)}}}
                value="request-changes"
                checked={type==='changes'}
              />
            </Col>
            <Col onClick={()=>{
              setType('changes');
            }}>
              <Row>
                <strong>
                  {t('review_changes')}
                </strong>
              </Row>
              <Row className="review-option-desc">
                {t('review_changes_desc')}
              </Row>
            </Col>
          </Row>
        </Form.Group>
      </div>

      <Row>

        <Form.Control
          autoFocus
          maxLength='1024'
          as="textarea"
          rows='7'
          className="comment-input"
          placeholder={t('review_comment_prompt')}
          onChange={e => setComment(e.target.value)}
          value={comment}
        />

      </Row>
    </div>

  </Collapse>
    </React.Fragment>
  );
}

function gennerateValues(data){


  if(data.generate_client_secret&&data.protocol==='oidc'){
    data.client_secret= hex(16);
    data.generate_client_secret = false;
  }
  return data
}

function hex(n){
 n = n || 16;
 var result = '';
 while (n--){
  result += Math.floor(Math.random()*16).toString(16).toUpperCase();
 }
 return result;
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


export default ServiceForm
