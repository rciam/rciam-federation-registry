import React, {useState, useRef ,useEffect,useContext} from 'react';
import Col from 'react-bootstrap/Col';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {faSearch,faExclamationTriangle} from '@fortawesome/free-solid-svg-icons';
import initialValues from '../initialValues';
import { Field, FieldArray,FormikConsumer } from 'formik';
import OverlayTrigger from 'react-bootstrap/OverlayTrigger';
import Form from 'react-bootstrap/Form';
import InputGroup from 'react-bootstrap/InputGroup';
import Button from 'react-bootstrap/Button';
import Image from 'react-bootstrap/Image';
import Table from 'react-bootstrap/Table';
import Tooltip from 'react-bootstrap/Tooltip';
import Overlay from 'react-bootstrap/Overlay';
import { useTranslation } from 'react-i18next';
import countryData from 'country-region-data';
import {Logout,NotFound} from './Modals.js';
import CopyToClipboardComponent from './CopyToClipboard.js'
import {tenantContext} from '../context.js';
import { Typeahead } from 'react-bootstrap-typeahead'; // ES2015
import 'react-bootstrap-typeahead/css/Typeahead.css';
import config from '../config.json';
import {useParams } from "react-router-dom";
import parse from 'html-react-parser';


// import {removeA} from '../helpers.js';

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
        <InputGroup >
          <Form.Control
            {...props}
            value={props.value?props.value:''}
            type="text"
            ref={target}
            onMouseOver={()=>setShow(true)}
            onMouseOut={()=>setShow(false)}
            className={props.changed?'col-form-label.sm input-edited':'col-form-label.sm'}
          />
          {props.copybutton?<CopyToClipboardComponent value={props.value}/>:null}
        </InputGroup>

          <MyOverLay show={props.changed&&show?'string':null} type='Edited' target={target}/>
          {props.isloading?<div className="loader"></div>:null}
        </React.Fragment>
  )
}
export function MetadataInput(props){
  const [show, setShow] = useState(false);
  const target = useRef(null);
  const { getmetadata, ...newProps } = props; // eslint-disable-line
  // `newProps` variable does not contain `className` and `id` properties


  return (
        <React.Fragment>
        <InputGroup >
          <Form.Control
            {...newProps}
            value={props.value?props.value:''}
            type="text"
            ref={target}
            onMouseOver={()=>setShow(true)}
            onMouseOut={()=>setShow(false)}
            className={props.changed?'col-form-label.sm input-edited':'col-form-label.sm'}
          />
           <InputGroup.Prepend>
                {!props.disabled?
                 <OverlayTrigger
                 placement='right'
                 overlay={
                   <Tooltip id={`tooltip-right`}>
                     Load Metadata from Url
                   </Tooltip>
                 }
               >
                 <Button
                   disabled={props.disabled||!props.value||props.error||props.isloading}
                   variant="outline-primary"
                   onClick={()=>{
                     props.getmetadata(props.value);
                   }}
                 >Load
                 </Button>
               
   
               </OverlayTrigger>
                :null}     
                </InputGroup.Prepend>
          {props.copybutton?<CopyToClipboardComponent value={props.value}/>:null}
        </InputGroup>

          <MyOverLay show={props.changed&&show?'string':null} type='Edited' target={target}/>
          {props.isloading?<div className="loader"></div>:null}
        </React.Fragment>
  )
}


