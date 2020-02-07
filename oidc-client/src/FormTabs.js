import React,{useState} from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {faCheckSquare} from '@fortawesome/free-solid-svg-icons';
import { diff } from 'deep-diff';
import Tabs from 'react-bootstrap/Tabs';
import Tab from 'react-bootstrap/Tab';
import {Debug} from './Components/Debug.js';
import {SimpleModal,ResponseModal} from './Components/Modals.js';
import Form from 'react-bootstrap/Form';
import 'bootstrap/dist/css/bootstrap.min.css';
import {Formik} from 'formik';
import * as config from './config.json';
import * as formConfig from './form-config.json';
import InputRow from './Components/InputRow.js';
import Button from 'react-bootstrap/Button';
import * as yup from 'yup';
import {SimpleInput,DeviceCode,Select,ListInput,LogoInput,TextAria,ListInputArray,CheckboxList,SimpleCheckbox,ClientSecret,TimeInput,RefreshToken,Contacts} from './Components/Inputs.js'// eslint-disable-next-line
const {reg} = require('./regex.js');
const uuidv1 = require('uuid/v1');


const FormTabs = (props)=> {
  yup.addMethod(yup.array, 'unique', function(message, mapper = a => a) {
      return this.test('unique', message, function(list) {
          return list.length  === new Set(list.map(mapper)).size;
      });
  });

  const schema = yup.object({
    client_name:yup.string().min(4,'The Client Name must be at least 4 characters long').max(36,'The Client Name exceeds the character limit (15)').required('This is a required field!'),
    client_id:yup.string().min(4,'The Client ID must be at least 4 characters long').max(36,'The Client ID exceeds the character limit (35)').test('testAvailable','Client Id is not available',function(value){
        return new Promise((resolve,reject)=>{
          if(props.initialValues.client_id===value||checkedId===value){
            resolve(true)
          }
          setCheckingAvailability(true);
          fetch(config.host+'client/availability/'+ value, {
            method:'GET',
            credentials:'include',
            headers:{
              'Content-Type':'application/json'
            }}).then(res => res.json()).then(
              (res=>{if(res.success){
                setcheckedId(value);
                setCheckingAvailability(false);
                resolve(res.available)}})
              ).catch(()=>{resolve(true)})
        })
    }),
    redirect_uris:yup.array().of(yup.string().matches(reg.regUrl,'This must be a secure Url starting with https://')).unique('Redirect Uris must be unique!').required('This is a required field!'),
    logo_uri:yup.string().required('This is a required field!').test('testImage','Enter a valid image Url',function(value){ return imageError}),
    policy_uri:yup.string().required('This is a required field!').matches(reg.regSimpleUrl,'Enter a valid Url'),
    client_description:yup.string().required('This is a required field!'),
    contacts:yup.array().of(yup.object().shape({
        email:yup.string().email('Enter a valid email address').required('Contact email cannot be empty'),
        type:yup.string().required('This is a required field!')
      })).test('testContacts','Contacts must be unique',function(value){
          const array = [];
          value.map(s=>array.push(s.email+s.type));
          const unique = array.filter((v, i, a) => a.indexOf(v) === i);
          if(unique.length===array.length){return true}else{return false}
          }).required('This is a required field!'),
    scope:yup.array().of(yup.string().min(1,'Scope cannot be empty').max(50,'Scope exceeds character limit (50)').matches(reg.regScope,'Scope must consist of small letters and underscores')).unique('Scope must be unique').required('This is a required field!'),
    grant_types:yup.array().of(yup.string().test('testGrantTypes','error-granttypes',function(value){return formConfig.grant_types.includes(value)})).required('At least one option must be selected'),
    access_token_validity_seconds:yup.number().min(0).max(1000000,'Exceeds the maximum value').required('This is a required field!'),
    refresh_token_validity_seconds:yup.number().min(0).max(34128000,'Exceeds the maximum value').required('This is a required field!'),
    device_code_validity_seconds:yup.number().min(0).max(34128000,'Exceeds the maximum value').required('This is a required field!'),
    code_challenge_method:yup.string().matches(reg.regCodeChalMeth),
    allow_introspection:yup.boolean().required(),
    generate_client_secret:yup.boolean().required(),
    reuse_refresh_tokens:yup.boolean().required(),
    integration_environment:yup.string().test('testIntegrationEnv','error-integrationEnvironment',function(value){return formConfig.integration_environment.includes(value)}).required('At least one option must be selected'),
    clear_access_tokens_on_refresh:yup.boolean().required(),
    client_secret:yup.string().when('generate_client_secret',{
      is:false,
      then: yup.string().required('Client Secret cannot be empty').min(4,'Client Secret must e at least 4 characters long').max(16,'Client Secret must not exceed the character limit (16)')
    }).nullable(),

  });

  const [hasSubmitted,setHasSubmitted] = useState(false);
  const [message,setMessage] = useState();
  const [clientId,setClientId] = useState(null);
  const [checkingAvailability,setCheckingAvailability] = useState(false);
  const [imageError,setImageError] = useState(false); //
  const [checkedId,setcheckedId] = useState(); // Variable containing the last client Id checked for availability

  const approveApi=(id)=>{
    fetch(config.host+'client/approve/'+ id, {
      method:'PUT',
      credentials:'include',
      headers:{
        'Content-Type':'application/json'
      }
    }).then(response=>response.json()).then(response=>{
      setClientId(props.initialValues.client_id);
      if(response.success){
        setMessage('Was approved with success.');
      }
      else{
        setMessage('Could not be approved due to the following error: ' + response.error);
      }
    })
  }
  const postApi=(data)=>{
    data = gennerateValues(data);
    if(!props.editId){
      fetch(config.host+'client/create', {
        method: 'POST', // *GET, POST, PUT, DELETE, etc.
        credentials: 'include', // include, *same-origin, omit
        headers: {
        'Content-Type': 'application/json'
        },
        body: JSON.stringify(data) // body data type must match "Content-Type" header
      }).then(response=>response.json()).then(response=> {
        setClientId(data.client_id);
        if(response.success){
          setMessage('Was created with success.');
        }
        else{
          setMessage('Was not created due to the following error: ' + response.error);
        }
      })
    }
    else {
      const editData = prepareEditData(data,props.initialValues);
      if(Object.keys(editData.details).length !== 0||Object.keys(editData.dlt).length !== 0||Object.keys(editData.add).length !== 0){
        fetch(config.host+'client/edit/'+props.editId, {
          method: 'POST', // *GET, POST, PUT, DELETE, etc.
          credentials: 'include', // include, *same-origin, omit
          headers: {
          'Content-Type': 'application/json'
          },
          body: JSON.stringify(editData) // body data type must match "Content-Type" header
        }).then(response=>response.json()).then(response=> {
          setClientId(data.client_id);
          if(response.success){
            setMessage('Was edited with success.');
          }
          else{
            console.log(response);
            setMessage('Was not edited due to the following error: ' + response.error);
          }
        })
      }
    }
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


  return(
    <React.Fragment>

    <Formik
    initialValues={props.initialValues}
      validationSchema={schema}
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
          <div id="form-container">
            <Tabs defaultActiveKey="main" id="uncontrolled-tab-example">
              <Tab eventKey="main" title="Main">
              <Form noValidate onSubmit={handleSubmit}>
                <InputRow title='Client name' description='Human-readable application name' error={errors.client_name} touched={touched.client_name}>
                  <SimpleInput
                    name='client_name'
                    placeholder='Type something'
                    onChange={handleChange}
                    value={values.client_name}
                    isInvalid={hasSubmitted?!!errors.client_name:(!!errors.client_name&&touched.client_name)}
                    onBlur={handleBlur}
                    disabled={props.review}
                   />
                 </InputRow>

                 <InputRow title='Client ID' description='Unique identifier. If you leave this blank it will be automatically generated.' error={errors.client_id} touched={touched.client_id}>
                   <SimpleInput
                     name='client_id'
                     placeholder='Type something'
                     onChange={(e)=>{
                       setFieldTouched('client_id');
                       handleChange(e);
                     }}
                     value={values.client_id}
                     isInvalid={hasSubmitted?!!errors.client_id:(!!errors.client_id&&touched.client_id)}
                     onBlur={handleBlur}
                     disabled={props.review}
                     isloading={checkingAvailability?1:0}
                    />
                  </InputRow>
                  <InputRow title='Redirect URI(s)' error={typeof(errors.redirect_uris)=='string'?errors.redirect_uris:null}  touched={touched.redirect_uris} description='URIs that the client can be redirected to after the authorization page'>
                    <ListInput
                      values={values.redirect_uris}
                      placeholder='https://'
                      empty={(typeof(errors.redirect_uris)=='string')?true:false}
                      name='redirect_uris'
                      error={errors.redirect_uris}
                      touched={touched.redirect_uris}
                      onBlur={handleBlur}
                      onChange={handleChange}
                      setFieldTouched={setFieldTouched}
                      disabled={props.review}

                    />
                  </InputRow>
                  <InputRow title='Integration Environment' extraClass='select-col' error={errors.integration_environment} touched={touched.integration_environment}>
                    <Select
                      onBlur={handleBlur}
                      optionsTitle={capitalWords(formConfig.integration_environment)}
                      options={formConfig.integration_environment}
                      name="integration_environment"
                      values={values}
                      isInvalid={hasSubmitted?!!errors.integration_environment:(!!errors.integration_environment&&touched.integration_environment)}
                      onChange={handleChange}
                      disabled={props.review}
                    />
                  </InputRow>
                  <InputRow title='Logo'>
                    <LogoInput
                      setImageError={setImageError}
                      value={values.logo_uri}
                      name='logo_uri'
                      description='URL that points to a logo image, will be displayed on approval page'
                      onChange={handleChange}
                      error={errors.logo_uri}
                      touched={touched.logo_uri}
                      onBlur={handleBlur}
                      validateField={validateField}
                      isInvalid={hasSubmitted?!!errors.logo_uri:(!!errors.logo_uri&&touched.logo_uri)}
                      disabled={props.review}
                    />
                  </InputRow>
                  <InputRow title='Description' description='Human-readable text description' error={errors.client_description} touched={touched.client_description}>
                    <TextAria
                      value={values.client_description}
                      onChange={handleChange}
                      onBlur={handleBlur}
                      name='client_description'
                      placeholder="Type a description"
                      isInvalid={hasSubmitted?!!errors.client_description:(!!errors.client_description&&touched.client_description)}
                      disabled={props.review}
                    />
                  </InputRow>
                  <InputRow title='Policy Statement' description='URL for the Policy Statement of this client, will be displayed to the user' error={errors.policy_uri} touched={touched.policy_uri}>
                    <SimpleInput
                      name='policy_uri'
                      placeholder='https://'
                      onChange={handleChange}
                      value={values.policy_uri}
                      isInvalid={hasSubmitted?!!errors.policy_uri:(!!errors.policy_uri&&touched.policy_uri)}
                      onBlur={handleBlur}
                      disabled={props.review}
                    />
                  </InputRow>

                  <InputRow title='Contacts' error={typeof(errors.contacts)=='string'?errors.contacts:null} touched={touched.contacts} description='List of contacts for administrators of this client.'>
                    <Contacts
                      values={values.contacts}
                      placeholder='New contact'
                      name='contacts'
                      empty={typeof(errors.contacts)=='string'?true:false}
                      error={errors.contacts}
                      touched={touched.contacts}
                      onChange={handleChange}
                      onBlur={handleBlur}
                      setFieldTouched={setFieldTouched}
                      disabled={props.review}
                    />
                  </InputRow>
                  <InputRow title='Scope' description='OAuth scopes this client is allowed to request'>
                    <ListInputArray
                      name='scope'
                      values={values.scope}
                      placeholder='New scope'
                      defaultValues= {formConfig.scope}
                      error={errors.scope}
                      touched={touched.scope}
                      disabled={props.review}
                      onBlur={handleBlur}
                    />
                  </InputRow>
                  <InputRow title='Grant Types' error={errors.grant_types} touched={true}>
                    <CheckboxList
                      name='grant_types'
                      values={values.grant_types}
                      listItems={formConfig.grant_types}
                      disabled={props.review}
                    />
                  </InputRow>
                  <InputRow title='Introspection'>
                    <SimpleCheckbox
                      name='allow_introspection'
                      label="Allow calls to the Introspection Endpoint?"
                      onChange={handleChange}
                      disabled={props.review}
                    />
                  </InputRow>
                  <InputRow title='Client Secret'>
                    <ClientSecret
                      onChange={handleChange}
                      feedback='not good'
                      client_secret={values.client_secret}
                      error={errors.client_secret}
                      touched={touched.client_secret}
                      isInvalid={hasSubmitted?!!errors.client_secret:(!!errors.client_secret&&touched.client_secret)}
                      onBlur={handleBlur}
                      generate_client_secret={values.generate_client_secret}
                      disabled={props.review}
                    />
                  </InputRow>
                  <InputRow title='Access Token Timeout' extraClass='time-input' error={errors.access_token_validity_seconds} touched={touched.access_token_validity_seconds} description='Enter this time in seconds, minutes, or hours (Max value is 1000000 seconds (11.5 days)).'>
                    <TimeInput
                      name='access_token_validity_seconds'
                      value={values.access_token_validity_seconds}
                      isInvalid={hasSubmitted?!!errors.access_token_validity_seconds:(!!errors.access_token_validity_seconds&&touched.access_token_validity_seconds)}
                      onBlur={handleBlur}
                      onChange={handleChange}
                      disabled={props.review}
                    />
                  </InputRow>
                  <InputRow title='Refresh Tokens' extraClass='time-input' error={errors.refresh_token_validity_seconds} touched={touched.refresh_token_validity_seconds}>
                    <RefreshToken
                      values={values}
                      onBlur={handleBlur}
                      isInvalid={hasSubmitted?!!errors.refresh_token_validity_seconds:(!!errors.refresh_token_validity_seconds&&touched.refresh_token_validity_seconds)}
                      onChange={handleChange}
                      disabled={props.review}
                    />
                  </InputRow>
                  <InputRow title='Device Code' extraClass='time-input' error={errors.device_code_validity_seconds} touched={touched.device_code_validity_seconds}>
                    <DeviceCode
                      onBlur={handleBlur}
                      values={values}
                      isInvalid={hasSubmitted?!!errors.device_code_validity_seconds:(!!errors.device_code_validity_seconds&&touched.device_code_validity_seconds)}
                      onChange={handleChange}
                      disabled={props.review}
                    />
                  </InputRow>
                  <InputRow title='Proof Key for Code Exchange (PKCE) Code Challenge Method' extraClass='select-col' error={errors.code_challenge_method} touched={touched.code_challenge_method}>
                    <Select
                      onBlur={handleBlur}
                      optionsTitle={['No code challenge','Plain code challenge','SHA-256 hash algorithm']}
                      options={['','plain','S256']}
                      name="code_challenge_method"
                      values={values}
                      isInvalid={hasSubmitted?!!errors.code_challenge_method:(!!errors.code_challenge_method&&touched.code_challenge_method)}
                      onChange={handleChange}
                      disabled={props.review}
                    />
                  </InputRow>

                  <InputRow extraClass='time-input submit-buttons'>


                    <ResponseModal message={message} clientId={clientId}/>
                    <SimpleModal isSubmitting={isSubmitting} isValid={isValid}/>
                    {props.review?
                      <React.Fragment>
                      {/*<Button className='approve-button' type="button" variant="danger"><FontAwesomeIcon icon={faBan}/>Deny Petition</Button>*/}
                      <Button  type="button" variant="success" onClick={()=>{approveApi(props.editId)}} ><FontAwesomeIcon icon={faCheckSquare}/>Approve Petition</Button>
                      </React.Fragment>
                    :
                      <React.Fragment>
                        <Button className='post-button' type="button" variant="danger" onClick={()=> {postApi(values)}}>Post Call without Validation</Button>
                        <Button className='submit-button' type="submit" variant="primary" >Submit</Button>
                      </React.Fragment>
                    }
                  </InputRow>
                </Form>
              </Tab>
              <Tab eventKey="access" title="Access" disabled>

              </Tab>
              <Tab eventKey="credentials" title="Credentials" disabled >

              </Tab>
              <Tab eventKey="tokens" title="Tokens" disabled>

              </Tab>
              <Tab eventKey="crypto" title="Crypto" disabled></Tab>
            </Tabs>
          </div>

        <Debug/>
      </div>
      )}
    </Formik>
  </React.Fragment>
  );
}

