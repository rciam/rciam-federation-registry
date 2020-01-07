import React,{useState} from 'react';
import Tabs from 'react-bootstrap/Tabs';
import Tab from 'react-bootstrap/Tab';

import {Debug} from './Debug.js';
import Form from 'react-bootstrap/Form';
import 'bootstrap/dist/css/bootstrap.min.css';
import {Formik} from 'formik';
import * as config from './config.json';
import InputRow from './InputRow.js';
import Button from 'react-bootstrap/Button'
import * as yup from 'yup';
import { useReactOidc } from '@axa-fr/react-oidc-context';
import {SimpleInput,DeviceCode,Select,ListInput,LogoInput,TextAria,ListInputArray,CheckboxList,SimpleCheckbox,ClientSecret,TimeInput,RefreshToken} from './Inputs.js'// eslint-disable-next-line
const {reg} = require('./regex.js');
const schema = yup.object({
  client_name:yup.string().min(4,'The Client Name must be at least 4 characters long').max(15,'The Client Name exceeds the character limit (15)').required('This is a required field!'),
  client_id:yup.string().min(4,'The Client ID must be at least 4 characters long').max(15,'The Client ID exceeds the character limit (15)').required('This is a required field!'),
  redirect_uris:yup.array().of(yup.string().matches(reg.regUrl,'This must be a secure Url starting with https://')).required('This is a required field!'),
  logo_uri:yup.string().required('This is a required field!').test('testImage','Enter a valid image Url',function(value){return imageError}),
  policy_uri:yup.string().required('This is a required field!').matches(reg.regSimpleUrl,'Enter a valid Url'),
  client_description:yup.string().required('This is a required field!'),
  contacts:yup.array().of(yup.string().email('Enter a valid email address').required('Contact email cannot be empty')).required('This is a required field!'),
  scope:yup.array().of(yup.string().min(1,'Scope cannot be empty').max(50,'Scope exceeds character limit (50)').matches(reg.regScope,'Scope must consist of small letters and underscores')).required('This is a required field!'),
  grant_types:yup.array().of(yup.string().test('testGrantTypes','error-granttypes',function(value){return ['implicit','authorization_code','refresh_token','client_credentials','password','redelegation','token_exchange','device'].includes(value)})).required('At least one option must be selected'),
  access_token_validity_seconds:yup.number().min(0).max(1000000,'Exceeds the maximum value').required('This is a required field!'),
  refresh_token_validity_seconds:yup.number().min(0).max(34128000,'Exceeds the maximum value').required('This is a required field!'),
  device_code_validity_seconds:yup.number().min(0).max(34128000,'Exceeds the maximum value').required('This is a required field!'),
  code_challenge_method:yup.string().matches(reg.regCodeChalMeth),
  allow_introspection:yup.boolean().required(),
  generate_client_secret:yup.boolean().required(),
  reuse_refresh_tokens:yup.boolean().required(),
  clear_access_tokens_on_refresh:yup.boolean().required(),
  client_secret:yup.string().when('generate_client_secret',{
    is:false,
    then: yup.string().required('Client Secret cannot be empty').min(4,'Client Secret must e at least 4 characters long').max(15,'Client Secret must not exceed the character limit (15)')
  }).nullable(),

});
var imageError = false;
const FormTabs = (props)=> {

  const [hasSubmitted,setHasSubmitted] = useState(false)
  const { oidcUser } = useReactOidc();

  const setImageError=(value)=>{
    imageError=value;
  }

  const postApi=(data)=>{
    fetch(config.localhost+'client', {
      method: 'POST', // *GET, POST, PUT, DELETE, etc.
      credentials: 'same-origin', // include, *same-origin, omit
      headers: {
      'Authorization': 'Bearer ' + oidcUser.access_token,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(data) // body data type must match "Content-Type" header
  }).then(response=>response.json()).then(response=> {
    console.log(response);
  })
}




    return(

      <Formik
      initialValues={props.initialValues}
        validationSchema={schema}
        onSubmit={(values,{setSubmitting}) => {
          console.log("test");
          setHasSubmitted(true);
          postApi(values);

        }}
      >
      {({
        handleSubmit,
        handleChange,
        handleBlur,
        values,
        setFieldTouched,
        touched,
        isValid,
        validateField,
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
                     />
                   </InputRow>
                   <InputRow title='Client ID' description='Unique identifier. If you leave this blank it will be automatically generated.' error={errors.client_id} touched={touched.client_id}>
                     <SimpleInput
                       name='client_id'
                       placeholder='Type something'
                       onChange={handleChange}
                       value={values.client_id}
                       isInvalid={hasSubmitted?!!errors.client_id:(!!errors.client_id&&touched.client_id)}
                       onBlur={handleBlur}
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
                      />
                    </InputRow>
                    <InputRow title='Contacts' error={typeof(errors.contacts)=='string'?errors.contacts:null} touched={touched.contacts} description='List of contacts for administrators of this client.'>
                      <ListInput
                        values={values.contacts}
                        placeholder='New contact'
                        name='contacts'
                        empty={typeof(errors.contacts)=='string'?true:false}
                        error={errors.contacts}
                        touched={touched.contacts}
                        onChange={handleChange}
                        onBlur={handleBlur}
                        setFieldTouched={setFieldTouched}
                      />
                    </InputRow>
                    <InputRow title='Scope' description='OAuth scopes this client is allowed to request'>
                      <ListInputArray
                        name='scope'
                        values={values.scope}
                        placeholder='New scope'
                        defaultValues= {['openid','email','profile','offline_access','eduperson_entitlement','eduperson_scoped_affiliation','eduperson_unique_id','refeds_edu']}
                        error={errors.scope}
                        touched={touched.scope}


                        onBlur={handleBlur}
                      />
                    </InputRow>
                    <InputRow title='Grant Types' error={errors.grant_types} touched={true}>
                      <CheckboxList
                        name='grant_types'
                        values={values.grant_types}
                        listItems={['implicit','authorization_code','refresh_token','client_credentials','password','redelegation','token_exchange','device']}
                      />
                    </InputRow>
                    <InputRow title='Introspection'>
                      <SimpleCheckbox
                        name='allow_introspection'
                        label="Allow calls to the Introspection Endpoint?"
                        onChange={handleChange}
                      />
                    </InputRow>
                    <InputRow title='Client Secret'>
                      <ClientSecret
                        onChange={handleChange}
                        feedback='not good'
                        clientSecret={values.client_secret}
                        error={errors.client_secret}
                        touched={touched.client_secret}
                        isInvalid={hasSubmitted?!!errors.client_secret:(!!errors.client_secret&&touched.client_secret)}
                        onBlur={handleBlur}
                        generate_client_secret={values.generate_client_secret}
                      />
                    </InputRow>
                    <InputRow title='Access Token Timeout' extraClass='time-input' error={errors.access_token_validity_seconds} touched={touched.access_token_validity_seconds} description='Enter this time in seconds, minutes, or hours (Max value is 1000000 seconds (11.5 days)).'>
                      <TimeInput
                        name='access_token_validity_seconds'
                        value={values.access_token_validity_seconds}
                        isInvalid={hasSubmitted?!!errors.access_token_validity_seconds:(!!errors.access_token_validity_seconds&&touched.access_token_validity_seconds)}
                        onBlur={handleBlur}
                        onChange={handleChange}
                      />
                    </InputRow>
                    <InputRow title='Refresh Tokens' extraClass='time-input' error={errors.refresh_token_validity_seconds} touched={touched.refresh_token_validity_seconds}>
                      <RefreshToken
                        values={values}
                        onBlur={handleBlur}
                        isInvalid={hasSubmitted?!!errors.refresh_token_validity_seconds:(!!errors.refresh_token_validity_seconds&&touched.refresh_token_validity_seconds)}
                        onChange={handleChange}
                      />
                    </InputRow>
                    <InputRow title='Device Code' extraClass='time-input' error={errors.device_code_validity_seconds} touched={touched.device_code_validity_seconds}>
                      <DeviceCode
                        onBlur={handleBlur}
                        values={values}
                        isInvalid={hasSubmitted?!!errors.device_code_validity_seconds:(!!errors.device_code_validity_seconds&&touched.device_code_validity_seconds)}
                        onChange={handleChange}
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
                      />
                    </InputRow>

                    <InputRow extraClass='time-input'>

                      <Button className='post-button' type="button" variant="danger" onClick={()=> {postApi(values)}}>Post Call without Validation</Button>
                      <Button className='submit-button' type="submit" variant="primary" >Submit</Button>

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



   );
   }
export default FormTabs;
