import React,{useState,useEffect} from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {faCheckCircle,faBan,faSortDown} from '@fortawesome/free-solid-svg-icons';
import ButtonGroup from 'react-bootstrap/ButtonGroup';
import Row from 'react-bootstrap/Row';
import {ProcessingRequest} from './Components/LoadingBar';
import Col from 'react-bootstrap/Col';
import Collapse from 'react-bootstrap/Collapse';
import { diff } from 'deep-diff';
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


const PetitionForm = (props)=> {

  useEffect(()=>{
    console.log(props.changes);
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
    client_name:yup.string().min(4,'The Client Name must be at least 4 characters long').max(36,'The Client Name exceeds the character limit (15)').required('This is a required field!'),
    // Everytime client_id changes we make a fetch request to see if it is available.
    client_id:yup.string().min(4,'The Client ID must be at least 4 characters long').max(36,'The Client ID exceeds the character limit (35)').test('testAvailable','Client Id is not available',function(value){
        return new Promise((resolve,reject)=>{
          if(props.initialValues.client_id===value||!value){resolve(true)}
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
    code_challenge_method:yup.string().matches(reg.regCodeChalMeth).required('This is a required field!'),
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
  const [adminComment,setAdminComment] = useState();
  const [disabled,setDisabled] = useState(false);
  const [hasSubmitted,setHasSubmitted] = useState(false);
  const [message,setMessage] = useState();
  const [modalTitle,setModalTitle] = useState(null);
  const [checkingAvailability,setCheckingAvailability] = useState(false);
  const [imageError,setImageError] = useState(false); //
  const [checkedId,setcheckedId] = useState(); // Variable containing the last client Id checked for availability to limit check requests
  const [asyncResponse,setAsyncResponse] = useState(false);


  const createNewPetition = (petition) => {
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
      fetch(config.host+'petition/create', {
        method: 'POST', // *GET, POST, PUT, DELETE, etc.
        credentials: 'include', // include, *same-origin, omit
        headers: {
        'Content-Type': 'application/json'
        },
        body: JSON.stringify(petition) // body data type must match "Content-Type" header
      }).then(response=>response.json()).then(response=> {

        if(response.success){
          setAsyncResponse(false);
          if(props.user.admin){

            reviewPetition('approve',response.id);
          }
          else{
            setModalTitle('Your ' + type + ' request with id: ' + petition.client_id);
            if(response.success){
              setMessage('Was submited succesfully and is currently pending approval from an administrator.');
            }
            else{
              setMessage('Was not submited due to the following error: ' + response.error);
            }
          }
        }
        else{
          setModalTitle('Your ' + type + ' request with id: ' + petition.client_id);
          setMessage('Was not submited due to the following error: ' + response.error);
        }

      });
    }
    else{
      setAsyncResponse(false);
      setModalTitle('Request could not be submitted.');
      setMessage('Because no changes were made.');
    }
  }

  const editPetition = (petition) => {

    const editData = prepareEditData(petition,props.initialValues);

    if(Object.keys(editData.petition_details).length !== 0||Object.keys(editData.dlt).length !== 0||Object.keys(editData.add).length !== 0){
      setAsyncResponse(true);
      fetch(config.host+'petition/edit/'+props.petition_id, {
        method: 'POST', // *GET, POST, PUT, DELETE, etc.
        credentials: 'include', // include, *same-origin, omit
        headers: {
        'Content-Type': 'application/json'
        },
        body: JSON.stringify(editData) // body data type must match "Content-Type" header
      }).then(response=>response.json()).then(response=> {
        if(response.success){
          setAsyncResponse(false);
          if(props.user.admin){
              reviewPetition('approve',response.id);
          }
          else{
            setModalTitle('Your reconfiguration request for service with id: ' + petition.client_id);
            if(response.success){
              setMessage('Was submited succesfully and is currently pending approval from an administrator.');
            }
            else{
              setMessage('Was not submited due to the following error: ' + response.error);
            }
          }
        }
        else{
          setAsyncResponse(false);
          setModalTitle('Your reconfiguration request for service with id: ' + petition.client_id);
          setMessage('Was not submited due to the following error: ' + response.error);
        }
      })
    }
    else{
      setModalTitle('Request could not be submitted.');
      setMessage('Because no changes were made.');
    }
  }

  const deletePetition = ()=>{
    setAsyncResponse(true);
    fetch(config.host+'petition/delete/'+props.petition_id, {
      method: 'PUT', // *GET, POST, PUT, DELETE, etc.
      credentials: 'include', // include, *same-origin, omit
      headers: {
      'Content-Type': 'application/json'
    }}).then(response=>response.json()).then(response=> {

      if(props.type==='delete'){
          setModalTitle('Your deregistration request:');
      }
      else{
        setModalTitle('Your regonfiguration request:');
      }
      if(response.success){
        setAsyncResponse(false);
        setMessage('Was canceled succesfully');
      }
      else{
        setAsyncResponse(false);
        setMessage("Wasn't canceled due to the following error: " + response.error)
      }

    });
  }

  const reviewPetition = (type,id)=>{
      if(props.type==='create'){
        setModalTitle('Service registration request:');
      }
      else if (props.type==='delete'){
        setModalTitle('Service deregistration request:');
      }
      else if (props.type==='edit'){
          setModalTitle('Sevice reconfiguration request:');
      }

      if(type==='approve'){
        setAsyncResponse(true);
        fetch(config.host+'petition/approve/'+id, {
          method: 'PUT', // *GET, POST, PUT, DELETE, etc.
          credentials: 'include', // include, *same-origin, omit
          headers: {
          'Content-Type': 'application/json'
          },
          body:JSON.stringify({comment:adminComment})
      }).then(response=>response.json()).then(response=> {
          setModalTitle('Reconfiguration request:');
          if(response.success){
              setAsyncResponse(false);
              setMessage('Was approved, and changes have been commited.');

          }
          else{
            setAsyncResponse(false);
            setMessage("Could not be approved due to following error " +response.error );
          }
        });
      }
      else if (type==='reject') {
        setAsyncResponse(true);
        fetch(config.host+'petition/reject/'+id, {
          method: 'PUT', // *GET, POST, PUT, DELETE, etc.
          credentials: 'include', // include, *same-origin, omit
          headers: {
          'Content-Type': 'application/json'
          },
          body:JSON.stringify({comment:adminComment})
      }).then(response=>response.json()).then(response=> {

          if(response.success){
            setAsyncResponse(false);
            setMessage('Was rejected succesfully.');
          }
          else{
            setAsyncResponse(false);
            setMessage("Could not be rejected due to following error " +response.error );
          }
        });
      }
      else {
        setAsyncResponse(true);
        fetch(config.host+'petition/approve/changes/'+id, {
          method: 'PUT', // *GET, POST, PUT, DELETE, etc.
          credentials: 'include', // include, *same-origin, omit
          headers: {
          'Content-Type': 'application/json'
          },
          body:JSON.stringify({comment:adminComment})
      }).then(response=>response.json()).then(response=> {
          if(response.success){
            setAsyncResponse(false);
            setMessage('Was approved with changes.');
          }
          else{
            setAsyncResponse(false);
            setMessage("Could not be approved due to following error " +response.error );
          }
        });
      }
  }

  const postApi=(data)=>{
    data = gennerateValues(data);
    if(!props.type){
      createNewPetition(data);
    }
    else {
      editPetition(data);
    }
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
              <ProcessingRequest active={asyncResponse}/>
              <Form noValidate onSubmit={handleSubmit}>


                {props.disabled?null:
                  <div className="form-controls-container container">
                    {props.review?
                      <ReviewComponent petition_id={props.petition_id} setAdminComment={setAdminComment} adminComment={adminComment} reviewPetition={reviewPetition}/>
                      :
                      <React.Fragment>
                        <Button className='submit-button' type="submit" variant="primary" ><FontAwesomeIcon icon={faCheckCircle}/>Submit</Button>
                        {props.petition_id?<Button variant="danger" onClick={()=>deletePetition()}><FontAwesomeIcon icon={faBan}/>Cancel Request</Button>:null}
                      </React.Fragment>
                    }
                  </div>
                }


                <InputRow title='Client name' description='Human-readable application name' error={errors.client_name} touched={touched.client_name}>
                  <SimpleInput
                    name='client_name'
                    placeholder='Type something'
                    onChange={handleChange}
                    value={values.client_name}
                    isInvalid={hasSubmitted?!!errors.client_name:(!!errors.client_name&&touched.client_name)}
                    onBlur={handleBlur}
                    disabled={disabled}
                    changed={props.changes?props.changes.client_name:null}
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
                     disabled={disabled}
                     isloading={values.client_id&&values.client_id!==checkedId&&checkingAvailability?1:0}
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
                      disabled={disabled}
                      changed={props.changes?props.changes.redirect_uris:null}
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
                      disabled={disabled}
                      changed={props.changes?props.changes.integration_environment:null}
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
                      disabled={disabled}
                      changed={props.changes?props.changes.logo_uri:null}
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
                      disabled={disabled}
                      changed={props.changes?props.changes.client_description:null}
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
                      disabled={disabled}
                      changed={props.changes?props.changes.policy_uri:null}
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
                      disabled={disabled}
                      changed={props.changes?props.changes.contacts:null}
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
                      disabled={disabled}
                      onBlur={handleBlur}
                      changed={props.changes?props.changes.scope:null}
                    />
                  </InputRow>
                  <InputRow title='Grant Types' error={errors.grant_types} touched={true}>
                    <CheckboxList
                      name='grant_types'
                      values={values.grant_types}
                      listItems={formConfig.grant_types}
                      disabled={disabled}
                      changed={props.changes?props.changes.grant_types:null}

                    />
                  </InputRow>
                  <InputRow title='Introspection'>
                    <SimpleCheckbox
                      name='allow_introspection'
                      label="Allow calls to the Introspection Endpoint?"
                      onChange={handleChange}
                      disabled={disabled}
                      value={values.allow_introspection}
                      changed={props.changes?props.changes.allow_introspection:null}
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
                      disabled={disabled}
                      changed={props.changes?props.changes.client_secret:null}
                    />
                  </InputRow>
                  <InputRow title='Access Token Timeout' extraClass='time-input' error={errors.access_token_validity_seconds} touched={touched.access_token_validity_seconds} description='Enter this time in seconds, minutes, or hours (Max value is 1000000 seconds (11.5 days)).'>
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
                  <InputRow title='Refresh Tokens' extraClass='time-input' error={errors.refresh_token_validity_seconds} touched={touched.refresh_token_validity_seconds}>
                    <RefreshToken
                      values={values}
                      onBlur={handleBlur}
                      isInvalid={hasSubmitted?!!errors.refresh_token_validity_seconds:(!!errors.refresh_token_validity_seconds&&touched.refresh_token_validity_seconds)}
                      onChange={handleChange}
                      disabled={disabled}
                      changed={props.changes}
                    />
                  </InputRow>
                  <InputRow title='Device Code' extraClass='time-input' error={errors.device_code_validity_seconds} touched={touched.device_code_validity_seconds}>
                    <DeviceCode
                      onBlur={handleBlur}
                      values={values}
                      isInvalid={hasSubmitted?!!errors.device_code_validity_seconds:(!!errors.device_code_validity_seconds&&touched.device_code_validity_seconds)}
                      onChange={handleChange}
                      disabled={disabled}
                      changed={props.changes}
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
                      disabled={disabled}
                      changed={props.changes?props.changes.code_challenge_method:null}
                    />
                  </InputRow>
                  {props.disabled?null:
                    <div className="form-controls-container">
                      {props.review?
                          <ReviewComponent petition_id={props.petition_id} setAdminComment={setAdminComment} adminComment={adminComment} reviewPetition={reviewPetition}/>
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

        <Debug/>
      </div>
      )}
    </Formik>
  </React.Fragment>
  );
}

const ReviewComponent = (props)=>{

  const [typeOfReview,setTypeOfReview] = useState();
  const [expandReview,setExpandReview] = useState(false);
  const [error,setError] = useState(false);

  const handleReview = () =>{
      console.log(typeOfReview);
      if(expandReview){
        if(typeOfReview){
          if(typeOfReview==='request-changes'&&!props.adminComment){
            setError('Cannot request changes without leaving a comment for the requester.');
          }
          props.reviewPetition(typeOfReview,props.petition_id);
        }
        else {

          setError('You have to first select one of the options from bellow.')
        }

      }else{
        setError(false);
        setExpandReview(true);
      }
  }
  return (
    <React.Fragment>
        <Row className="review-button-row">
          <ButtonGroup>
            <Button className="review-button" variant="success" onClick={()=> handleReview()}>{expandReview?'Submit Review':
              <React.Fragment>
                Review
                <FontAwesomeIcon icon={faSortDown}/>
              </React.Fragment>
              }</Button>
              {expandReview?
                <Button variant="success" className="review-button-expand" onClick={()=>setExpandReview(!expandReview)}>
                  <FontAwesomeIcon icon={faSortDown}/>
                </Button>:null}

          </ButtonGroup>
          {error&&expandReview?
            <div className="review-error">
              {error}
            </div>
            :null}
        </Row>
        <Collapse in={expandReview}>
        <div className="expand-container">
        <div className="review-controls flex-column">
        <Form.Group>
          <Row>
            <Col md="auto" className="review-radio-col">
              <Form.Check
                type="radio"
                name="formHorizontalRadios"
                id="formHorizontalRadios1"
                onChange={(e)=>{if(e.target.checked){setTypeOfReview(e.target.value)}}}
                value="approve"
                checked={typeOfReview==='approve'}
              />
            </Col>
            <Col onClick={()=>{
              setTypeOfReview('approve');
            }}>
              <Row>
                <strong>
                  Approve
                </strong>
              </Row>
              <Row className="review-option-desc">
                Submit feedback and approve service changes.
              </Row>
            </Col>
          </Row>
          <Row>
            <Col md="auto" className="review-radio-col">
              <Form.Check
                type="radio"
                name="formHorizontalRadios"
                id="formHorizontalRadios2"
                onChange={(e)=>{if(e.target.checked){setTypeOfReview(e.target.value)}}}
                value="reject"
                checked={typeOfReview==='reject'}
              />
            </Col>
            <Col onClick={()=>{
                setTypeOfReview('reject');
            }}>
              <Row>
                <strong>
                  Reject
                </strong>
              </Row>
              <Row className="review-option-desc">
                Submit feedback and reject service changes.
              </Row>
            </Col>
          </Row>
          <Row>
            <Col md="auto" className="review-radio-col">
              <Form.Check
                type="radio"
                name="formHorizontalRadios"
                id="formHorizontalRadios3"
                onChange={(e)=>{if(e.target.checked){setTypeOfReview(e.target.value)}}}
                value="request-changes"
                checked={typeOfReview==='request-changes'}
              />
            </Col>
            <Col onClick={()=>{
              setTypeOfReview('request-changes');
            }}>
              <Row>
                <strong>
                  Request Changes
                </strong>
              </Row>
              <Row className="review-option-desc">
                Submit feedback that must be addressed before changes can be made.
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
          placeholder="Leave a comment for the requester..."
          onChange={e => props.setAdminComment(e.target.value)}
          value={props.adminComment}
        />

      </Row>
    </div>

  </Collapse>
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
  let new_cont = [];
  let old_cont = [];
  let items;
  var edits = {
    add:{},
    dlt:{},
    petition_details:{}
  };

  new_values.contacts.forEach(item=>{
    new_cont.push(item.email+' '+item.type);
  });
  old_values.contacts.forEach(item=>{
    old_cont.push(item.email+' '+item.type);
  });
  edits.add.client_contact = new_cont.filter(x=>!old_cont.includes(x));
  edits.dlt.client_contact = old_cont.filter(x=>!new_cont.includes(x));
  if(edits.add.client_contact.length>0){
      edits.add.client_contact.forEach((item,index)=>{
        items = item.split(' ');
        edits.add.client_contact[index] = {email:items[0],type:items[1]};
      })
  }
  if(edits.dlt.client_contact.length>0){
      edits.dlt.client_contact.forEach((item,index)=>{
        items = item.split(' ');
        edits.dlt.client_contact[index] = {email:items[0],type:items[1]};
    })
  }

  edits.add.client_grant_type = new_values.grant_types.filter(x=>!old_values.grant_types.includes(x));
  edits.dlt.client_grant_type = old_values.grant_types.filter(x=>!new_values.grant_types.includes(x));
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
    edits.petition_details = new_values;
  }
  return edits
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


export default PetitionForm
