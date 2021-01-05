import React, {useState, useRef ,useEffect} from 'react';
import Col from 'react-bootstrap/Col';
import { Field, FieldArray,FormikConsumer } from 'formik';
import Form from 'react-bootstrap/Form';
import InputGroup from 'react-bootstrap/InputGroup';
import Button from 'react-bootstrap/Button';
import Image from 'react-bootstrap/Image';
import Table from 'react-bootstrap/Table';
import Tooltip from 'react-bootstrap/Tooltip';
import Overlay from 'react-bootstrap/Overlay';
import * as formConfig from '../form-config.json';
import { useTranslation } from 'react-i18next';
/*
const [show, setShow] = useState(false);
const target = useRef(null);
ref={target}
onMouseOver={()=>setShow(true)}
onMouseOut={()=>setShow(false)}
<MyOverLay show={props.changed&&show} type='Edited' target={target}/>
*/

export function SimpleInput(props){
  const [show, setShow] = useState(false);
  const target = useRef(null);
  return (
        <React.Fragment>
          <Form.Control
            {...props}
            type="text"
            ref={target}
            onMouseOver={()=>setShow(true)}
            onMouseOut={()=>setShow(false)}
            className={props.changed?'col-form-label-sm input-edited':'col-form-label-sm'}
          />
          <MyOverLay show={props.changed&&show?'string':null} type='Edited' target={target}/>
          {props.isloading?<div className="loader"></div>:null}
        </React.Fragment>
  )
}

export function TextAria(props) {
  const [show, setShow] = useState(false);
  const target = useRef(null);
  return (
    <React.Fragment>
        <Form.Control
          {...props}
          as="textarea"
          rows="3"
          ref={target}
          onMouseOver={()=>setShow(true)}
          onMouseOut={()=>setShow(false)}
          className={props.changed?'input-edited':null}
        />
      <MyOverLay show={props.changed&&show?'string':null} type='Edited' target={target}/>
    </React.Fragment>
  )
}



