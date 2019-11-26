import React from 'react';
import Tabs from 'react-bootstrap/Tabs';
import Tab from 'react-bootstrap/Tab';
import initialValues from './initialValues'
import Form from 'react-bootstrap/Form';
import 'bootstrap/dist/css/bootstrap.min.css';
import {Formik} from 'formik';
import {Debug} from './Debug.js';
import InputRow from './InputRow.js';
import Button from 'react-bootstrap/Button'
import * as yup from 'yup';
import {SimpleInput,DeviceCode,Select,ListInput,LogoInput,TextAria,ListInputArray,CheckboxList,SimpleCheckbox,ClientSecret,TimeInput,RefreshToken} from './Inputs.js'// eslint-disable-next-line
const {reg} = require('./regex.js');
const schema = yup.object({
  clientName:yup.string().min(4,'The Client Name must be at least 4 characters long').max(15,'The Client Name exceeds the character limit (15)').required('This is a required field!'),
  clientId:yup.string().min(4,'The Client ID must be at least 4 characters long').max(15,'The Client ID exceeds the character limit (15)').required('This is a required field!'),
  redirectUris:yup.array().of(yup.string().matches(reg.regUrl,'This must be a secure Url starting with https://')).required('This is a required field!'),
  logoUri:yup.string().required('This is a required field!').test('testImage','Enter a valid image Url',function(value){return imageError}),
  policyUri:yup.string().required('This is a required field!').matches(reg.regSimpleUrl,'Enter a valid Url'),
  clientDescription:yup.string().required('This is a required field!'),
  contacts:yup.array().of(yup.string().email('Enter a valid email address').required('Contact email cannot be empty')).required('This is a required field!'),
  scope:yup.array().of(yup.string().min(1,'Scope cannot be empty').max(50,'Scope exceeds character limit (50)').matches(reg.regScope,'Scope must consist of small letters and underscores')).required('This is a required field!'),
  grantTypes:yup.array().of(yup.string().test('testGrantTypes','error-granttypes',function(value){return ['implicit','authorization_code','refresh_token','client_credentials','password','redelegation','token_exchange','device'].includes(value)})).required('At least one option must be selected'),
  accessTokenValiditySeconds:yup.number().min(0).max(1000000,'Exceeds the maximum value').required('This is a required field!'),
  refreshTokenValiditySeconds:yup.number().min(0).max(34128000,'Exceeds the maximum value').required('This is a required field!'),
  device_code_validity_seconds:yup.number().min(0).max(34128000,'Exceeds the maximum value').required('This is a required field!'),
  code_challenge_method:yup.string().matches(reg.regCodeChalMeth),
  allowIntrospection:yup.boolean().required(),
  generateClientSecret:yup.boolean().required(),
  reuse_refresh_tokens:yup.boolean().required(),
  clear_access_tokens_on_refresh:yup.boolean().required(),
  clientSecret:yup.string().when('generateClientSecret',{
    is:false,
    then: yup.string().required('Client Secret cannot be empty').min(4,'Client Secret must e at least 4 characters long').max(15,'Client Secret must not exceed the character limit (15)')
  }).nullable(),

});
var imageError = false;
export default class FormTabs extends React.Component {
  constructor(props) {
  super(props);
  this.state = {hasSubmited:false};
  }

  setImageError(value){
    imageError=value;
  }
  postApi(data){

    fetch('http://localhost:5000/client', {
      method: 'POST', // *GET, POST, PUT, DELETE, etc.
      credentials: 'same-origin', // include, *same-origin, omit
      headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(data) // body data type must match "Content-Type" header
  }).then(response=>response.json()).then(response=>console.log(response))
  }

