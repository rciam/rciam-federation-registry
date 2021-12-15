import React,{useState,useEffect,useContext,useRef} from 'react';
import mapValues from 'lodash/mapValues';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {faCheckCircle,faBan,faSortDown} from '@fortawesome/free-solid-svg-icons';
import Tabs from 'react-bootstrap/Tabs';
import Tab from 'react-bootstrap/Tab';
import CopyDialog from './Components/CopyDialog.js'
import ButtonGroup from 'react-bootstrap/ButtonGroup';
import Row from 'react-bootstrap/Row';
import {ProcessingRequest} from './Components/LoadingBar';
import Col from 'react-bootstrap/Col';
import Collapse from 'react-bootstrap/Collapse';
import {useParams } from "react-router-dom";
import { diff } from 'deep-diff';
import {tenantContext} from './context.js';
import Alert from 'react-bootstrap/Alert';
// import {Debug} from './Components/Debug.js';
import {SimpleModal,ResponseModal,Logout,NotFound} from './Components/Modals.js';
import Form from 'react-bootstrap/Form';
import 'bootstrap/dist/css/bootstrap.min.css';
import {Formik} from 'formik';
import * as config from './config.json';
import InputRow from './Components/InputRow.js';
import Button from 'react-bootstrap/Button';
import * as yup from 'yup';
import { useTranslation } from 'react-i18next';
import parse from 'html-react-parser';
import countryData from 'country-region-data';
import {SimpleInput,CountrySelect,AuthMethRadioList,SelectEnvironment,DeviceCode,Select,PublicKey,ListInput,LogoInput,TextAria,ListInputArray,CheckboxList,SimpleCheckbox,ClientSecret,TimeInput,RefreshToken,Contacts,OrganizationField} from './Components/Inputs.js'// eslint-disable-next-line


const {reg} = require('./regex.js');
var availabilityCheckTimeout;
var countries;
let integrationEnvironment;