function gennerateValues(data){

  if(!data.client_id){
    data.client_id=uuidv1();
  }
  if(data.generate_client_secret){
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

function prepareEditData(data,initialValues){
  var new_values = Object.assign({},data);
  var old_values = Object.assign({},initialValues);
  var edits = {
    add:{},
    dlt:{},
    details:{}
  };
  edits.add.client_grant_type = new_values.grant_types.filter(x=>!old_values.grant_types.includes(x));
  edits.dlt.client_grant_type = old_values.grant_types.filter(x=>!new_values.grant_types.includes(x));
  edits.add.client_contact = new_values.contacts.filter(x=>!old_values.contacts.includes(x));
  edits.dlt.client_contact = old_values.contacts.filter(x=>!new_values.contacts.includes(x));
  edits.add.client_scope = new_values.scope.filter(x=>!old_values.scope.includes(x));
  edits.dlt.client_scope = old_values.scope.filter(x=>!new_values.scope.includes(x));
  edits.add.client_redirect_uri = new_values.redirect_uris.filter(x=>!old_values.redirect_uris.includes(x));
  edits.dlt.client_redirect_uri = old_values.redirect_uris.filter(x=>!new_values.redirect_uris.includes(x));

  for(var i in edits){
    for(var key in edits[i]){
      if(edits[i][key].length===0){
        delete edits[i][key]
      }
    }
  }

  delete new_values.grant_types;
  delete new_values.contacts;
  delete new_values.redirect_uris;
  delete new_values.scope;
  delete old_values.grant_types;
  delete old_values.contacts;
  delete old_values.redirect_uris;
  delete old_values.scope;

  if(diff(old_values,new_values)){
    edits.details = new_values;
  }
  return edits
}


export default FormTabs;