export function SimpleCheckbox(props){

  const [show, setShow] = useState(false);
  const target = useRef(null);
  return(
      <React.Fragment>
        <div
          ref={target}
          onMouseOver={()=>setShow(true)}
          onMouseOut={()=>setShow(false)}
          >
        <Form.Check
          {...props}

          checked={props.checked?true:props.value?true:false}

          disabled={props.disabled}
          className={"col-form-label checkbox " + (props.changed?"input-edited checkbox-edited":"")}
         />
         <MyOverLay show={props.changed&&show?'string':null} type='Edited' target={target}/>
       </div>
      </React.Fragment>
  )
}
/*


*/
export function TimeInput(props){
  const [timeMetric,setTimeMetric] = useState('0');
  const [show, setShow] = useState(false);
  const target = useRef(null);
  var reg = /^-?\d*\.?\d*$/;
  return(
    <React.Fragment>
      <Col sm="4">
       <Form.Control
        {...props}
         type='text'
         className={'col-form-label-sm ' + (props.changed?"input-edited":"")}
         ref={target}
         onMouseOver={()=>setShow(true)}
         onMouseOut={()=>setShow(false)}
         value={Math.round(props.value/(timeMetric==='0'?1:(timeMetric==='1'?60:3600)) * 100) / 100}
         onChange={(e)=>{
           if(reg.test(e.target.value)){
           e.target.value= e.target.value*(timeMetric==='0'?1:(timeMetric==='0'?1:(timeMetric==='1'?60:3600)));
           props.onChange(e);}
          }
         }
       />
       <MyOverLay show={props.changed&&show?'string':null} type='Edited' target={target}/>
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
  const [show, setShow] = useState(false);
  const target = useRef(null);

  return(
    <React.Fragment>
      <div
        className='select-container'
        ref={target}
        >
      <Field
      className={props.changed?' input-edited':null}
      name={props.name}
      as="select"

      onMouseOver={()=>setShow(true)}
      onMouseOut={()=>setShow(false)}
      disabled={props.disabled}
      placeholder="Select...">
        {props.options.map((item,index)=>(
          <option key={index} value={props.options[index]}>{props.optionsTitle[index]}</option>
        ))}
      </Field>
    </div>
      <MyOverLay show={props.changed&&show?'string':null} type='Edited' target={target}/>
    </React.Fragment>
  )
}


/*


<MyOverLay show={props.changed&&show} type='Edited' target={target}/>
*/

function CheckboxListItem(props){
  const [show, setShow] = useState(false);
  const target = useRef(null);
  return(
    <tr
      ref={target}
      onMouseOver={()=>setShow(true)}
      onMouseOut={()=>setShow(false)}
    >
      <td className={props.class}>
        {props.item}
      </td>
      <MyOverLay show={props.class&&show} type={props.class==='row-deleted'?'Deleted':props.class==='row-added'?'Added':null} target={target}/>
    </tr>

  )
}



export function CheckboxList(props){
  const [added,setAdded] = useState([]);
  const [deleted,setDeleted] = useState([]);
  const [existing,setExisting] = useState([]);
  useEffect(()=>{

    let add = [];
    let dlt = [];
    let exst = [];
    if(props.changed){
      props.values.forEach(item=>{
        if(props.changed.D.includes(item)){
          dlt.push(item);
        }
        else if (props.changed.N.includes(item)){
          add.push(item);
        }
        else if(props.values.includes(item)){
          exst.push(item)
        }
      });
      setExisting(exst);
      setAdded(add);
      setDeleted(dlt);

    }

    // eslint-disable-next-line react-hooks/exhaustive-deps
  },[]);
  return (
    <React.Fragment>
        {props.changed?

          <Table className="client-list-table">
            <thead>
              {existing.map((item,index)=>{
                return (
                  <CheckboxListItem key={index} item={item}/>
                )
              })}
              {added.map((item,index)=>{
                return (
                  <CheckboxListItem key={index} class='row-added' item={item}/>
                )
              })}
              {deleted.map((item,index)=>{
                return (
                  <CheckboxListItem key={index} class='row-deleted' item={item}/>
                )
              })}
            </thead>
          </Table>
          :
          <React.Fragment>
            {props.listItems.map((item,index)=>(
              <div className="checkboxList" key={index}>
                <Checkbox name={props.name} disabled={props.disabled} value={item}/>
                {item.length>33&&(item.substr(0,33)==="urn:ietf:params:oauth:grant-type:"||item.substr(0,33)==="urn:ietf:params:oauth:grant_type:")?item.substr(33).replace("_"," "):item.replace("_"," ")}
              </div>
            ))}
          </React.Fragment>
        }
      </React.Fragment>

  )
}

export function RefreshToken(props){
    const [show, setShow] = useState(false);
    const target = useRef(null);
    // eslint-disable-next-line
    const { t, i18n } = useTranslation();
    return(
      <React.Fragment>
        <div
          className={"checkbox-item "+(props.changed&&(props.changed.scope.D.includes('offline_access')||props.changed.scope.N.includes('offline_access'))?'input-edited checkbox-item-edited':'')}
          ref={target}
          onMouseOver={()=>setShow(true)}
          onMouseOut={()=>setShow(false)}
          >
          <Checkbox name="scope" disabled={props.disabled} checked={props.values.scope.includes('offline_access')} value='offline_access'/>
            {t('form_reuse_refresh_tokens_scope')}
          <MyOverLay show={props.changed&&(props.changed.scope.D.includes('offline_access')||props.changed.scope.N.includes('offline_access'))&&show} type='Edited' target={target}/>
        </div>
        <Form.Text className="text-muted text-left label-checkbox" id="uri-small-desc">
          {t('form_offline_acces_desc')}
        </Form.Text>
        {props.values.scope.includes('offline_access')?(
          <React.Fragment>
            <div className={"checkbox-item "+(props.changed&&props.changed.reuse_refresh_tokens?"spacing-bot":'')}>
              <SimpleCheckbox
                name="reuse_refresh_tokens"
                label={t('form_reuse_refresh_tokens')}
                changed={props.changed?props.changed.reuse_refresh_tokens:null}
                checked={props.values.reuse_refresh_tokens}
                disabled={props.disabled}
                onChange={props.onChange}
              />

            </div>
            <div className={"checkbox-item "+(props.changed&&props.changed.reuse_refresh_tokens?"spacing-bot":'')}>
            <SimpleCheckbox
              name="clear_access_tokens_on_refresh"
              label={t('form_clear_access_tokens_on_refresh')}
              checked={props.values.clear_access_tokens_on_refresh}
              changed={props.changed?props.changed.clear_access_tokens_on_refresh:null}
              onChange={props.onChange}
              disabled={props.disabled}

               />

            </div>
            <TimeInput
              name='refresh_token_validity_seconds'
              value={props.values.refresh_token_validity_seconds}
              isInvalid={props.isInvalid}
              onBlur={props.onBlur}
              onChange={props.onChange}
              disabled={props.disabled}
              changed={props.changed?props.changed.refresh_token_validity_seconds:null}
            />
            <Form.Text className="text-muted text-left label-checkbox" id="uri-small-desc">
              {t('form_refresh_token_validity_seconds_desc')}
            </Form.Text>
          </React.Fragment>
          ):null}

      </React.Fragment>
    )
}

/*
const [show, setShow] = useState(false);
const target = useRef(null);
ref={target}
onMouseOver={()=>setShow(true)}
onMouseOut={()=>setShow(false)}
<MyOverLay show={props.changed&&show} type='Edited' target={target}/>
*/
export function DeviceCode(props){
  const [show, setShow] = useState(false);
  const target = useRef(null);
  // eslint-disable-next-line
  const { t, i18n } = useTranslation();
  return(
    <React.Fragment>
      <div
        className={"checkbox-item " + (props.changed&&(props.changed.grant_types.D.includes('device')||props.changed.grant_types.N.includes('device'))?'input-edited checkbox-item-edited':'')}
        ref={target}
        onMouseOver={()=>setShow(true)}
        onMouseOut={()=>setShow(false)}
      >
        <Checkbox name="grant_types" disabled={props.disabled} value='device'/>
          {t('form_device_code_desc')}
        <MyOverLay show={(props.changed&&(props.changed.grant_types.D.includes('device')||props.changed.grant_types.N.includes('device'))?'input-edited checkbox-item-edited':'')&&show} type='Edited' target={target}/>
      </div>
      <Form.Text className="text-muted text-left label-checkbox" id="uri-small-desc">
      {t('form_device_code_info')}
      </Form.Text>
      {props.values.grant_types.includes('device')?(
        <React.Fragment>
          <TimeInput
            name='device_code_validity_seconds'
            value={props.values.device_code_validity_seconds}
            isInvalid={props.isInvalid}
            onBlur={props.onBlur}
            onChange={props.onChange}
            disabled={props.disabled}
            changed={props.changed?props.changed.device_code_validity_seconds:null}
          />
          <Form.Text className="text-muted text-left label-checkbox" id="uri-small-desc">
           {t('form_device_code_validity_seconds_desc')}
          </Form.Text>
        </React.Fragment>
        ):null}

    </React.Fragment>
  )
}
/*
const [show, setShow] = useState(false);
const target = useRef(null);
ref={target}
onMouseOver={()=>setShow(true)}
onMouseOut={()=>setShow(false)}
<MyOverLay show={props.changed&&show} type='Edited' target={target}/>
*/
export function ClientSecret(props){
  const [editSecret,toggleEditSecret] = useState(true);
  const [show, setShow] = useState(false);
  const target = useRef(null);
  // eslint-disable-next-line
  const { t, i18n } = useTranslation();
  return(
    <React.Fragment>
      {!props.disabled?
        <React.Fragment>
          <Form.Check
            name="generate_client_secret"
            label="Generate a new client secret?"
            onChange={props.onChange}
            checked={props.generate_client_secret}
            className="checkbox col-form-label"
            disabled={props.disabled}
          />
          <Form.Text className="text-muted text-left label-checkbox" id="uri-small-desc">
            {t('imput_client_secret_info')}
          </Form.Text>
        </React.Fragment>
        :null}

       {props.generate_client_secret?
         (
         <Form.Control
           type="text"
           name="client_secret"
           className='col-form-label-sm'
           value={t('input_generate')}
           disabled={true}
         />):(
         <React.Fragment>
           <Form.Check
             label={t('input_display_secret')}
             checked={!editSecret}
             onChange={()=>{toggleEditSecret(!editSecret)}}
             className="checkbox col-form-label"

            />
            <Form.Control
              type="text"
              name="client_secret"
              className={(editSecret?'d-none col-form-label-sm':'col-form-label-sm')+(props.changed?' input-edited':'')}
              onChange={props.onChange}
              isInvalid={props.isInvalid}
              onBlur={props.onBlur}
              placeholder='Type a secret'
              value={props.client_secret}
              disabled={props.disabled}
              ref={editSecret?null:target}
              onMouseOver={()=>setShow(true)}
              onMouseOut={()=>setShow(false)}

            />
            {editSecret?<Form.Control
              type="text"
              name="clientSecretHelp"
              className={'col-form-label-sm'+(props.changed?' input-edited':'')}
              value="*************"
              isInvalid={props.isInvalid}
              disabled={true}
              ref={editSecret?target:null}
              onMouseOver={()=>setShow(true)}
              onMouseOut={()=>setShow(false)}
            />:null
           }
           <MyOverLay show={props.changed&&show} type='Edited' target={target}/>
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
  const [invalid,setInvalid] = useState(false);



  return (
        <Table striped bordered hover size="sm" className='input-list-table'>
          <thead>
            {!props.disabled?
              <React.Fragment>
                  <tr>

                  <th>
                    <InputGroup>
                        <Form.Control
                          placeholder={props.placeholder}
                          type="text"
                          value={newVal}
                          onChange={(event)=>{
                            setInvalid(false);
                            setNewVal(event.target.value);
                          }}
                          isInvalid={invalid}
                          disabled={props.disabled}
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
                            if(!props.values.includes(newVal)){
                              arrayHelpers.push(newVal);
                              setNewVal('');
                            }
                            else {
                              setInvalid(true);
                            }
                          }}
                          className="addButton"
                          disabled={props.disabled}
                        >
                          +
                        </Button>
                      )}
                    />
                  </th>
                </tr>
                </React.Fragment>
                :
              null
              }


        </thead>
        <tbody>
          {props.defaultValues.map((item,index)=>(

              <ListInputArrayInput1 key={index} index={index} item={item} name={props.name} values={props.values} disabled={props.disabled} changed={props.changed}/>


          ))}
          <FieldArray
            name={props.name}
            render={arrayHelpers =>(
              props.values.map((item,index)=>{
                if(!props.defaultValues.includes(item)){
                  return(
                    <React.Fragment key={index}>

                    <ListInputArrayInput2 error={props.error} index={index} item={item} arrayHelpers={arrayHelpers} disabled={props.disabled} changed={props.changed}/>
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



function ListInputArrayInput1(props){
  const [show, setShow] = useState(false);
  const [type, setType] = useState();
  const target = useRef(null);
  useEffect(()=>{

    if(props.changed){
      if(props.changed.N.includes(props.item)){
        setType('Added');

      }
      else if(props.changed.D.includes(props.item)){
        setType('Deleted');

      }
    }

    // eslint-disable-next-line react-hooks/exhaustive-deps
  },[]);
  return (
    <React.Fragment>
    <tr
      key={props.index}
      onMouseOver={()=>setShow(true)}
      onMouseOut={()=>setShow(false)}
      ref={target}
    >

        <React.Fragment>
          <td className={'td-item ' + (type==='Added'?'row-added':type==='Deleted'?'row-deleted':null)}>{props.item}</td>

            <React.Fragment>
            <td>
              <Checkbox disabled={props.disabled} name={props.name} value={props.item}/>
            </td>
            </React.Fragment>

        </React.Fragment>

    </tr>
      <MyOverLay show={type&&type!=='Exists'&&show?'true':null} type={type} target={target}/>
    </React.Fragment>
  )
}
// const [show, setShow] = useState(false);
// const target = useRef(null);
// ref={target}
// onMouseOver={()=>setShow(true)}
// onMouseOut={()=>setShow(false)}
// <MyOverLay show={props.changed&&show} type='Edited' target={target}/>

function ListInputArrayInput2(props){
  const [show, setShow] = useState(false);
  const [type, setType] = useState(false);
  const target = useRef(null);
  useEffect(()=>{

    if(props.changed){
      if(props.changed.N.includes(props.item)){
        setType('Added');

      }
      else if(props.changed.D.includes(props.item)){
        setType('Deleted');

      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  },[]);
  return (
    <tr
      className={(Array.isArray(props.error)||typeof(props.error)=='string')&&props.error[props.index]?'error-tr':null}
      onMouseOver={()=>setShow(true)}
      onMouseOut={()=>setShow(false)}
      ref={target}
      >
      <td className={"td-item "+(type==='Added'?'row-added':type==='Deleted'?'row-deleted':null)}>
        {props.item}
      </td>

        <td>
          <Button
            variant="danger"
            onClick={()=>{props.arrayHelpers.remove(props.index)}}
            className="removeButton"
            disabled={props.disabled}
          >
            -
          </Button>
        </td>

      <MyOverLay show={type&&show?'true':null} type={type} target={target}/>
    </tr>
  )
}



export  function LogoInput(props){
  const [show, setShow] = useState(false);
  const target = useRef(null);
  // eslint-disable-next-line
  const { t, i18n } = useTranslation();
  const addDefaultSrc= (ev)=>{
      props.setImageError(false);
      ev.target.src = process.env.PUBLIC_URL + '/logo_placeholder.gif';
  }
  const imageLoad = (ev)=>{
      if((!ev.target.src.includes('/logo_placeholder.gif'))){
        props.setImageError(true);
      }
  }

  return (
    <React.Fragment>
      <Form.Control
        type="text"
        name={props.name}
        className={'col-form-label-sm '+(props.changed?'input-edited':null)}
        placeholder="https//"
        value={props.value}
        onBlur={props.onBlur}
        onChange={(e)=>{props.onChange(e)}}
        isInvalid={props.isInvalid}
        disabled={props.disabled}
        ref={target}
        onMouseOver={()=>setShow(true)}
        onMouseOut={()=>setShow(false)}
      />
      <Form.Text className="text-muted text-left">
        {props.description}
      </Form.Text>
      <MyOverLay show={props.changed&&show?'string':null} type='Edited' target={target}/>
      {props.error && props.touched ? (typeof(props.error)=='string')?(<div className="error-message">{props.error}</div>):(<div className="error-message">{t('input_image_error')}</div>):null}
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

function MyOverLay(props) {
  // eslint-disable-next-line
  const { t, i18n } = useTranslation();
  const [show,setShow] = useState(false);
  useEffect(()=>{
    if(props.show){
      setShow(true);
    }
    else{
      setShow(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  },[props.show]);
  return (
    <Overlay target={props.target.current}  show={show} placement="right">
      {propsOv => (
        <Tooltip id="overlay-example" placement={propsOv.placement} arrowProps={propsOv.arrowProps} ref={propsOv.ref} style={propsOv.style} outOfBoundaries={propsOv.outOfBoundaries} >
          {props.type==="Added"?t('input_added'):props.type==="Deleted"?t('input_deleted'):props.type==="Edited"?t('input_edited'):null}
        </Tooltip>

      )}
    </Overlay>
  )
}

function ListSingleInput(props){
  const [show, setShow] = useState(false);
  const target = useRef(null);
  const [type, setType] = useState();
  useEffect(()=>{
    if(props.changed){
      if(props.changed.N.includes(props.item)){
        setType('Added');

      }
      else if(props.changed.D.includes(props.item)){
        setType('Deleted');
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  },[]);

  return(
    <React.Fragment>
    <Form.Control
      {...props.field}
      onBlur={props.handleBlur}
      onChange={props.onChange}
      onMouseOver={()=>setShow(true)}
      onMouseOut={()=>setShow(false)}
      ref={target}
      isInvalid={Array.isArray(props.error)?!!props.error[props.index]:false}
      column="true"
      sm="4"
      type="text"
      className={'col-form-label-sm spacing-bot '+ (type==='Added'?'input-new':!type?'':'input-deleted')}
      placeholder="https//"
      disabled={props.disabled}
    />
    <MyOverLay show={type&&show?'string':null} type={type} target={target}/>
  </React.Fragment>
  )
}



export function ListInput(props){
  const [newVal,setNewVal] = useState('');
  // eslint-disable-next-line
  const { t, i18n } = useTranslation();
  return (
        <FieldArray name={props.name}>
          {({push,remove,insert})=>(
            <React.Fragment>
              {!props.disabled?
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
                  disabled={props.disabled}
                />
                <InputGroup.Prepend>
                  <Button
                    disabled={props.disabled}
                    variant="outline-primary"
                    onClick={()=>{
                      push(newVal);
                      setNewVal('');
                    }}
                  >
                    {t('input_add_button')}
                  </Button>
                </InputGroup.Prepend>
                </InputGroup>:null}

              {props.values && props.values.length > 0 && props.values.map((item,index)=>(
                <React.Fragment key={index}>
                <InputGroup className="mb-3" >
                  <Field name={`${props.name}.${index}`}>
                    {({field,form})=>(
                      <React.Fragment>
                        <ListSingleInput changed={props.changed} item={item} index={index} field={field} onBlur={props.handleBlur} onChange={props.onChange} error={props.error} disabled={props.disabled}/>
                        {!props.disabled?
                          <InputGroup.Prepend>
                            <Button disabled={props.disabled} variant="outline-danger" onClick={()=>remove(index)}>Remove</Button>
                          </InputGroup.Prepend>
                          :
                        null}
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


export function Contacts(props){

  const [newVal,setNewVal] = useState('');
  const [newVal2,setNewVal2] = useState('admin');
  // eslint-disable-next-line
  const { t, i18n } = useTranslation();
  return (
        <FieldArray name={props.name}>
          {({push,remove,insert})=>(
            <React.Fragment>
              {!props.disabled?
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
                      disabled={props.disabled}
                    />
                    <InputGroup.Prepend>
                          <Form.Control as="select" value={newVal2} disabled={props.disabled} className="input-hide" onChange={(e)=>{
                            setNewVal2(e.target.value)
                          }}>
                            <React.Fragment>
                              {formConfig.contact_types.map((item,index) => {
                                  return <option key={index} value={item}>{capitalize(item)}</option>
                                })
                              }
                            </React.Fragment>
                          </Form.Control>
                      <Button
                        disabled={props.disabled}
                        variant="outline-primary"
                        onClick={()=>{
                          push({email:newVal,type:newVal2});
                          setNewVal('');
                          setNewVal2('admin');
                        }}
                      >
                        {t('input_add_button')}
                      </Button>
                    </InputGroup.Prepend>
                  </InputGroup>
                </React.Fragment>
                :null}

              {props.values && props.values.length > 0 && props.values.map((item,index)=>(
                <React.Fragment key={index} >
                <InputGroup className="spacing-bot-contact" >
                  <ContactInput name={props.name} item={item} index={index} onBlur={props.handleBlur} onChange={props.onChange} error={props.error} remove={remove} changed={props.changed} disabled={props.disabled}/>
                </InputGroup>
                <div className="error-message-list-item">{Array.isArray(props.error)&&props.error[index]?props.error[index].email:''}</div>

                </React.Fragment>
              ))}
            </React.Fragment>
          )}
        </FieldArray>
  )
}


// const [show, setShow] = useState(false);
// const target = useRef(null);

// <MyOverLay show={props.changed&&show} type='Edited' target={target}/>

function ContactInput(props){
  const [show, setShow] = useState(false);
  const target = useRef(null);
  const [type,setType] = useState();
  // eslint-disable-next-line
  const { t, i18n } = useTranslation();

  useEffect(()=>{
    if(props.changed){
      props.changed.N.forEach(item=>{
        if(item.email===props.item.email&&item.type===props.item.type){
          setType('Added');
        }
      });
      props.changed.D.forEach(item=>{
        if(item.email===props.item.email&&item.type===props.item.type){
          setType('Deleted');
        }
      });
    }

    // eslint-disable-next-line react-hooks/exhaustive-deps
  },[]);
  return (
    <Field name={`${props.name}.${props.index}.email`}

      >
      {({field,form})=>(
        <React.Fragment>
          <Form.Control
            {...field}
            onMouseOver={()=>setShow(true)}
            onMouseOut={()=>setShow(false)}
            onBlur={props.handleBlur}
            onChange={props.onChange}
            isInvalid={Array.isArray(props.error)?!!props.error[props.index]:false}
            column="true"
            sm="4"
            type="text"
            className={'col-form-label.sm ' + (type==='Added'?'input-new remove-border-right':type==='Deleted'?'input-deleted remove-border-right':null)}
            placeholder="https//"
            disabled={props.disabled}
          />
          <InputGroup.Prepend>
          <Field name={`${props.name}.${props.index}.type`}>
            {({field,form})=>(
              <React.Fragment>
          <Form.Control
            {...field}
            as="select"
            ref={target}
            onMouseOver={()=>setShow(true)}
            onMouseOut={()=>setShow(false)}
            disabled={props.disabled}
            className={'input-hide  ' + (type==='Added'?'input-new remove-border-left':type==='Deleted'?'input-deleted remove-border-left':null)}
            onBlur={props.handleBlur}
            onChange={props.onChange}
          >
            {formConfig.contact_types.map((item,index) => {
                return <option key={index} value={item}>{capitalize(item)}</option>
              })
            }
          </Form.Control>
            </React.Fragment>
          )}
        </Field>
        <MyOverLay show={type&&show?'string':null} type={type} target={target}/>
      </InputGroup.Prepend>
      {!props.disabled?
        <React.Fragment>
          <InputGroup.Prepend>
            <Button disabled={props.disabled} variant="outline-danger" onClick={()=>{props.remove(props.index)}}>{t('input_remove_button')}</Button>
          </InputGroup.Prepend>
        </React.Fragment>
        :null}

        </React.Fragment>
      )}
    </Field>
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

const capitalize = (s) => {
if (typeof s !== 'string') return ''
return s.charAt(0).toUpperCase() + s.slice(1)
}