export function OrganizationField(props){
  //const [show, setShow] = useState(false);
  const target = useRef(null);
  const [singleSelections, setSingleSelections] = useState((props.values.organization_name?[props.values.organization_name]:[]));
  const [organizations,setOrganizations] = useState({});
  const [notFound,setNotFound] = useState(false);
  const [logout,setLogout] = useState(false);
  let {tenant_name} = useParams();
  const getOrganizations = (searchString) =>{

    if(true){
      fetch("https://api.ror.org/organizations"+(searchString?("?query="+searchString):''), {
        method:'GET',
        accept: '*/*',
        headers:{
          'Content-Type':'application/json',
        }}).then(response=>{
          if(response.status===200||response.status===304){
            return response.json();
          }
          else if(response.status===401){
            setLogout(true);
            return false;
          }
          else if(response.status===404){
            return false;
          }
          else {
            return false
          }
        }).then(ror_response=>{
            let options = {};
            let exists = false;
            
            fetch(config.host[tenant_name]+'tenants/'+tenant_name+'/organizations?ror=true'+(searchString?("&search_string="+searchString):''),{
              method:'GET',
              credentials:'include',
              headers:{
                'Content-Type':'application/json'
              }
            }).then(response=>{
              if(response.status===200||response.status===304){
                return response.json();
              }
              else if(response.status===401){
                setLogout(true);
                return false;
              }
              else if(response.status===404){
                setNotFound('No Organizations found');
                return false;
              }
              else{
                return false
              }
            }).then(response=>{
              if(response){
                //options[searchString]     
                let loaded = false;     
                response.organizations.forEach((item,index)=>{
                  if(searchString===item.organization_name){
                    exists = true;
                  }
                  options[item.organization_name] = {};
                  options[item.organization_name].name = item.organization_name 
                  options[item.organization_name].url = item.organization_url;
                  options[item.organization_name].ror_id = null;
                  options[item.organization_name].id = item.organization_id;

                  if(item.organization_name ===singleSelections[0]&&options[item.organization_name].url){
                    loaded= true;
                  }
                })

                if(ror_response&&ror_response.items){
                  ror_response.items.forEach((item,index)=>{
                    if(searchString===item.name){
                      exists = true;
                    }
                    options[item.name + (item.acronyms.length>0?(" (" + item.acronyms[0] +")"):"")] = {};
                    options[item.name + (item.acronyms.length>0?(" (" + item.acronyms[0] +")"):"")].name = item.name 
                    options[item.name + (item.acronyms.length>0?(" (" + item.acronyms[0] +")"):"")].url=(item.links[0]?item.links[0]:"");
                    options[item.name + (item.acronyms.length>0?(" (" + item.acronyms[0] +")"):"")].ror_id = item.id;
                    
                    if(item.name +(item.acronyms.length>0?(" (" + item.acronyms[0] +")"):"")===singleSelections[0]&&options[item.name+(item.acronyms.length>0?(" (" + item.acronyms[0] +")"):"")].url){
                      loaded = true
                    }
                  });
                }
                if(loaded||exists){
                  props.setDisabledOrganizationFields(['organization_url']);                  
                }
                else{
                  props.setDisabledOrganizationFields([]);
                } 
               
                let newOption = {};
                if(!exists&& searchString.length>0){
                  newOption[searchString+ " (Add New Organization)"] = {};
                  newOption[searchString+ " (Add New Organization)"].name = searchString; 
                  newOption[searchString+ " (Add New Organization)"].url = null;
                }
                // console.log(options);
                // console.log(ror_response.items);
                setOrganizations({...newOption,...options});
            }
            else{
              setOrganizations(options);
            }
            })

            
          }
        ).catch((err)=>{console.log(err);});
    }
  }

  useEffect(()=>{
    getOrganizations(singleSelections[0]?singleSelections[0]:"");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  },[singleSelections])

 
  const handleChange = async (selected,index) => {
 
    let organization = (organizations[selected[0]]?organizations[selected[0]]:{});
    props.setFieldValue('ror_id',organization.ror_id,false)
    props.setFieldValue('organization_id',organization.organization_id,false);
    props.setFieldValue('organization_name',(selected&&selected[0]?organizations[selected[0]].name:""),false).then(()=>{
      props.validateField('organization_name');
    });
    
    if(organization.url){
      props.setDisabledOrganizationFields(['organization_url']);
    }
    else{
      props.setDisabledOrganizationFields([]);
    }
    props.setFieldValue('organization_url',(organizations[selected[0]]&&organizations[selected[0]].url?organizations[selected[0]].url:selected[0]&&selected[0].contains(' (Add New Organization)')?props.values.organization_url:''),false).then(()=>{
      props.validateField('organization_url');       
    });
    setSingleSelections(selected);

  } 
  
  return (
        <React.Fragment>
          <Logout logout={logout}/>
          <NotFound notFound={notFound}/>
          <Form.Group className='organizations-input'>
            <InputGroup>  
              <InputGroup.Text><FontAwesomeIcon icon={faSearch}/></InputGroup.Text>
              <Typeahead
                id="basic-typeahead-single"
                labelKey="name"
                name='organization_name'
                onBlur={()=>{props.setFieldTouched('organization_name')}}
                onInputChange={(e)=>{getOrganizations(e);
                  
                }}
                filterBy={() => true}
                isInvalid={props.isInvalid}
                onChange={(selected,index)=>{
                  
                  handleChange(selected,index);
                                  }}
                options={Object.keys(organizations)}
                disabled={props.disabled}
                ref={target}
                placeholder="Type the name of your organization..."
                selected={singleSelections}
              />
            </InputGroup>
          </Form.Group>  
        <MyOverLay show={true?'string':null} type='Edited' target={target}/>
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
export function PublicKey(props){
  const [type,setType] = useState();
  useEffect(()=>{
    setType(props.values.jwks?'jwks':'jwks_uri')
    // eslint-disable-next-line react-hooks/exhaustive-deps
  },[]);
  const [show, setShow] = useState(false);
  const target = useRef(null);
  return(
    <React.Fragment>
      <div className="public_key_radio">
        <input
          type='radio'
          name='public_key_type'
          value='jwks_uri'
          checked={type==='jwks_uri'}
          disabled={props.disabled}
          onChange={(e)=>{props.setvalue('jwks','',true); setType(e.target.value) }}
        />
        By URI
      </div>
      <div className="public_key_radio">
        <input
          type='radio'
          name='public_key_type'
          value='jwks'
          checked={type==='jwks'}
          disabled={props.disabled}
          onChange={(e)=>{props.setvalue('jwks_uri','',true); setType(e.target.value) }}
        />
        By Value
      </div>
      <div className="public_key_input">
        {type==='jwks_uri'?
          <Form.Control
            onBlur={props.onBlur}
            name="jwks_uri"
            placeholder='https://'
            type="text"
            ref={target}
            value={props.values.jwks_uri?props.values.jwks_uri:""}
            onChange={props.onChange}
            isInvalid={props.isInvalid}
            disabled={props.disabled}
            onMouseOver={()=>setShow(true)}
            onMouseOut={()=>setShow(false)}
            className={props.changed?'input-edited':null}
          />
          :
          <Form.Control
            onBlur={props.onBlur}
            name="jwks"
            as="textarea"
            rows="3"
            placeholder='{"keys":[]}'
            value={props.values.jwks?props.values.jwks:''}
            ref={target}
            datatype="json"
            onChange={props.onChange}
            isInvalid={props.isInvalid}
            onMouseOver={()=>setShow(true)}
            onMouseOut={()=>setShow(false)}
            disabled={props.disabled}
            className={props.changed?'input-edited':null}
          />
        }
      </div>
      <MyOverLay show={props.changed&&show?'string':null} type='Edited' target={target}/>
    </React.Fragment>
  )
}

export function SimpleRadio(props){
  const setFieldValue = props.setFieldValue;
  const target = useRef(null);
  const [show,setShow] = useState();
  
  return (
    <React.Fragment>
      <div 
        className={props.className}
        onMouseOver={()=>setShow(true)}
        onMouseOut={()=>setShow(false)}
      >
      {props.radio_items.map((item,index)=>{
        return  <div key={index}>
          <Field  name={props.name}>
          {({ field, form }) => (
            <React.Fragment>
            <span onClick={()=>{setFieldValue(props.name,item)}}  className={"form_radio_item "+ (props.changed&&props.values[props.name]===item?"input_radio_edited":null)}>
              <input
                type="radio"
                name={field.name}
                disabled={props.disabled}
                {...field}
                value={item}
                ref={props.values[props.name]===item?target:null}
                checked={props.values[props.name]===item}         
              />
              {props.radio_items_titles[index]}
              </span>
            </React.Fragment>
          )}
        </Field>
        </div>
      }
      )}
      </div>
      <MyOverLay show={props.changed&&show?'string':null} type='Edited' placement='left' target={target}/>
    </React.Fragment>
  )
}


export function AuthMethRadioList(props){
  const [show, setShow] = useState(false);
  // const authMethod = props.values.token_endpoint_auth_method;
  // const signingAlg = props.values.token_endpoint_auth_signing_alg;
  const setFieldValue = props.setFieldValue;
  const target = useRef(null);
  const tenant = useContext(tenantContext);

  useEffect(()=>{
    if((props.values.token_endpoint_auth_method==="client_secret_jwt"||props.values.token_endpoint_auth_method==="private_key_jwt")&&!props.values.token_endpoint_auth_signing_alg){
      setFieldValue('token_endpoint_auth_signing_alg', "RS256");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  },[props.values.token_endpoint_auth_method]);

  useEffect(()=>{
    if(tenant[0].form_config.dynamic_fields.includes('allow_introspection')){
      setFieldValue('allow_introspection',props.values.token_endpoint_auth_method!=='none');
    } 
    // eslint-disable-next-line react-hooks/exhaustive-deps
  },[])

  // useEffect(()=>{
  //   if(props.values.grant_types.includes('authorization_code')&&authMethod==='none'){
  //     setFieldValue('token_endpoint_auth_method','client_secret_basic');
  //   }
  // },[authMethod,props.values.grant_types,setFieldValue])

  return(
    <React.Fragment>

        {props.radio_items.map((item,index)=>(
          <div
            className={"form_radio_item "+ (props.changed&&props.values.token_endpoint_auth_method===item?"input_radio_edited":null)}
            key={index}
            onMouseOver={()=>{props.values.token_endpoint_auth_method===item&&setShow(true)}}
            onMouseOut={()=>{props.values.token_endpoint_auth_method===item&&setShow(false)}}
          >
            <Field name={props.name}>
              {({ field, form }) => (
                <React.Fragment>
                  <input
                    type="radio"
                    name={field.name}
                    disabled={props.disabled}
                    {...field}
                    onChange={(e)=>{
                      if(tenant[0].form_config.dynamic_fields.includes('allow_introspection')){
                          setFieldValue('allow_introspection',e.target.value!=='none');
                      } 
                      props.onChange(e); }}
                    value={item}
                    ref={props.values.token_endpoint_auth_method===item?target:null}
                    checked={props.values.token_endpoint_auth_method===item}
                  />
                  {props.radio_items_titles[index]}
                </React.Fragment>
              )}
            </Field>
          </div>
        ))}
        <MyOverLay show={props.changed&&show?'string':null} type='Edited' placement='left' target={target}/>
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
          className={"col-form-label checkbox " + (props.changed?"input-edited checkbox-edited":"")+ (props.changed&&props.moreinfo?" checkbox-more-info-changed":"")}
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
         placeholder={'Enter Value'}
         onMouseOver={()=>setShow(true)}
         onMouseOut={()=>setShow(false)}
         value={props.value?Math.round(props.value/(timeMetric==='0'?1:(timeMetric==='1'?60:3600)) * 100) / 100:props.value===0?'0':''}
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


export function CountrySelect(props){
  const [show, setShow] = useState(false);
  const target = useRef(null);
  return(
    <React.Fragment>
      <div
        className={'select-container'+(props.changed?' input-edited':null)}
        ref={target}
        >
      <Field
      name={props.name}
      as="select"
      value={props.values[props.name]?props.values[props.name]:""}
      onMouseOver={()=>setShow(true)}
      onMouseOut={()=>setShow(false)}
      disabled={props.disabled}
      placeholder="Select country...">
        {[{"countryName":"Select your country..."}, ...countryData].map((country,index)=>(
          <option key={index} value={index===0?null:country.countryShortCode.toLowerCase()}>{country.countryName}</option>
        ))}
      </Field>
    </div>
      <MyOverLay show={props.changed&&show?'string':null} type='Edited' target={target}/>
    </React.Fragment>
  )
}


export function SelectEnvironment(props){
  const [show, setShow] = useState(false);
  const target = useRef(null);
  

  return(
    <React.Fragment>
      <div
        className={'select-container'+(props.changed?' input-edited':null)}
        ref={target}
        >
      <Field
      name={props.name}
      as="select"
      value={props.values[props.name]?props.values[props.name]:""}
      default={props.default?props.default:''}
      onMouseOver={()=>setShow(true)}
      onMouseOut={()=>setShow(false)}
      disabled={props.disabled}
      placeholder="Select..countryName.">
        {props.options.map((item,index)=>(
          <option key={index} value={props.options[index]}>{props.optionsTitle[index]}</option>
        ))}
      </Field>

      {props.copybuttonActive?
            <OverlayTrigger
              placement='right'
              overlay={
                <Tooltip id={`tooltip-right`}>
                  Copy Service
                </Tooltip>
              }
            >

            <Button className="copy_button" variant="success" onClick={()=>props.toggleCopyDialog()}>+</Button>
            </OverlayTrigger>
      :null}
    </div>
      <MyOverLay show={props.changed&&show?'string':null} type='Edited' target={target}/>
    </React.Fragment>
  )
}



export function Select(props){
  const [show, setShow] = useState(false);
  const target = useRef(null);
  useEffect(()=>{
    if(props.disabled_option===props.values[props.name]){
      props.setFieldValue(props.recommended)
    }
  },[props,props.disabled_option,props.values])

  return(
    <React.Fragment>
      <div
        className={'select-container'+(props.changed?' input-edited':null)}
        ref={target}
        >
      <Field
      name={props.name}
      as="select"
      value={props.values[props.name]?props.values[props.name]:""}
      default={props.default?props.default:''}
      onMouseOver={()=>setShow(true)}
      onMouseOut={()=>setShow(false)}
      disabled={props.disabled}
      placeholder="Select..countryName.">
        {props.options.map((item,index)=>(
          <option key={index} value={props.options[index]} disabled={props.disabled_option===props.options[index]}>{props.optionsTitle[index]}</option>
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
            {props.listItems.map((item,index)=>
                {
                  if(item!=='refresh_token'){
                    return(
                      <div className="checkboxList" key={index}>
                      <Checkbox name={props.name} disabled={props.disabled} value={item}/>
                      {item.length>33&&(item.substr(0,33)==="urn:ietf:params:oauth:grant-type:"||item.substr(0,33)==="urn:ietf:params:oauth:grant_type:")?item.substr(33).replace("_"," "):item.replace("_"," ")}{props.deprecated_options.includes(item)? ' (deprecated)':''}
                      </div>
                    );

                  }else{
                    return null;
                  }
                }
              )}
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
    const tenant = useContext(tenantContext);
    return(
      <React.Fragment>
        <div
          className={"checkbox-item "+(props.changed&&(props.changed.scope.D.includes('offline_access')||props.changed.scope.N.includes('offline_access'))?'input-edited checkbox-item-edited':'')}
          ref={target}
          onMouseOver={()=>setShow(true)}
          onMouseOut={()=>setShow(false)}
          >
          <Checkbox name="scope" disabled={props.disabled} checked={props.values.scope.includes('offline_access')} value='offline_access' onClick={()=>{
                  if(!props.values.scope.includes('offline_access')&&(props.values.refresh_token_validity_seconds===null||props.values.refresh_token_validity_seconds===0)){
                    props.setFieldValue('refresh_token_validity_seconds',initialValues.refresh_token_validity_seconds,true).then(()=>{
                      props.validateField('refresh_token_validity_seconds');
                    });      
                  }
          }}/>
            {t('form_reuse_refresh_token_scope')}
          <MyOverLay show={props.changed&&(props.changed.scope.D.includes('offline_access')||props.changed.scope.N.includes('offline_access'))&&show} type='Edited' target={target}/>
        </div>
        <Form.Text className="text-muted text-left label-checkbox" id="uri-small-desc">
          {t('form_offline_access_desc')}
        </Form.Text>
        {props.values.scope.includes('offline_access')?(
          <React.Fragment>
            <div className={"checkbox-item "+(props.changed&&props.changed.reuse_refresh_token?"spacing-bot":'')}>
              <SimpleCheckbox
                name="reuse_refresh_token"
                label={t('form_reuse_refresh_token')}
                changed={props.changed?props.changed.reuse_refresh_token:null}
                checked={props.values.reuse_refresh_token}
                disabled={props.disabled}
                onChange={props.onChange}
              />

            </div>
            <div className='pkce-tooltip reuse-warning'>
              <FontAwesomeIcon icon={faExclamationTriangle}/>
              Enabling re-use of Refresh Tokens is not recommended. Public clients in particular should have this option disabled and use refresh token rotation as described in <a href='https://datatracker.ietf.org/doc/html/rfc6749#section-4.13' target='_blank' rel='noopener noreferrer'>Section 4.13 of  RFC6749</a>
            </div>
            <div className={"checkbox-item "+(props.changed&&props.changed.reuse_refresh_token?"spacing-bot":'')}>
            {!tenant[0].form_config.disabled_fields.includes('clear_access_tokens_on_refresh')?
              <SimpleCheckbox
                name="clear_access_tokens_on_refresh"
                label={t('form_clear_access_tokens_on_refresh')}
                checked={props.values.clear_access_tokens_on_refresh}
                changed={props.changed?props.changed.clear_access_tokens_on_refresh:null}
                onChange={props.onChange}
                disabled={props.disabled}
              />
            :null}

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
        className={"checkbox-item " + (props.changed&&(props.changed.grant_types.D.includes('urn:ietf:params:oauth:grant-type:device_code')||props.changed.grant_types.N.includes('urn:ietf:params:oauth:grant-type:device_code'))?'input-edited checkbox-item-edited':'')}
        ref={target}
        onMouseOver={()=>setShow(true)}
        onMouseOut={()=>setShow(false)}
      >
        <Checkbox name="grant_types" disabled={props.disabled} value='urn:ietf:params:oauth:grant-type:device_code' onClick={()=>{
           if(!props.values.grant_types.includes('urn:ietf:params:oauth:grant-type:device_code')&&props.values.device_code_validity_seconds===null){
            props.setFieldValue('device_code_validity_seconds',initialValues.device_code_validity_seconds,true).then(()=>{
              props.validateField('device_code_validity_seconds');
            });
           }    
        }}/>
          {t('form_device_code_desc')}
        <MyOverLay show={(props.changed&&(props.changed.grant_types.D.includes('urn:ietf:params:oauth:grant-type:device_code')||props.changed.grant_types.N.includes('urn:ietf:params:oauth:grant-type:device_code'))?'input-edited checkbox-item-edited':'')&&show} type='Edited' target={target}/>
      </div>
      <Form.Text className="text-muted text-left label-checkbox" id="uri-small-desc">
      {t('form_device_code_info')}
      </Form.Text>
      {props.values.grant_types.includes('urn:ietf:params:oauth:grant-type:device_code')?(
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
            {t('input_client_secret_info')}
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
            <InputGroup >
              <Form.Control
                type="text"
                name="client_secret"
                className={(editSecret?'d-none col-form-label-sm':'col-form-label-sm')+(props.changed?' input-edited':'')}
                onChange={props.onChange}
                isInvalid={props.isInvalid}
                onBlur={props.onBlur}
                placeholder='Type a secret'
                value={props.client_secret?props.client_secret:""}
                disabled={props.disabled}
                ref={editSecret?null:target}
                onMouseOver={()=>setShow(true)}
                onMouseOut={()=>setShow(false)}
              />
              {props.copybutton&&!editSecret?<CopyToClipboardComponent value={props.client_secret}/>:null}
            </InputGroup>

            {editSecret?
              <InputGroup>
                <Form.Control
                  type="text"
                  name="clientSecretHelp"
                  className={'col-form-label-sm'+(props.changed?' input-edited':'')}
                  value="*************"
                  isInvalid={props.isInvalid}
                  disabled={true}
                  ref={editSecret?target:null}
                  onMouseOver={()=>setShow(true)}
                  onMouseOut={()=>setShow(false)}
                />
                {props.copybutton?<CopyToClipboardComponent value={props.client_secret}/>:null}
              </InputGroup>
            :null
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
        <Table striped bordered hover size="sm" className={'input-list-table'+ (props.disabled?" input-list-table-disabled":"")}>
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
                    {Array.isArray(props.error) || typeof(props.error)==='string'?<tr><td className='error-td'><div className="error-message-list-item">{props.error[index]}</div></td><td></td></tr>:null}

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

  const mystyle = {
    width: "100%",
    wordWrap: "break-word",
    wordBreak:"break-all"
  };
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
          <td style={mystyle} className={'td-item ' + (type==='Added'?'row-added':type==='Deleted'?'row-deleted':"")}>{props.item}</td>

            <React.Fragment>
            <td style={{whiteSpace: "nowrap"}}>
              <Checkbox disabled={props.disabled} name={props.name} value={props.item}/>
            </td>
            </React.Fragment>

        </React.Fragment>

    </tr>
      <MyOverLay show={type&&type!=='Exists'&&show?'true':""} type={type} target={target}/>
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
  const mystyle = {
    width: "100%",
    wordWrap: "break-word",
    wordBreak:"break-all"
  };
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
      className={(Array.isArray(props.error)||typeof(props.error)==='string')&&props.error[props.index]?'error-tr':null}
      onMouseOver={()=>setShow(true)}
      onMouseOut={()=>setShow(false)}
      ref={target}
      >
      <td style={mystyle} className={"td-item "+(type==='Added'?'row-added':type==='Deleted'?'row-deleted':null)}>
        {props.item}
      </td>

        <td
          style={{whiteSpace: "nowrap"}}
        >
          
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
      ev.target.src = process.env.PUBLIC_URL + '/logo_placeholder.gif';
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
      {props.description||(props.moreInfo&&props.moreInfo.description)?
          <Form.Text className="text-muted text-left">
            {parse(props.moreInfo&&props.moreInfo.description?props.moreInfo.description:props.description)}
          </Form.Text>
          :''}
      <MyOverLay show={props.changed&&show?'string':null} type='Edited' target={target}/>
      {props.warning&&!props.error?<div className="warning-message"> <FontAwesomeIcon icon={faExclamationTriangle}/>Warning: Image could not be loaded, make sure the url points to an image resourse</div>:null}
      {props.error && props.touched ? (typeof(props.error)==='string')?(<div className="error-message">{props.error}</div>):(<div className="error-message">{t('input_image_error')}</div>):null}
      <FormikConsumer>
        {({ validationSchema, validate, onSubmit, ...rest }) => (
          <pre
            style={{
              fontSize: '.65rem',
              padding: '.25rem .5rem',
              overflowX: 'scroll',
            }}
          >
            <Image className="logo-input" referrerPolicy="no-referrer" src={props.value ? props.value:process.env.PUBLIC_URL + '/logo_placeholder.gif'} onError={addDefaultSrc} fluid />

          </pre>
        )}
      </FormikConsumer>
    </React.Fragment>
  )
}

export function MyOverLay(props) {
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
    <Overlay target={props.target.current}  show={show} placement={props.placement?props.placement:'right'}>
      {propsOv => (
        <Tooltip id="overlay-example" placement={propsOv.placement} arrowProps={propsOv.arrowProps} ref={propsOv.ref} style={propsOv.style} outofboundaries={propsOv.outofboundaries} >
          {props.type==="Added"?t('input_added'):props.type==="Deleted"?t('input_deleted'):props.type==="Edited"?t('input_edited'):props.type}

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
      className={'col-form-label.sm '+ (type==='Added'?'input-new':!type?'':'input-deleted')}
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
              {!props.disabled||!props.values?
              <InputGroup className={props.empty&&props.touched?'invalid-input mb-3':'mb-3'}>
                <Form.Control
                  value={newVal}
                  onChange={(e)=>{setNewVal(e.target.value.trim())}}
                  column="true"
                  sm="4"
                  onBlur={()=>{!props.touched&&props.setFieldTouched(props.name,true)}}
                  type="text"
                  className='col-form-label.sm'
                  placeholder={props.placeholder}
                  disabled={props.disabled}
                />
                <InputGroup.Prepend>
                {!props.disabled?
                  <Button
                    disabled={props.disabled}
                    variant="outline-primary"
                    onClick={()=>{
                      push(newVal);
                      setNewVal('');
                    }}
                  >{t('input_add_button')}
                  </Button>:null
                }
                    
                </InputGroup.Prepend>
                </InputGroup>:null}

              {props.values && props.values.length > 0 && props.values.map((item,index)=>(
                <React.Fragment key={index}>
                <InputGroup className="mb-3 spacing-bot-contact" >
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
                {props.error&&props.error[index]?
                  <div className="error-message-list-item" >{props.error[index]}</div>
                :null}
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
  const tenant = useContext(tenantContext);
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
                      onBlur={()=>{!props.touched&&props.setFieldTouched(props.name,true)}}
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
                              {tenant[0].form_config.contact_types.map((item,index) => {
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
  const tenant = useContext(tenantContext);

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
            placeholder="email@placeholder.com"
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
            {tenant[0].form_config.contact_types.map((item,index) => {
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
