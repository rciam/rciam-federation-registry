import React, {useState} from 'react';
import Col from 'react-bootstrap/Col';
import { Field, FieldArray,FormikConsumer } from 'formik';
import Form from 'react-bootstrap/Form';
import InputGroup from 'react-bootstrap/InputGroup';
import Button from 'react-bootstrap/Button';
import Image from 'react-bootstrap/Image';
import Table from 'react-bootstrap/Table'

export function SimpleInput(props){
  return (
        <Form.Control
          {...props}
          type="text"
          className='col-form-label-sm'
        />
  )
}

export function TextAria(props) {
  return (
        <Form.Control
          {...props}
          as="textarea"
          rows="3"

      />
  )
}

export function SimpleCheckbox(props){
  return(
        <Form.Check
          {...props}
          className="checkbox col-form-label"
         />
  )
}

export function TimeInput(props){
  const [timeMetric,setTimeMetric] = useState('0');
  var reg = /^-?\d*\.?\d*$/;
  return(
    <React.Fragment>
      <Col sm="4">
       <Form.Control
        {...props}
         type='text'
         className='col-form-label-sm'
         value={Math.round(props.value/(timeMetric==='0'?1:(timeMetric==='1'?60:3600)) * 100) / 100}
         onChange={(e)=>{
           if(reg.test(e.target.value)){
           e.target.value= e.target.value*(timeMetric==='0'?1:(timeMetric==='0'?1:(timeMetric==='1'?60:3600)));
           props.onChange(e);}
          }
         }
       />
      </Col>
      <Col sm="4" >
        <Form.Control as="select" onChange={(e)=>{
          setTimeMetric(e.target.value)
        }}>
          <option value='0'>seconds</option>
          <option value='1'>minutes</option>
          <option value='2'>hours</option>
        </Form.Control>
      </Col>
    </React.Fragment>
  )
}
export function Select(props){
  return(
    <Field
    className="select-input"
    name={props.name}
    component="select"
    placeholder="Select...">
      {props.options.map((item,index)=>(
        <option key={index} value={props.options[index]}>{props.optionsTitle[index]}</option>
      ))}
    </Field>
  )
}

export function CheckboxList(props){
  return (
        props.listItems.map((item,index)=>(
          <div className="checkboxList" key={index}>
            <Checkbox name={props.name} value={item}/>
            {item.replace("_"," ")}
          </div>
        ))
  )
}
export function RefreshToken(props){

    return(
      <React.Fragment>
        <div className="checkbox-item">
          <Checkbox name="scope" value='offline_access'/>
          Refresh tokens are issued for this client
        </div>
        <Form.Text className="text-muted text-left label-checkbox" id="uri-small-desc">
          This will add the offline_access scope to the client's scopes.
        </Form.Text>
        {props.values.scope.includes('offline_access')?(
          <React.Fragment>
            <div className="checkbox-item">
              <SimpleCheckbox name="reuse_refresh_tokens" label='Refresh tokens for this client are re-used'checked={props.values.reuse_refresh_tokens} onChange={props.onChange} />

            </div>
            <div className="checkbox-item">
            <SimpleCheckbox
              name="clear_access_tokens_on_refresh"
              label='Active access tokens are automatically revoked when the refresh token is used'
              checked={props.values.clear_access_tokens_on_refresh}
              onChange={props.onChange} />
            </div>
            <TimeInput
              name='refresh_token_validity_seconds'
              value={props.values.refresh_token_validity_seconds}
              isInvalid={props.isInvalid}
              onBlur={props.onBlur}
              onChange={props.onChange}
            />
            <Form.Text className="text-muted text-left label-checkbox" id="uri-small-desc">
              Enter this time in seconds, minutes, or hours (Max value is 34128000 seconds (13 months)).
            </Form.Text>
          </React.Fragment>
          ):null}

      </React.Fragment>
    )
}
export function DeviceCode(props){
  return(
    <React.Fragment>
      <div className="checkbox-item">
        <Checkbox name="grant_types" value='device'/>
        Refresh tokens are issued for this client
      </div>
      <Form.Text className="text-muted text-left label-checkbox" id="uri-small-desc">
        This will add the offline_access scope to the client's scopes.
      </Form.Text>
      {props.values.grant_types.includes('device')?(
        <React.Fragment>
          <TimeInput
            name='device_code_validity_seconds'
            value={props.values.device_code_validity_seconds}
            isInvalid={props.isInvalid}
            onBlur={props.onBlur}
            onChange={props.onChange}
          />
          <Form.Text className="text-muted text-left label-checkbox" id="uri-small-desc">
            Enter this time in seconds, minutes, or hours (Max value is 34128000 seconds (13 months)).
          </Form.Text>
        </React.Fragment>
        ):null}

    </React.Fragment>
  )
}