const ServiceForm = (props)=> {
  // eslint-disable-next-line
  const { t, i18n } = useTranslation();
  let {tenant_name} = useParams();
  let {service_id} = useParams();
  let {petition_id} = useParams();
  const [notFound,setNotFound] = useState(false);
  const [restrictReview,setRestrictReview] = useState(false);
  // eslint-disable-next-line
  const [tenant,setTenant] = useContext(tenantContext);
  const [logout,setLogout] = useState(false);
  const [submitDisabled,setSubmitDisabled] = useState(false);
  const [availabilityCheck,setAvailabilityCheck] = useState(true);
  const formRef = useRef();
  const [disabled,setDisabled] = useState(false);
  const [disabledOrganizationFields,setDisabledOrganizationFields] = useState([])
  const [hasSubmitted,setHasSubmitted] = useState(false);
  const [message,setMessage] = useState();
  const [modalTitle,setModalTitle] = useState(null);
  const [checkingAvailability,setCheckingAvailability] = useState(false);
  const [checkedId,setCheckedId] = useState(); // Variable containing the last client Id checked for availability to limit check requests
  const [checkedEnvironment,setCheckedEnvironment] = useState();
  const [asyncResponse,setAsyncResponse] = useState(false);
  const [formValues,setFormValues] = useState();
  const [showCopyDialog,setShowCopyDialog] = useState(false);
  const [showInitErrors,setShowInitErrors] = useState(false);
  const [logoWarning,setLogoWarning] = useState(false);

  useEffect(()=>{

    countries = [];
    if(service_id||petition_id){
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
    let extra_fields =tenant.form_config.extra_fields;
    Object.keys(extra_fields).forEach((name,index)=>{
      if(!Object.keys(props.initialValues).includes(name)){
        props.initialValues[name]= extra_fields[name].default;
      }
    });

    // Check restrictions for review
    if(props.review){
      if(tenant.restricted_environments.includes(props.initialValues.integration_environment)&&!props.user.review_restricted){
        setRestrictReview(true);
      }
    }
    //console.log(props.initialValues);
    setFormValues(props.initialValues);

    // eslint-disable-next-line react-hooks/exhaustive-deps
  },[]);


  // Returns true
  yup.addMethod(yup.array, 'unique', function(message, mapper = a => a) {
      return this.test('unique', message, function(list) {
        if(list){
          return list.length  === new Set(list.map(mapper)).size;
        }
        else{
          return true;
        }
      });
  });
  function imageExists(url) {
    if(url){
      var img = new Image();
      img.onload = function() { setLogoWarning(false); };
      img.onerror = function() { setLogoWarning(true); };
      img.src = url;

    }
    else{
      setLogoWarning(false);
    }
  }

  const dynamicValidation = async (values,props)=>{
    let error = {};
    lazy_schema.validate(values,{abortEarly:false}).catch(function (err) {
      if(err.inner){
        err.inner.forEach(item=>{
          error[item.path] = item.message;
        })
      }
    });
    return error;
  }


  const lazy_schema  = yup.lazy(obj => yup.object(
    mapValues(obj, (v, k) => {
      if (Object.keys((tenant.form_config.extra_fields)).includes(k) && tenant.form_config.extra_fields[k].type==='boolean') {        
        return yup.boolean().required(t('yup_required')).when('integration_environment',{
          is:(integration_environment)=> {return tenant.form_config.extra_fields[k].required.includes(integration_environment)},
          then: yup.boolean().oneOf([true],tenant.form_config.extra_fields[k].error)
          })
      }
      else if(Object.keys((tenant.form_config.extra_fields)).includes(k) && k ==='aup_uri'){
        return yup.string().nullable().test('testAvailable',t('yup_url'),function(value){
            if(!value){
              return true
            }
            else{
              return value.match(reg.regSimpleUrl)
            }
        }).when('integration_environment',{
          is:(integration_environment)=> tenant.form_config.extra_fields[k].required.includes(integration_environment),
          then: yup.string().nullable().required(t('yup_required'))
          })
      }
    })
  ));

  const schema = yup.object({
    service_name:yup.string().nullable().min(4,t('yup_char_min') + ' ('+2+')').max(256,t('yup_char_max') + ' ('+256+')').required(t('yup_required')),
    // Everytime client_id changes we make a fetch request to see if it is available.
    policy_uri:yup.string().nullable().when('integration_environment',{
      is:'production',
      then: yup.string().nullable().required(t('yup_required')).matches(reg.regSimpleUrl,t('yup_url')),
      otherwise: yup.string().nullable().matches(reg.regSimpleUrl,t('yup_url'))
      }),
    website_url:yup.string().nullable().matches(reg.regSimpleUrl,t('yup_url')),
    client_id:yup.string().nullable().when('protocol',{
      is:'oidc',
      then: yup.string().nullable().min(2,t('yup_char_min') + ' ('+2+')').max(128,t('yup_char_max') + ' ('+128+')').test('testAvailable',t('yup_client_id_available'),function(value){
        if(props.initialValues.client_id===value && !props.copy){
          return true
        }
        else{
          return new Promise((resolve,reject)=>{
              clearTimeout(availabilityCheckTimeout);
              if(!value)
                {resolve(true)}
              else{
                if(value===checkedId &&formRef.current.values.integration_environment===checkedEnvironment){
                  resolve(availabilityCheck);
                }
                else{
                  setCheckingAvailability(true);
                  availabilityCheckTimeout = setTimeout(()=> {
                    fetch(config.host+'tenants/'+tenant_name+'/check-availability?value='+ value +'&protocol=oidc&environment='+ this.parent.integration_environment+(petition_id?('&petition_id='+petition_id):"")+(service_id?('&service_id='+service_id):""), {
                      method:'GET',
                      credentials:'include',
                      headers:{
                        'Content-Type':'application/json',
                        'Authorization': localStorage.getItem('token')
                      }}).then(response=>{
                        if(response.status===200||response.status===304){
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
              }
            })
        }  
      })
    }),
    redirect_uris:yup.array().nullable().when('protocol',{
      is:'oidc',
      then: yup.array().nullable().when('integration_environment',(integration_environment)=>{
        integrationEnvironment = integration_environment;
      }).of(yup.string().required().test('test_redirect_uri','error',function(value){
        if(value){
          if(integrationEnvironment==='production'||integrationEnvironment==='demo'){
            return value.match(reg.regUrl) || value.match(reg.regLocalhostUrl)
          }
          else{
            return value.match(reg.regSimpleUrl) || value.match(reg.regLocalhostUrl)
          }
        }
      })).unique(t('yup_redirect_uri_unique')).when('grant_types',{
        is:(grant_types)=> grant_types.includes("implicit")||grant_types.includes("authorization_code"),
        then: yup.array().min(1,t('yup_required')).nullable().required(t('yup_required'))
      })
    }),
    logo_uri:yup.string().nullable().matches(reg.regSimpleUrl,'Enter a valid Url').test('testImage',t('yup_image_url'),function(imageUrl){
      imageExists(imageUrl);
      return true;
    }),
    country:yup.string().nullable().test('testCountry','Select one of the available options',function(value){return countries.includes(value)}).required(t('yup_required')),
    service_description:yup.string().nullable().required(t('yup_required')).max(1000,'Exceeded maximum characters (1000)'),
    contacts:yup.array().min(1,t('yup_required')).nullable().of(yup.object().shape({
        email:yup.string().email(t('yup_email')).required(t('yup_contact_empty')),
        type:yup.string().required(t('yup_required'))
      })).test('testContacts',function(contacts){
          let errors = "";
          tenant.form_config.contact_requirements.forEach((requirement,index)=>{
            let type_array =requirement.type.split(" ");
            let requirement_met = false; 
            contacts.forEach(contact=>{
              if(type_array.includes(contact.type)){
                requirement_met = true;
              }
            })
            if(!requirement_met){
              errors = (errors.length>0?errors+("\n") :errors) + requirement.error;
            }
          });
          if(errors.length>0){
            return this.createError({ message: errors });
          }
          else{
            return true;
          }
        }).test('testContacts',t('yup_contact_unique'),function(value){
          const array = [];
          value.map(s=>array.push(s.email+s.type));
          const unique = array.filter((v, i, a) => a.indexOf(v) === i);
          if(unique.length===array.length){return true}else{return false}
          }).required(t('yup_required')),
    scope:yup.array().nullable().when('protocol',{
      is:'oidc',
      then: yup.array().min(1,t('yup_select_option')).nullable().of(yup.string().min(1,t('yup_scope')).max(256,t('yup_char_max') + ' ('+ 256 +')').matches(reg.regScope,t('yup_scope_reg'))).unique(t('yup_scope_unique')).required(t('yup_required'))
    }),
    grant_types:yup.array().nullable().when('protocol',{
      is:'oidc',
      then: yup.array().min(1,t('yup_select_option')).nullable().of(yup.string().test('testGrantTypes','error-grant-types',function(value){return tenant.form_config.grant_types.includes(value)})).required(t('yup_select_option'))
    }),
    id_token_timeout_seconds:yup.number().nullable().when('protocol',{
      is:'oidc',
      then: yup.number().nullable().min(1,"Must be a positive value greater that 0").max(tenant.form_config.id_token_timeout_seconds,t('yup_exceeds_max')).required('This is a required field')}),
    access_token_validity_seconds:yup.number().nullable().when('protocol',{
      is:'oidc',
      then: yup.number().nullable().min(1,"Must be a positive value greater that 0").max(tenant.form_config.access_token_validity_seconds,t('yup_exceeds_max')).required('This is a required field')}),
    refresh_token_validity_seconds:yup.number().nullable().when(['scope','protocol'],{
      is:(scope,protocol)=> protocol==='oidc'&&scope.includes('offline_access'),
      then: yup.number().min(1,"Must be a positive value greater that 0").max(tenant.form_config.refresh_token_validity_seconds,t('yup_exceeds_max')).required('This field is required when the offline_access is selected')}),
    device_code_validity_seconds:yup.number().nullable().when(['protocol','grant_types'],{
      is:(protocol,grant_types)=> protocol==='oidc'&&grant_types.includes('urn:ietf:params:oauth:grant-type:device_code'),
      then: yup.number().nullable().min(0).max(tenant.form_config.device_code_validity_seconds,t('yup_exceeds_max')).required('This is a required field when the device code grant type is selected')}),
    code_challenge_method:yup.string().nullable().when('protocol',{
      is:'oidc',
      then: yup.string().nullable().test('test_code_challenge_method','Invalid Value',function(value){
        if(!value){
          return true;
        }
        else{
          return tenant.form_config.code_challenge_method.includes(value)
        }
      })
    }),
    allow_introspection:yup.boolean().nullable().when('protocol',{
      is:'oidc',
      then: yup.boolean().required()
    }),
    generate_client_secret:yup.boolean().nullable().when('protocol',{
      is:'oidc',
      then: yup.boolean().required()
    }),
    reuse_refresh_token:yup.boolean().nullable().when('protocol',{
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
      then: yup.string().nullable().when(['generate_client_secret','token_endpoint_auth_method'],{
        is:(generate_client_secret,token_endpoint_auth_method)=> generate_client_secret===false&&!(token_endpoint_auth_method==='private_key_jwt'||token_endpoint_auth_method==='none'),
        then: yup.string().nullable().required(t('yup_required')).min(4,t('yup_char_min') + ' ('+4+')').max(256,t('yup_char_max') + ' ('+256+')')
      }).nullable()
    }),
    metadata_url:yup.string().nullable().when('protocol',{
      is:'saml',
      then: yup.string().required(t('yup_required')).matches(reg.regSimpleUrl,'Enter a valid Url')
    }),
    token_endpoint_auth_signing_alg:yup.string().nullable().when(['protocol',"token_endpoint_auth_method"],{
      is:(protocol,token_endpoint_auth_method)=> protocol==='oidc'&&(token_endpoint_auth_method==="private_key_jwt"||token_endpoint_auth_method==="client_secret_jwt"),
      then: yup.string().required(t('yup_select_option')).test('testTokenEndpointSigningAlgorithm','Invalid Value',function(value){return tenant.form_config.token_endpoint_auth_signing_alg.includes(value)})
    }),
    token_endpoint_auth_method:yup.string().nullable().when('protocol',{
      is:'oidc',
      then: yup.string().nullable().required(t('yup_select_option')).test('testTokenEndpointAuthMethod','Invalid Value',function(value){return tenant.form_config.token_endpoint_auth_method.includes(value)})
    }),
    jwks_uri:yup.string().nullable().when(['protocol','token_endpoint_auth_method'],{
      is:(protocol,token_endpoint_auth_method)=> protocol==='oidc'&&token_endpoint_auth_method==="private_key_jwt" ,
      then:yup.string().nullable().test('test','Required Field',function(value){if(this.parent.jwks||value){return true}else{return false}}).test('testTokenEndpointAuthMethod','Invalid Value',function(value){ if(this.parent.jwks||(value&&reg.regSimpleUrl.test(value))){return true}else{return false}})
    }),
    jwks:yup.object().typeError("test").nullable().when(['protocol','jwks_uri','token_endpoint_auth_method'],{
      is:(protocol,jwks_uri,token_endpoint_auth_method)=> protocol==='oidc'&&!jwks_uri&&token_endpoint_auth_method==="private_key_jwt" ,
      then:yup.object().nullable().test('test','Required Field',function(value){if(this.parent.jwks_uri||value){return true}else{return false}}).test('testJwks','Invalid Schema',function(value){
        if(!value){
          return true
        }
        else if(value.keys&&typeof(value.keys)==='object'&&Object.keys(value).length===1){
          return true
        }
        else{
          return false
        }
      })
    }),
    organization_name:yup.string().nullable().when(['integration_environment'],{
      is:(integration_environment)=> tenant.form_config.extra_fields.organization.required.includes(integration_environment),
      then: yup.string().nullable().required('This is a required field')
    }),
    organization_url:yup.string().nullable().nullable().when(['integration_environment'],{
      is:(integration_environment)=> tenant.form_config.extra_fields.organization.required.includes(integration_environment),
      then: yup.string().nullable().matches(reg.regSimpleUrl,t('yup_secure_url')).required('This is a required field')
    }),
    entity_id:yup.string().matches(reg.regUrl,t('yup_secure_url')).nullable().when('protocol',{
      is:'saml',
      then: yup.string().min(4,t('yup_char_min') + ' ('+4+')').test('testAvailable',t('yup_entity_id'),function(value){
        if(props.initialValues.entity_id===value && !props.copy){
          return true
        }
        else{
          return new Promise((resolve,reject)=>{
              
              clearTimeout(availabilityCheckTimeout);
              if(!value||!reg.regUrl.test(value))
                {resolve(true)}
              else{
                setCheckingAvailability(true);
                //&&!(props.copy&&)
                if(value===checkedId &&formRef.current.values.integration_environment===checkedEnvironment){
                  setCheckingAvailability(false);
                  resolve(availabilityCheck);
                }
                else{
                  availabilityCheckTimeout = setTimeout(()=> {
                    fetch(config.host+'tenants/'+tenant_name+'/check-availability?value='+ value +'&protocol=saml&environment='+ this.parent.integration_environment+(petition_id?('&petition_id='+petition_id):"")+(service_id?('&service_id='+service_id):""), {
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
                
              }
            })

        }  
      })
    })
  });



  const toggleCopyDialog = () => {
    setShowCopyDialog(!showCopyDialog);
  }


  const createNewPetition = (petition) => {
    // eslint-disable-next-line
    if(service_id){
      petition.type='edit';

      petition.service_id=service_id;
    }
    else{
      petition.type='create';
      petition.service_id=null;
    }
    if (diff(petition,props.initialValues)||props.copy){
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
    petition.service_id=service_id;
    if(props.type === 'delete'){
      petition.type = 'edit';
    }
    if(diff(petition,props.initialValues)){
      setAsyncResponse(true);
      fetch(config.host+'tenants/'+tenant_name+'/petitions/'+petition_id, {
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
        else if(response.status===404){
          setNotFound(true);
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
    fetch(config.host+'tenants/'+tenant_name+'/petitions/'+petition_id, {
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
      else if(response.status===404){
        setNotFound(true);
      }
      else{
      setMessage(t('request_cancel_fail_msg+response.status'));
      }
    });
  }

  const addOrganization = async (data) => {
    if(!data.organization_id){
      return await fetch(config.host+'tenants/'+tenant_name+'/organizations', {
          method: 'POST', // *GET, POST, PUT, DELETE, etc.
          credentials: 'include', // include, *same-origin, omit
          headers: {
          'Content-Type': 'application/json',
          'Authorization': localStorage.getItem('token')
          },
          body:JSON.stringify({organization_name:data.organization_name,organization_url:data.organization_url,ror_id:data.ror_id})
      }).then(response=>{
        if(response.status===200||response.status===409){
          return response.json();
        }
        else if(response.status===401){
          setLogout(true);
        }
        else{
          return false
        }
      }).then((response)=>{
        if(response){
          return response.organization_id;
        }
        else{
          return response
        }
        
      })
    }
    else{
      return data.organization_id;
    }
    
  }


  const reviewPetition = (comment,type)=>{
      setModalTitle(t('review_'+props.type+'_title'))
      setAsyncResponse(true);
      fetch(config.host+'tenants/'+tenant_name+'/petitions/'+petition_id+'/review', {
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
          setMessage(t('review_error') +response.status);
        }
      });
  }



  const postApi= async (data)=>{
    data = gennerateValues(data);
    let organization_id;
    if(tenant.form_config.extra_fields.organization.active.includes(data.integration_environment)){
      organization_id = await addOrganization(data);
    }
    if(organization_id||!tenant.form_config.extra_fields.organization.active.includes(data.integration_environment)){
      data.organization_id = organization_id;
      if(!props.type){
        createNewPetition(data);
      }
      else {
        data.type = props.type;
        editPetition(data);
      }
    }
    else{
      setNotFound(true)
    }
  }

  const getInitialTouched = (initVal) =>{
    let touchedActive={};
    if(!(service_id||petition_id)){
      return {}
    }
    else{
      for (const property in initVal){
        touchedActive[property] = true;
      }
      for (const property in tenant.form_config.extra_fields){
        if(!initVal.hasOwnProperty[property]){
          touchedActive[property] = true;
        }
      }

      return touchedActive;
    }
  }
  const protocolOptions = (protocols)=> {
    let options = [];
    protocols.forEach(protocol=>{
      options.push(protocol.toUpperCase() + ' Service');
    })
    return options
  }


  return(
    <React.Fragment>
    <Logout logout={logout}/>
    <NotFound notFound={notFound}/>
    {formValues?
    <Formik
      initialValues={formValues}
      validateOnMount={service_id||petition_id||props.copy}
      initialTouched={getInitialTouched(formValues)}
      validationSchema={schema}
      innerRef={formRef}
      validate={dynamicValidation}
      onSubmit={(values,{setSubmitting}) => {
        setSubmitDisabled(true);
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
          values.jwks=null;
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
      <div className="tab-panel">
              {showCopyDialog?<CopyDialog service_id={service_id} show={showCopyDialog} toggleCopyDialog={toggleCopyDialog} current_environment={props.initialValues.integration_environment} />:null}

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
                      <ReviewComponent errors={errors} reviewPetition={reviewPetition} type={props.type} restrictReview={restrictReview}/>
                      :
                      <React.Fragment>
                        <div className="form-submit-cancel-container">
                          <Button className='submit-button' type="submit" disabled={submitDisabled} variant="primary" ><FontAwesomeIcon icon={faCheckCircle}/>{t('button_submit')}</Button>
                          {petition_id?<Button variant="danger" onClick={()=>deletePetition()}><FontAwesomeIcon icon={faBan}/>{t('button_cancel_request')}</Button>:null}
                        </div>
                      </React.Fragment>
                    }
                  </div>
                }
                <div className="form-tabs-container">
                <Tabs className="form-tabs " defaultActiveKey="general" id="uncontrolled-tab-example">

                  <Tab eventKey="general" title={t('form_tab_general')}>

                    <InputRow  moreInfo={tenant.form_config.more_info.service_name} title={t('form_service_name')} required={true} description={t('form_service_name_desc')} error={errors.service_name} touched={touched.service_name}>
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
                      <InputRow  moreInfo={tenant.form_config.more_info.integration_environment} title={t('form_integration_environment')} required={true} extraClass='select-col' error={errors.integration_environment} touched={touched.integration_environment}>
                        <SelectEnvironment
                          onBlur={handleBlur}
                          optionsTitle={capitalWords(tenant.form_config.integration_environment)}
                          options={tenant.form_config.integration_environment}
                          name="integration_environment"
                          values={values}
                          isInvalid={hasSubmitted?!!errors.integration_environment:(!!errors.integration_environment&&touched.integration_environment)}
                          onChange={handleChange}
                          disabled={disabled||tenant.form_config.integration_environment.length===1||props.copy||props.disableEnvironment}
                          changed={props.changes?props.changes.integration_environment:null}
                          copybuttonActive={props.owned&&props.disabled&&service_id}
                          toggleCopyDialog={toggleCopyDialog}

                        />
                      </InputRow>
                      <InputRow  moreInfo={tenant.form_config.more_info.logo_uri} title={t('form_logo')}>
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
                          warning={logoWarning}
                          changed={props.changes?props.changes.logo_uri:null}
                        />
                      </InputRow>
                      <InputRow  moreInfo={tenant.form_config.more_info.website_url} title={t('form_website_url')} description={t('form_website_url_desc')} error={errors.website_url} touched={touched.website_url}>
                        <SimpleInput
                          name='website_url'
                          placeholder={t('form_url_placeholder')}
                          onChange={handleChange}
                          value={values.website_url}
                          isInvalid={hasSubmitted?!!errors.website_url:(!!errors.website_url&&touched.website_url)}
                          onBlur={handleBlur}
                          disabled={disabled}
                          changed={props.changes?props.changes.website_url:null}
                         />
                     </InputRow>
                      <InputRow  moreInfo={tenant.form_config.more_info.service_description} title={t('form_description')} required={true} description={t('form_description_desc')} error={errors.service_description} touched={touched.service_description}>
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
                      <InputRow  moreInfo={tenant.form_config.more_info.country} title={'Select country'} required={true} extraClass='select-col' error={errors.country} touched={touched.country}>
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
                      {tenant.form_config.extra_fields.organization.active.includes(values.integration_environment)?
                      <React.Fragment>
                        <InputRow  moreInfo={tenant.form_config.more_info.organization_name} required={tenant.form_config.extra_fields.organization.required.includes(values.integration_environment)} title="Organization" description="Search for your orginization" error={errors.organization_name} touched={touched.organization_name}>
                            <OrganizationField
                              name='organization_name'
                              placeholder='Type the name of your organization'
                              onChange={handleChange}
                              values={values}
                              isInvalid={hasSubmitted?!!errors.organization_name:(!!errors.organization_name&&touched.organization_name)}
                              setFieldTouched={setFieldTouched}
                              validateForm={validateForm}
                              validateField={validateField}
                              disabled={disabled}
                              setFieldValue={setFieldValue}
                              setDisabledOrganizationFields={setDisabledOrganizationFields} 
                              changed={props.changes?props.changes.organization_name:null}
                            />
                          </InputRow>
                          <InputRow  moreInfo={tenant.form_config.more_info.organization_url} title="Organization Website Url" required={tenant.form_config.extra_fields.organization.required.includes(values.integration_environment)} description="Link to the organization's website" error={errors.organization_url} touched={touched.organization_url}>
                            <SimpleInput
                              name='organization_url'
                              placeholder={t('form_type_prompt')}
                              onChange={handleChange}
                              value={values.organization_url}
                              isInvalid={hasSubmitted?!!errors.organization_url:(!!errors.organization_url&&touched.organization_url)}
                              onBlur={handleBlur}
                              disabled={disabled||disabledOrganizationFields.includes('organization_url')}
                              changed={props.changes?props.changes.organization_url:null}
                            />
                          </InputRow>
                        </React.Fragment>
                        :null
                      }
                      <InputRow  moreInfo={tenant.form_config.more_info.policy_uri} title={t('form_policy_uri')} required={true&&values.integration_environment==='production'} description={t('form_policy_uri_desc')} error={errors.policy_uri} touched={touched.policy_uri}>
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


                      

                      {Object.entries(tenant.form_config.extra_fields).map(([name,field_data])=>{
                        field_data.name = name;                    
                        return (field_data.tab==='general'?<React.Fragment key={name}>
                          {generateInput({
                            field_data,
                            values,
                            errors,
                            touched,
                            changes:props.changes,
                            handleChange,
                            hasSubmitted,
                            disabled,
                            handleBlur,
                            tenant
                          })}
                      </React.Fragment>:null)                    
                      })

                      
                      
                      // Object.keys(tenant.form_config.code_of_condact).map((name,index)=>{
                      //   return(
                      //     <InputRow  moreInfo={tenant.form_config.more_info[name]} title={tenant.form_config.code_of_condact[name].title} key={index} required={
                      //       tenant.form_config.code_of_condact[name].required.includes(values.integration_environment)} error={errors[name]?errors[name]:null} touched={touched[name]}>
                      //       <SimpleCheckbox
                      //       name= {name}
                      //       label={
                      //         <React.Fragment>
                      //           {parse(tenant.form_config.code_of_condact[name].desc)}
                      //         </React.Fragment>
                      //       }
                      //       onChange={handleChange}
                      //       disabled={disabled}
                      //       value={values[name]}
                      //       onBlur={handleBlur}
                      //       changed={props.changes?props.changes[name]:null}
                      //       />
                      //     </InputRow>
                      //   )
                      // })
                    }




                      <InputRow  moreInfo={tenant.form_config.more_info.contacts} title={t('form_contacts')} required={true} error={typeof(errors.contacts)==='string'?errors.contacts:null} touched={touched.contacts} description={t('form_contacts_desc')}>
                        <Contacts
                          values={values.contacts}
                          placeholder={t('form_type_prompt')}
                          name='contacts'
                          empty={typeof(errors.contacts)==='string'?true:false}
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
                      <InputRow title={t('form_protocol')} required={true} extraClass='select-col' error={errors.protocol} touched={touched.protocol}>
                        <Select
                          onBlur={handleBlur}
                          optionsTitle={['Select one option',...protocolOptions(tenant.form_config.protocol)]}
                          options={['',...tenant.form_config.protocol]}
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
                          <InputRow  moreInfo={tenant.form_config.more_info.client_id} title={t('form_client_id')} description={t('form_client_id_desc')} error={checkingAvailability?null:errors.client_id} touched={touched.client_id}>
                            <SimpleInput
                              name='client_id'
                              placeholder={t('form_type_prompt')}
                              onChange={(e)=>{
                                setFieldTouched('client_id');
                                handleChange(e);
                              }}
                              copybutton={props.copybutton}
                              value={values.client_id}
                              isInvalid={hasSubmitted?(!!errors.client_id&&!checkingAvailability):(!!errors.client_id&&touched.client_id&&!checkingAvailability)}
                              onBlur={handleBlur}
                              disabled={disabled||service_id}
                              changed={props.changes?props.changes.client_id:null}
                              isloading={values.client_id&&values.client_id!==checkedId&&checkingAvailability?1:0}
                             />
                           </InputRow>
                           <InputRow  moreInfo={tenant.form_config.more_info.redirect_uris} title={t('form_redirect_uris')} required={values.grant_types.includes("implicit")||values.grant_types.includes("authorization_code")} error={typeof(errors.redirect_uris)==='string'?errors.redirect_uris:null}  touched={touched.redirect_uris} description={t('form_redirect_uris_desc')}>
                             <ListInput
                               values={values.redirect_uris}
                               placeholder={t('form_type_prompt')}
                               empty={(typeof(errors.redirect_uris)==='string')?true:false}
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
                          <InputRow  moreInfo={tenant.form_config.more_info.scope} title={t('form_scope')} required={true} description={t('form_scope_desc')}>
                            <ListInputArray
                              name='scope'
                              values={values.scope}
                              placeholder={t('form_type_prompt')}
                              defaultValues= {tenant.form_config.scope}
                              error={errors.scope}
                              touched={touched.scope}
                              disabled={disabled}
                              onBlur={handleBlur}
                              changed={props.changes?props.changes.scope:null}
                            />
                          </InputRow>

                          <InputRow  moreInfo={tenant.form_config.more_info.grant_types} title={t('form_grant_types')} required={true} error={errors.grant_types} touched={true}>
                            <CheckboxList
                              name='grant_types'
                              values={values.grant_types}
                              listItems={tenant.form_config.grant_types}
                              disabled={disabled}
                              changed={props.changes?props.changes.grant_types:null}

                            />
                          </InputRow>
                          <InputRow  moreInfo={tenant.form_config.more_info.token_endpoint_auth_method} title="Token Endpoint Authorization Method" required={true} error={errors.token_endpoint_auth_method} touched={touched.token_endpoint_auth_method}>
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
                          <InputRow  moreInfo={tenant.form_config.more_info.token_endpoint_auth_signing_alg} title="Token Endpoint Signing Algorithm" required={true} extraClass='select-col' error={errors.token_endpoint_auth_signing_alg} touched={touched.token_endpoint_auth_signing_alg}>
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
                          <InputRow  moreInfo={tenant.form_config.more_info.jwks} title="Public Key Set" required={true} extraClass='select-col' description="URL for the client's JSON Web Key set (must be reachable by the server)" error={errors.jwks?errors.jwks:errors.jwks_uri} touched={touched.jwks||touched.jwks_uri}>
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
                         <InputRow  moreInfo={tenant.form_config.more_info.client_secret} required={true} title={t('form_client_secret')}>
                           <ClientSecret
                             onChange={handleChange}
                             feedback='not good'
                             client_secret={values.client_secret}
                             error={errors.client_secret}
                             touched={touched.client_secret}
                             copybutton={props.copybutton}
                             isInvalid={hasSubmitted?!!errors.client_secret:(!!errors.client_secret&&touched.client_secret)}
                             onBlur={handleBlur}
                             generate_client_secret={values.generate_client_secret}
                             disabled={disabled}
                             changed={props.changes?props.changes.client_secret:null}
                           />
                         </InputRow>
                       :null}
                          <InputRow  moreInfo={tenant.form_config.more_info.refresh_token_validity_seconds} required={values.scope.includes('offline_access')} title={t('form_refresh_token_validity_seconds')} extraClass='time-input' error={errors.refresh_token_validity_seconds} touched={touched.refresh_token_validity_seconds}>
                            <RefreshToken
                              values={values}
                              onBlur={handleBlur}
                              isInvalid={hasSubmitted?!!errors.refresh_token_validity_seconds:(!!errors.refresh_token_validity_seconds&&touched.refresh_token_validity_seconds)}
                              onChange={handleChange}
                              disabled={disabled}
                              errors={errors}
                              setFieldValue={setFieldValue}
                              validateField={validateField}
                              changed={props.changes}
                            />
                          </InputRow>
                          <InputRow  moreInfo={tenant.form_config.more_info.device_code_validity_seconds} required={values.grant_types.includes('urn:ietf:params:oauth:grant-type:device_code')} title={t('form_device_code_validity_seconds')} extraClass='time-input' error={errors.device_code_validity_seconds} touched={touched.device_code_validity_seconds}>
                            <DeviceCode
                              onBlur={handleBlur}
                              values={values}
                              setFieldValue={setFieldValue}
                              errors={errors}
                              validateField={validateField}
                              isInvalid={hasSubmitted?!!errors.device_code_validity_seconds:(!!errors.device_code_validity_seconds&&touched.device_code_validity_seconds)}
                              onChange={handleChange}
                              disabled={disabled}
                              changed={props.changes}
                            />
                          </InputRow>
                          <InputRow  moreInfo={tenant.form_config.more_info.code_challenge_method} required={true} title={t('form_code_challenge_method')} extraClass='select-col' error={errors.code_challenge_method} touched={touched.code_challenge_method}>
                            <Select
                              onBlur={handleBlur}
                              optionsTitle={['PKCE will not be used for this service','Plain code challenge','SHA-256 hash algorithm (recomended)']}
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
                          <InputRow  moreInfo={tenant.form_config.more_info.allow_introspection} title={t('form_allow_introspection')}>
                            <SimpleCheckbox
                              name='allow_introspection'
                              label={t('form_allow_introspection_desc')}
                              onChange={handleChange}
                              disabled={disabled}
                              value={values.allow_introspection}
                              changed={props.changes?props.changes.allow_introspection:null}
                            />
                          </InputRow>
                          <InputRow  moreInfo={tenant.form_config.more_info.access_token_validity_seconds} required={true} title={t('form_access_token_validity_seconds')} extraClass='time-input' error={errors.access_token_validity_seconds} touched={touched.access_token_validity_seconds} description={t('form_access_token_validity_seconds_desc')}>
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
                          <InputRow  moreInfo={tenant.form_config.more_info.id_token_timeout_seconds} required={true} title={t('form_id_token_timeout_seconds')} extraClass='time-input' error={errors.id_token_timeout_seconds} touched={touched.id_token_timeout_seconds} description={t('form_id_token_timeout_seconds_desc')}>
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
                        <InputRow  moreInfo={tenant.form_config.more_info.entity_id} required={true} title={t('form_entity_id')} description={t('form_entity_id_desc')} error={checkingAvailability?null:errors.entity_id} touched={touched.entity_id}>
                          <SimpleInput
                            name='entity_id'
                            placeholder={t('form_type_prompt')}
                            onChange={(e)=>{
                              setFieldTouched('entity_id');
                              handleChange(e);
                            }}
                            value={values.entity_id}
                            copybutton={props.copybutton}
                            isInvalid={hasSubmitted?!!(errors.entity_id&&!checkingAvailability):(!!errors.entity_id&&touched.entity_id&&!checkingAvailability)}
                            onBlur={handleBlur}
                            disabled={disabled}
                            changed={props.changes?props.changes.entity_id:null}
                            isloading={values.entity_id&&values.entity_id!==checkedId&&checkingAvailability?1:0}
                           />
                         </InputRow>
                         <InputRow  moreInfo={tenant.form_config.more_info.metadata_url} required={true} title={t('form_metadata_url')} description={t('form_metadata_url_desc')} error={errors.metadata_url} touched={touched.metadata_url}>
                           <SimpleInput
                             name='metadata_url'
                             placeholder='Type something'
                             onChange={handleChange}
                             copybutton={props.copybutton}
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
                          <ReviewComponent errors={errors} type={props.type} reviewPetition={reviewPetition} restrictReview={restrictReview} />
                        :
                        <React.Fragment>
                        <div className="form-submit-cancel-container">
                          <Button className='submit-button' type="submit" disabled={submitDisabled} variant="primary" ><FontAwesomeIcon icon={faCheckCircle}/>Submit</Button>
                          {props.type==='delete'||props.type==='edit'?<Button variant="danger" onClick={()=>deletePetition()}><FontAwesomeIcon icon={faBan}/>Cancel Request</Button>:null}
                        </div>
                        </React.Fragment>
                      }
                    </div>

                  }
                  <ResponseModal message={message} modalTitle={modalTitle}/>
                  <SimpleModal isSubmitting={isSubmitting} isValid={!Object.keys(errors).length}/>
                   {/* <Debug/> */}

                </Form>




      </div>
      )}
    </Formik>
    :null}
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
          {props.restrictReview?
            <Row>
              <Col md="auto" className="review-radio-col">
                <Form.Check
                type="radio"
                name="formHorizontalRadios"
                id="formHorizontalRadios4"
                onChange={(e)=>{if(e.target.checked){setType(e.target.value)}}}
                value="request_review"
                checked={type==='request_review'}
                />
              </Col>
              <Col onClick={()=>{
                setType('request_review');
              }}>
                <Row>
                <strong>
                {t('review_request_review')}
                </strong>
                </Row>
                <Row className="review-option-desc">
                {t('review_request_review_desc')}
                </Row>
              </Col>
            </Row>
            :
            <Row>
              <Col md="auto" className="review-radio-col">
              <Form.Check
              type="radio"
              name="formHorizontalRadios"
              id="formHorizontalRadios1"
              disabled={invalidPetition&&props.type!=='delete'}
              onChange={(e)=>{if(e.target.checked){setType(e.target.value)}}}
              value="approve"
              checked={type==='approve'}
              />
              </Col>
              <Col onClick={()=>{
                if(!invalidPetition||props.type==='delete'){
                  setType('approve');
                }
              }}>
              <Row>
              <strong>
              {t('review_approve')}
              </strong>
              {invalidPetition&&props.type!=='delete'?
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
          }
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

const  generateInput = (props)=>  {
  return (
   <React.Fragment>
    {props.field_data.type==='boolean'?
        <InputRow  
        moreInfo={props.tenant.form_config.more_info[props.field_data.name]} 
        title={props.field_data.title} 
        key={props.field_data.name} 
        required={props.field_data.required.includes(props.values.integration_environment)} 
        error={props.errors[props.field_data.name]?props.errors[props.field_data.name]:null} 
        touched={props.touched[props.field_data.name]}
      > 
      <SimpleCheckbox
      name= {props.field_data.name}
      label={
        <React.Fragment>
          {parse(props.field_data.desc)}
        </React.Fragment>
      }
      onChange={props.handleChange}
      disabled={props.disabled}
      value={props.values[props.field_data.name]}
      onBlur={props.handleBlur}
      changed={props.changes?props.changes[props.field_data.name]:null}
      />
      </InputRow>
      :props.field_data.type==='string'?
      <InputRow  
      description={props.field_data.desc}
      moreInfo={props.tenant.form_config.more_info[props.field_data.name]} 
      title={props.field_data.title} 
      key={props.field_data.name} 
      required={props.field_data.required.includes(props.values.integration_environment)} 
      error={props.errors[props.field_data.name]?props.errors[props.field_data.name]:null} 
      touched={props.touched[props.field_data.name]}
    > 
        <SimpleInput
        name={props.field_data.name}
        placeholder={props.field_data.placeholder}
        onChange={props.handleChange}
        value={props.values[props.field_data.name]}
        isInvalid={props.hasSubmitted?!!props.errors[props.field_data.name]:(!!props.errors[props.field_data.name]&&props.touched[props.field_data.name])}
        onBlur={props.handleBlur}
        disabled={props.disabled}
        changed={props.changes?props.changes[props.field_data.name]:null}
      />
    </InputRow>
      :null
      }
    
    </React.Fragment>         
  )
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
