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
import Alert from 'react-bootstrap/Alert'
import {Debug} from './Components/Debug.js';
import {SimpleModal,ResponseModal,Logout,NotFound} from './Components/Modals.js';
import Form from 'react-bootstrap/Form';
import 'bootstrap/dist/css/bootstrap.min.css';
import {Formik} from 'formik';
import * as config from './config.json';
import * as formConfig from './form-config.json';
import InputRow from './Components/InputRow.js';
import Button from 'react-bootstrap/Button';
import * as yup from 'yup';
import { useTranslation } from 'react-i18next';
import countryData from 'country-region-data';
import {SimpleInput,CountrySelect,AuthMethRadioList,DeviceCode,Select,PublicKey,ListInput,LogoInput,TextAria,ListInputArray,CheckboxList,SimpleCheckbox,ClientSecret,TimeInput,RefreshToken,Contacts} from './Components/Inputs.js'// eslint-disable-next-line
const {reg} = require('./regex.js');
var availabilityCheckTimeout;
var countries;
let integrationEnvironment;


const ServiceForm = (props)=> {
  // eslint-disable-next-line
  const { t, i18n } = useTranslation();
  let {tenant_name} = useParams();
  const [notFound,setNotFound] = useState(false);
  // eslint-disable-next-line
  const [tenant,setTenant] = useContext(tenantContext);
  const [showInitErrors,setShowInitErrors] = useState(false)
  useEffect(()=>{
    countries = [];
    if(props.service_id||props.petition_id){
      setShowInitErrors(true)
    }
    if(!tenant.form_config.integration_environment.includes(props.initialValues.integration_environment)){
      props.initialValues.integration_environment = tenant.form_config.integration_environment[0];
    }
    countryData.forEach((item,index)=>{
      countries.push(item.countryShortCode.toLowerCase());

    });
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
  function imageExists(url, callback) {
    if(url){
      var img = new Image();
      img.onload = function() { callback(true); };
      img.onerror = function() { callback(false); };
      img.src = url;

    }
    else{
      callback(true);
    }
  }
  const schema = yup.object({
    service_name:yup.string().nullable().min(4,t('yup_char_min') + ' ('+4+')').max(36,t('yup_char_max') + ' ('+36+')').required(t('yup_required')),
    // Everytime client_id changes we make a fetch request to see if it is available.
    client_id:yup.string().nullable().when('protocol',{
      is:'oidc',
      then: yup.string().min(4,t('yup_char_min') + ' ('+4+')').max(36,t('yup_char_max') + ' ('+36+')').test('testAvailable',t('yup_client_id_available'),function(value){
          return new Promise((resolve,reject)=>{
            clearTimeout(availabilityCheckTimeout);
            if(props.initialValues.client_id===value||!value||value.length<4||value.length>36)
              {resolve(true)}
            else{
              if(value===checkedId &&formRef.current.values.integration_environment===checkedEnvironment){
                resolve(availabilityCheck);
              }
              setCheckingAvailability(true);
              availabilityCheckTimeout = setTimeout(()=> {
                fetch(config.host+'tenants/'+tenant_name+'/check-availability?value='+ value +'&protocol=oidc&environment='+ this.parent.integration_environment, {
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
                      setCheckedEnvironment(this.parent.integration_environment);
                      if(response){
                        setCheckedId(value);
                        setAvailabilityCheck(response.available);
                        resolve(response.available)}
                      else{
                        resolve(false);
                      }
                    }
                  ).catch(()=>{resolve(true)});
              },1000);
            }
          })
      })
    }),
    redirect_uris:yup.array().nullable().when('protocol',{
      is:'oidc',
      then: yup.array().when('integration_environment',(integration_environment)=>{
        integrationEnvironment = integration_environment;
      }).of(yup.string().test('test_redirect_uri','error',function(value){
        if(integrationEnvironment==='production'){
          return value.match(reg.regUrl) || value.match(reg.regLocalhostUrl)
        }
        else{
          return value.match(reg.regSimpleUrl) || value.match(reg.regLocalhostUrl)
        }

      })).unique(t('yup_redirect_uri_unique')).when('grant_types',{
        is:(grant_types)=> grant_types.includes("implicit")||grant_types.includes("authorization_code"),
        then: yup.array().required(t('yup_required'))
      })
    }),
    logo_uri:yup.string().nullable().test('testImage',t('yup_image_url'),function(imageUrl){
      return new Promise((resolve,reject)=>{
        //var imageUrl = 'http://www.google.com/images/srpr/nav_logo14.png';
        imageExists(imageUrl, function(exists) {
          resolve(exists);
          //console.log('RESULT: url=' + imageUrl + ', exists=' + exists);
        });
      });
      }),
    policy_uri:yup.string().nullable().required(t('yup_required')).matches(reg.regSimpleUrl,t('yup_url')),
    country:yup.string().nullable().test('testCountry','Select one of the available options',function(value){return countries.includes(value)}).required(t('yup_required')),
    service_description:yup.string().nullable().required(t('yup_required')),
    contacts:yup.array().nullable().of(yup.object().shape({
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
      then: yup.array().of(yup.string().test('testGrantTypes','error-granttypes',function(value){return tenant.form_config.grant_types.includes(value)})).required(t('yup_select_option'))
    }),
    id_token_timeout_seconds:yup.number().nullable().when('protocol',{
      is:'oidc',
      then: yup.number().min(0).max(tenant.form_config.id_token_timeout_seconds,t('yup_exceeds_max'))}),
    access_token_validity_seconds:yup.number().nullable().when('protocol',{
      is:'oidc',
      then: yup.number().min(0).max(tenant.form_config.access_token_validity_seconds,t('yup_exceeds_max'))}),
    refresh_token_validity_seconds:yup.number().nullable().when('protocol',{
      is:'oidc',
      then: yup.number().min(0).max(tenant.form_config.refresh_token_validity_seconds,t('yup_exceeds_max'))}),
    device_code_validity_seconds:yup.number().nullable().when('protocol',{
      is:'oidc',
      then: yup.number().min(0).max(tenant.form_config.device_code_validity_seconds,t('yup_exceeds_max')).required(t('yup_required'))
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
      then: yup.string().when(['generate_client_secret','token_endpoint_auth_method'],{
        is:(generate_client_secret,token_endpoint_auth_method)=> generate_client_secret===false&&!(token_endpoint_auth_method==='private_key_jwt'||token_endpoint_auth_method==='none'),
        then: yup.string().required(t('yup_required')).min(4,t('yup_char_min') + ' ('+4+')').max(16,t('yup_char_min') + ' ('+16+')')
      }).nullable()
    }),
    metadata_url:yup.string().nullable().when('protocol',{
      is:'saml',
      then: yup.string().required(t('yup_required')).matches(reg.regSimpleUrl,'Enter a valid Url')
    }),
    token_endpoint_auth_signing_alg:yup.string().nullable().when(['protocol',"token_endpoint_auth_method"],{
      is:(protocol,token_endpoint_auth_method)=> protocol==='oidc'&&(token_endpoint_auth_method==="private_key_jwt",token_endpoint_auth_method==="client_secret_jwt"),
      then: yup.string().required(t('yup_select_option')).test('testTokenEndpointSigningAlgorithm','Invalid Value',function(value){console.log('Should not validate'); return tenant.form_config.token_endpoint_auth_signing_alg.includes(value)})
    }),
    token_endpoint_auth_method:yup.string().nullable().when('protocol',{
      is:'oidc',
      then: yup.string().required(t('yup_select_option')).test('testTokenEndpointAuthMethod','Invalid Value',function(value){return tenant.form_config.token_endpoint_auth_method.includes(value)})
    }),
    jwks_uri:yup.string().nullable().when(['protocol','token_endpoint_auth_method'],{
      is:(protocol,token_endpoint_auth_method)=> protocol==='oidc'&&token_endpoint_auth_method==="private_key_jwt" ,
      then:yup.string().test('testTokenEndpointAuthMethod','Invalid Value',function(value){if(this.parent.jwks||(value&&reg.regSimpleUrl.test(value))){return true}else{return false}})
    }),
    jwks:yup.object().nullable().when(['protocol','jwks_uri','token_endpoint_auth_method'],{
      is:(protocol,jwks_uri,token_endpoint_auth_method)=> protocol==='oidc'&&!jwks_uri&&token_endpoint_auth_method==="private_key_jwt" ,
      then:yup.object().required(t('yup_required')).test('testJwks','Invalid Schema',function(value){
        if(value&&value.keys&&typeof(value.keys)==='object'&&Object.keys(value).length===1){
          return true
        }
        else{
          return false
        }
      })
    }),
    entity_id:yup.string().matches(reg.regUrl,t('yup_secure_url')).nullable().when('protocol',{
      is:'saml',
      then: yup.string().min(4,t('yup_char_min') + ' ('+4+')').test('testAvailable',t('yup_entity_id'),function(value){
          return new Promise((resolve,reject)=>{

            clearTimeout(availabilityCheckTimeout);
            if(props.initialValues.entity_id===value||!value||!reg.regUrl.test(value))
              {resolve(true)}
            else{
              if(value===checkedId &&formRef.current.values.integration_environment===checkedEnvironment){
                resolve(availabilityCheck);
              }
              setCheckingAvailability(true);
              availabilityCheckTimeout = setTimeout(()=> {
                fetch(config.host+'tenants/'+tenant_name+'/check-availability?value='+ value +'&protocol=saml&environment='+ this.parent.integration_environment, {
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
                      setCheckedEnvironment(this.parent.integration_environment);
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
                  },1000);
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
  const [checkedId,setCheckedId] = useState(); // Variable containing the last client Id checked for availability to limit check requests
  const [checkedEnvironment,setCheckedEnvironment] = useState();
  const [asyncResponse,setAsyncResponse] = useState(false);
  const createNewPetition = (petition) => {
    // eslint-disable-next-line
    if(props.service_id){
      petition.type='edit';

      petition.service_id=props.service_id;
    }
    else{
      petition.type='create';
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
          return false;
        }
        else if(response.status===404){
          setNotFound(true);
          return false;
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
        return false;
      }
      else if(response.status===404){
        setNotFound(true);
        return false;
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
          return false;
        }
        else if(response.status===404){
          setNotFound(true);
          return false;
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

  const getInitialTouched = (initVal) =>{
    let touchedActive={};
    if(!(props.service_id||props.petition_id)){
      return {}
    }
    else{
      for (const property in initVal){
        touchedActive[property] = true;
      }
      return touchedActive;
    }


  }


  return(
    <React.Fragment>
    <Logout logout={logout}/>
    <NotFound notFound={notFound}/>
    <Formik
      initialValues={props.initialValues}
      validateOnMount={props.service_id||props.petition_id}
      initialTouched={getInitialTouched(props.initialValues)}
      validationSchema={schema}
      innerRef={formRef}
      onSubmit={(values,{setSubmitting}) => {
        setHasSubmitted(true);
        if(!(values.token_endpoint_auth_method==="client_secret_jwt"||values.token_endpoint_auth_method==="private_key_jwt")){
          values.token_endpoint_auth_signing_alg=null;
        }
        if(values.token_endpoint_auth_method!=="private_key_jwt"){
          values.jwks=null;
          values.jwks_uri=null;
        }
        if(values.token_endpoint_auth_method==="private_key_jwt"||values.token_endpoint_auth_method==="none"){
          values.client_secret = '';
        }
        if(values.jwks_uri){
          values.jwks_uri=null;
        }
        if(values.jwks){
          values.jwks = JSON.parse(values.jwks);
          values.jwks_uri=null;
          // let check = values.jwks.replace(/\n/g, "\\\\n").replace(/\r/g, "\\\\r").replace(/\t/g, "\\\\t");
          // values.jwks = JSON.parse(check);
        }
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
      validateForm,
      setValues,
      setErrors,
      submitCount,
      errors,
      isSubmitting})=>(
      <div className="tab-panel">
              <ProcessingRequest active={asyncResponse}/>
              {showInitErrors&&!Object.keys(errors).length === 0?
                <Alert variant='warning' className="invitation_alert">
                The following Service Configuration contains some invalid values or is missing a required field. To fix this issue sumbit a valid reconfiguration request
                </Alert>
              :null
              }
              <Form noValidate onSubmit={handleSubmit}>
                {props.disabled?null:
                  <div className="form-controls-container">
                    {props.review?
                      <ReviewComponent errors={errors} reviewPetition={reviewPetition}/>
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
                          disabled={disabled||tenant.form_config.integration_environment.length===1}
                          changed={props.changes?props.changes.integration_environment:null}
                        />
                      </InputRow>
                      <InputRow title={t('form_logo')}>
                        <LogoInput
                          value={values.logo_uri?values.logo_uri:''}
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
                          value={values.service_description?values.service_description:''}
                          onChange={handleChange}
                          onBlur={handleBlur}
                          name='service_description'
                          placeholder={t('form_type_prompt')}
                          isInvalid={hasSubmitted?!!errors.service_description:(!!errors.service_description&&touched.service_description)}
                          disabled={disabled}
                          changed={props.changes?props.changes.service_description:null}
                        />
                      </InputRow>
                      <InputRow title={'Select country'} extraClass='select-col' error={errors.country} touched={touched.country}>
                        <CountrySelect
                          onBlur={handleBlur}
                          placeholder={'Select country'}
                          name="country"
                          values={values}
                          isInvalid={hasSubmitted?!!errors.country:(!!errors.country&&touched.country)}
                          onChange={handleChange}
                          disabled={disabled}
                          changed={props.changes?props.changes.country:null}
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
                          <InputRow title={t('form_client_id')} description={t('form_client_id_desc')} error={checkingAvailability?null:errors.client_id} touched={touched.client_id}>
                            <SimpleInput
                              name='client_id'
                              placeholder={t('form_type_prompt')}
                              onChange={(e)=>{
                                setFieldTouched('client_id');
                                handleChange(e);
                              }}
                              value={values.client_id}
                              isInvalid={hasSubmitted?(!!errors.client_id&&!checkingAvailability):(!!errors.client_id&&touched.client_id&&!checkingAvailability)}
                              onBlur={handleBlur}
                              disabled={disabled}
                              changed={props.changes?props.changes.client_id:null}
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
                               integrationEnvironment = {values.integration_environment}
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
                              listItems={tenant.form_config.grant_types}
                              disabled={disabled}
                              changed={props.changes?props.changes.grant_types:null}

                            />
                          </InputRow>
                          <InputRow title="Token Endpoint Authorization Method" error={errors.token_endpoint_auth_method}>
                            <AuthMethRadioList
                              name='token_endpoint_auth_method'
                              values={values}
                              setFieldValue={setFieldValue}
                              onChange={handleChange}
                              radio_items={tenant.form_config.token_endpoint_auth_method}
                              radio_items_titles={tenant.form_config.token_endpoint_auth_method_title}
                              disabled={disabled}
                              changed={props.changes?props.changes.token_endpoint_auth_method:null}
                            />
                          </InputRow>
                          {values.token_endpoint_auth_method==='private_key_jwt'||values.token_endpoint_auth_method==='client_secret_jwt'?
                          <InputRow title="Token Endpoint Signing Algorithm" extraClass='select-col' error={errors.token_endpoint_auth_signing_alg} touched={touched.token_endpoint_auth_signing_alg}>
                            <Select
                              onBlur={handleBlur}
                              optionsTitle={tenant.form_config.token_endpoint_auth_signing_alg_title}
                              options={tenant.form_config.token_endpoint_auth_signing_alg}
                              default='RS256'
                              name="token_endpoint_auth_signing_alg"
                              values={values}
                              isInvalid={hasSubmitted?!!errors.token_endpoint_auth_signing_alg_title:(!!errors.token_endpoint_auth_signing_alg&&touched.token_endpoint_auth_signing_alg)}
                              onChange={handleChange}
                              disabled={disabled}
                              changed={props.changes?props.changes.token_endpoint_auth_signing_alg:null}
                            />
                          </InputRow>
                        :null}
                        {values.token_endpoint_auth_method==='private_key_jwt'?
                          <InputRow title="Public Key Set" extraClass='select-col' description="URL for the client's JSON Web Key set (must be reachable by the server)" error={errors.jwks?errors.jwks:errors.jwks_uri} touched={touched.jwks||touched.jwks_uri}>
                            <PublicKey
                              onBlur={handleBlur}
                              values={values}
                              setvalue={(field,value,validate)=>setFieldValue(field,value,validate)}
                              isInvalid={hasSubmitted?errors.jwks_uri||errors.jwks:((errors.jwks_uri||errors.jwks)&&(touched.jwks||touched.jwks_uri))}
                              datatype="json"
                              onChange={handleChange}
                              disabled={disabled}
                              changed={props.changes&&(props.changes.jwks||props.changes.jwks_uri)?true:false}
                            />
                          </InputRow>
                         :null}
                       {!(values.token_endpoint_auth_method==='private_key_jwt'||values.token_endpoint_auth_method==='none')?
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
                       :null}
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
                              default={values.code_challenge_method?values.code_challenge_method:''}
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
                        <InputRow title={t('form_entity_id')} description={t('form_entity_id_desc')} error={checkingAvailability?null:errors.entity_id} touched={touched.entity_id}>
                          <SimpleInput
                            name='entity_id'
                            placeholder={t('form_type_prompt')}
                            onChange={(e)=>{
                              setFieldTouched('entity_id');
                              handleChange(e);
                            }}
                            value={values.entity_id}
                            isInvalid={hasSubmitted?!!(errors.entity_id&&!checkingAvailability):(!!errors.entity_id&&touched.entity_id&&!checkingAvailability)}
                            onBlur={handleBlur}
                            disabled={disabled}
                            changed={props.changes?props.changes.entity_id:null}
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
                          <ReviewComponent errors={errors} reviewPetition={reviewPetition}/>
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
                  <Debug/>

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
  const [invalidPetition,setInvalidPetition] = useState(false);
  // eslint-disable-next-line
  const { t, i18n } = useTranslation();
  useEffect(()=>{
    setInvalidPetition(Object.keys(props.errors).length !== 0);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  },[props.errors]);

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
                disabled={invalidPetition}
                onChange={(e)=>{if(e.target.checked){setType(e.target.value)}}}
                value="approve"
                checked={type==='approve'}
              />
            </Col>
            <Col onClick={()=>{
              if(!invalidPetition){
                setType('approve');
              }
            }}>
              <Row>
                <strong>
                  {t('review_approve')}
                </strong>
                {invalidPetition?
                  <div className="approve-error">
                    Invalid Service Configuration, Approve disabled
                  </div>:null
                }
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
                value="changes"
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