export function ClientSecret(props){
  const [editSecret,toggleEditSecret] = useState(true);
  return(
    <React.Fragment>
      <Form.Check
        name="generate_client_secret"
        label="Generate a new client secret?"
        onChange={props.onChange}
        checked={props.generate_client_secret}
        className="checkbox col-form-label"
       />
       <Form.Text className="text-muted text-left label-checkbox" id="uri-small-desc">
         New secret will be generated when you click 'Save'
       </Form.Text>
       {props.generate_client_secret?
         (
         <Form.Control
           type="text"
           name="client_secret"
           className='col-form-label-sm'
           value="Generate on Save"
           disabled={true}
         />):(
         <React.Fragment>
           <Form.Check
             label="Display/edit client secret:"
             checked={!editSecret}
             onChange={()=>{toggleEditSecret(!editSecret)}}
             className="checkbox col-form-label"
            />
            {!editSecret?<Form.Control
              type="text"
              name="client_secret"
              className='col-form-label-sm'
              onChange={props.onChange}
              isInvalid={props.isInvalid}
              onBlur={props.onBlur}
              placeholder='Type a secret'
              value={props.client_secret}
            />:<Form.Control
              type="text"
              name="clientSecretHelp"
              className='col-form-label-sm'
              value="*************"
              isInvalid={props.isInvalid}
              disabled={true}
            />
           }
           {props.error && props.touched ? (
                 <div className="error-message">{props.error}</div>
               ) : null}
         </React.Fragment>
        )}
    </React.Fragment>
  )
}

export function ListInputArray(props){
  const [newVal,setNewVal] = useState('');
  return (
        <Table striped bordered hover size="sm" className='input-list-table'>
          <thead>
            <tr>
              <th>
                <InputGroup>
                    <Form.Control
                      placeholder={props.placeholder}
                      type="text"
                      value={newVal}
                      onChange={(event)=>{
                        setNewVal(event.target.value);
                      }}
                     />
                </InputGroup>
              </th>
              <th>
                <FieldArray
                  name={props.name}
                  render={arrayHelpers =>(
                    <Button
                      variant="dark"
                      onClick={()=>{
                        arrayHelpers.push(newVal);
                        setNewVal('');
                      }}
                      className="addButton"
                    >
                      +
                    </Button>
                  )}
                />
              </th>
            </tr>
        </thead>
        <tbody>
          {props.defaultValues.map((item,index)=>(
            <tr key={index}>
              <td className='td-item'>{item}</td>
              <td>
                <Checkbox name={props.name} value={item}/>
              </td>
            </tr>
          ))}
          <FieldArray
            name={props.name}
            render={arrayHelpers =>(
              props.values.map((item,index)=>{
                if(!props.defaultValues.includes(item)){
                  return(
                    <React.Fragment key={index}>
                    <tr className={(Array.isArray(props.error)||typeof(props.error)=='string')&&props.error[index]?'error-tr':null}>
                      <td className="td-item">
                        {item}
                      </td>
                      <td>
                        <Button
                          variant="danger"
                          onClick={()=>{arrayHelpers.remove(index)}}
                          className="removeButton"
                        >
                          -
                        </Button>
                      </td>
                    </tr>
                    {Array.isArray(props.error) || typeof(props.error)=='string'?<tr><td className='error-td'><div className="error-message-list-item">{props.error[index]}</div></td><td></td></tr>:null}

                    </React.Fragment>
                  )
                }
                else return null
              })
            )}
          />
        </tbody>
      </Table>
  )
}