  render() {

    return(
      <Formik
      initialValues={initialValues}
        validationSchema={schema}
        onSubmit={(values,{setSubmitting}) => {
          this.postApi(values);
          this.setState({hasSubmited:true});
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
        errors,
        isSubmitting})=>(
        <div className="tab-panel">

            <div id="form-container">

              <Tabs defaultActiveKey="main" id="uncontrolled-tab-example">
                <Tab eventKey="main" title="Main">
                <Form noValidate onSubmit={handleSubmit}>
                  <InputRow title='Client name' description='Human-readable application name' error={errors.clientName} touched={touched.clientName}>
                    <SimpleInput
                      name='clientName'
                      placeholder='Type something'
                      onChange={handleChange}
                      value={values.clientName}
                      isInvalid={this.state.hasSubmitted?!!errors.clientName:(!!errors.clientName&&touched.clientName)}
                      onBlur={handleBlur}
                     />
                   </InputRow>
                   <InputRow title='Client ID' description='Unique identifier. If you leave this blank it will be automatically generated.' error={errors.clientId} touched={touched.clientId}>
                     <SimpleInput
                       name='clientId'
                       placeholder='Type something'
                       onChange={handleChange}
                       value={values.clientId}
                       isInvalid={this.state.hasSubmitted?!!errors.clientId:(!!errors.clientId&&touched.clientId)}
                       onBlur={handleBlur}
                      />
                    </InputRow>
                    <InputRow title='Redirect URI(s)' error={typeof(errors.redirectUris)=='string'?errors.redirectUris:null}  touched={touched.redirectUris} description='URIs that the client can be redirected to after the authorization page'>
                      <ListInput
                        values={values.redirectUris}
                        placeholder='https://'
                        empty={(typeof(errors.redirectUris)=='string')?true:false}
                        name='redirectUris'
                        error={errors.redirectUris}
                        touched={touched.redirectUris}
                        hasSubmited={this.state.hasSubmitted}
                        onBlur={handleBlur}
                        setFieldTouched={setFieldTouched}
                      />
                    </InputRow>
                    <InputRow title='Logo'>
                      <LogoInput
                        setImageError={this.setImageError}
                        value={values.logoUri}
                        name='logoUri'
                        description='URL that points to a logo image, will be displayed on approval page'
                        onChange={handleChange}
                        error={errors.logoUri}
                        touched={touched.logoUri}
                        onBlur={handleBlur}
                        validateField={validateField}
                        isInvalid={this.state.hasSubmitted?!!errors.logoUri:(!!errors.logoUri&&touched.logoUri)}
                      />

                    </InputRow>
                    <InputRow title='Description' description='Human-readable text description' error={errors.clientDescription} touched={touched.clientDescription}>
                      <TextAria
                        value={values.clientDescription}
                        onChange={handleChange}
                        onBlur={handleBlur}
                        name='clientDescription'
                        placeholder="Type a description"
                        isInvalid={this.state.hasSubmitted?!!errors.clientDescription:(!!errors.clientDescription&&touched.clientDescription)}
                      />
                    </InputRow>
                    <InputRow title='Policy Statement' description='URL for the Policy Statement of this client, will be displayed to the user' error={errors.policyUri} touched={touched.policyUri}>
                      <SimpleInput
                        name='policyUri'
                        placeholder='https://'
                        onChange={handleChange}
                        value={values.policyUri}
                        isInvalid={this.state.hasSubmitted?!!errors.policyUri:(!!errors.policyUri&&touched.policyUri)}
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
                        hasSubmited={this.state.hasSubmited}

                        onBlur={handleBlur}
                      />
                    </InputRow>
                    <InputRow title='Grant Types' error={errors.grantTypes} touched={true}>
                      <CheckboxList
                        name='grantTypes'
                        values={values.grantTypes}
                        listItems={['implicit','authorization_code','refresh_token','client_credentials','password','redelegation','token_exchange','device']}
                      />
                    </InputRow>
                    <InputRow title='Introspection'>
                      <SimpleCheckbox
                        name='allowIntrospection'
                        label="Allow calls to the Introspection Endpoint?"
                        onChange={handleChange}
                      />
                    </InputRow>
                    <InputRow title='Client Secret'>
                      <ClientSecret
                        onChange={handleChange}
                        feedback='not good'
                        clientSecret={values.clientSecret}
                        error={errors.clientSecret}
                        touched={touched.clientSecret}
                        isInvalid={this.state.hasSubmitted?!!errors.clientSecret:(!!errors.clientSecret&&touched.clientSecret)}
                        onBlur={handleBlur}
                        generateClientSecret={values.generateClientSecret}
                      />
                    </InputRow>
                    <InputRow title='Access Token Timeout' extraClass='time-input' error={errors.accessTokenValiditySeconds} touched={touched.accessTokenValiditySeconds} description='Enter this time in seconds, minutes, or hours (Max value is 1000000 seconds (11.5 days)).'>
                      <TimeInput
                        name='accessTokenValiditySeconds'
                        value={values.accessTokenValiditySeconds}
                        isInvalid={this.state.hasSubmitted?!!errors.accessTokenValiditySeconds:(!!errors.accessTokenValiditySeconds&&touched.accessTokenValiditySeconds)}
                        onBlur={handleBlur}
                        onChange={handleChange}
                      />
                    </InputRow>
                    <InputRow title='Refresh Tokens' extraClass='time-input' error={errors.refreshTokenValiditySeconds} touched={touched.refreshTokenValiditySeconds}>
                      <RefreshToken
                        values={values}
                        onBlur={handleBlur}
                        isInvalid={this.state.hasSubmitted?!!errors.refreshTokenValiditySeconds:(!!errors.refreshTokenValiditySeconds&&touched.refreshTokenValiditySeconds)}
                        onChange={handleChange}
                      />
                    </InputRow>
                    <InputRow title='Device Code' extraClass='time-input' error={errors.device_code_validity_seconds} touched={touched.device_code_validity_seconds}>
                      <DeviceCode
                        onBlur={handleBlur}
                        values={values}
                        isInvalid={this.state.hasSubmitted?!!errors.device_code_validity_seconds:(!!errors.device_code_validity_seconds&&touched.device_code_validity_seconds)}
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
                        isInvalid={this.state.hasSubmitted?!!errors.code_challenge_method:(!!errors.code_challenge_method&&touched.code_challenge_method)}
                        onChange={handleChange}
                      />
                    </InputRow>
                    <InputRow extraClass='time-input'>
                      <Button className='post-button' type="button" variant="danger" onClick={()=> {this.postApi(values)}}>Post Call without Validation</Button>
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
}