export  function LogoInput(props){

  const addDefaultSrc= (ev)=>{
      props.setImageError(false);
      ev.target.src = process.env.PUBLIC_URL + '/logo_placeholder.gif';
  }
  const imageLoad = (ev)=>{
      if((!ev.target.src.includes('/logo_placeholder.gif'))){
        props.setImageError(true);
        props.validateField('logo_uri');
      }
  }

  return (
    <React.Fragment>
      <Form.Control
        type="text"
        name={props.name}
        className='col-form-label-sm'
        placeholder="https//"
        value={props.value}
        onBlur={props.onBlur}
        onChange={(e)=>{props.onChange(e)}}
        isInvalid={props.isInvalid}
      />
      <Form.Text className="text-muted text-left">
        {props.description}
      </Form.Text>
      {props.error && props.touched ? (typeof(props.error)=='string')?(<div className="error-message">{props.error}</div>):(<div className="error-message">Image not valid</div>):null}
      <FormikConsumer>
        {({ validationSchema, validate, onSubmit, ...rest }) => (
          <pre
            style={{
              fontSize: '.65rem',
              padding: '.25rem .5rem',
              overflowX: 'scroll',
            }}
          >
            <Image src={props.value ? props.value:process.env.PUBLIC_URL + '/logo_placeholder.gif'} onLoad={imageLoad} onError={addDefaultSrc} fluid />

          </pre>
        )}
      </FormikConsumer>
    </React.Fragment>
  )
}

export function ListInput(props){
  const [newVal,setNewVal] = useState('');
  return (
        <FieldArray name={props.name}>
          {({push,remove,insert})=>(
            <React.Fragment>

              <InputGroup className={props.empty&&props.touched?'invalid-input mb-3':'mb-3'}>
                <Form.Control
                  value={newVal}
                  onChange={(e)=>{setNewVal(e.target.value)}}
                  column="true"
                  sm="4"
                  onBlur={()=>{!props.touched?props.setFieldTouched(props.name,true):console.log('sdf')}}
                  type="text"
                  className='col-form-label.sm'
                  placeholder={props.placeholder}
                />
                <InputGroup.Prepend>
                  <Button
                    variant="outline-primary"
                    onClick={()=>{
                      push(newVal);
                      setNewVal('');
                    }}
                  >
                    ADD
                  </Button>
                </InputGroup.Prepend>
              </InputGroup>
              {props.values && props.values.length > 0 && props.values.map((item,index)=>(
                <React.Fragment key={index}>
                <InputGroup className="mb-3" >
                  <Field name={`${props.name}.${index}`}>
                    {({field,form})=>(
                      <React.Fragment>
                        <Form.Control
                          {...field}
                          onBlur={props.handleBlur}
                          onChange={props.onChange}
                          isInvalid={Array.isArray(props.error)?!!props.error[index]:false}
                          column="true"
                          sm="4"
                          type="text"
                          className='col-form-label.sm'
                          placeholder="https//"
                        />
                        <InputGroup.Prepend>
                          <Button variant="outline-danger" onClick={()=>remove(index)}>Remove</Button>
                        </InputGroup.Prepend>
                      </React.Fragment>
                    )}
                  </Field>
                  <br/>
                </InputGroup>
                <div className="error-message-list-item">{Array.isArray(props.error)?props.error[index]:''}</div>
                </React.Fragment>
              ))}
            </React.Fragment>
          )}
        </FieldArray>
  )
}

export function Checkbox(props) {
  return (
    <Field name={props.name}>
      {({ field, form }) => (
          <input
            type="checkbox"
            {...props}
            checked={field.value.includes(props.value)}
            onChange={() => {
              if (field.value.includes(props.value)) {
                const nextValue = field.value.filter(
                  value => value !== props.value
                );
                form.setFieldValue(props.name, nextValue);
              } else {
                const nextValue = field.value.concat(props.value);
                form.setFieldValue(props.name, nextValue);
              }
            }}
          />
      )}
    </Field>
  );
}
