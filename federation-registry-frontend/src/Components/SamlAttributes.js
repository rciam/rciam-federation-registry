import React, {useState, useRef ,useEffect} from 'react';
import { Field} from 'formik';
import Form from 'react-bootstrap/Form';
import InputGroup from 'react-bootstrap/InputGroup';
import ToggleButton from 'react-bootstrap/ToggleButton';
import ButtonGroup from 'react-bootstrap/ButtonGroup';
import Button from 'react-bootstrap/Button';
import Table from 'react-bootstrap/Table';
import 'react-bootstrap-typeahead/css/Typeahead.css';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {faArrowRotateBack} from '@fortawesome/free-solid-svg-icons';
import {MyOverLay } from './Inputs';


export function SamlAttributesInput(props){  
    
    return (
          <Table striped bordered hover size="sm" className={'saml-attributes-table input-list-table'+ (props.disabled?" input-list-table-disabled":"")}>
            <thead>
                <React.Fragment>
                    <tr>
                      <th>
                          Friendly Name
                      </th>
                      <th>
                          Attribute Name
                      </th>
                      <th>
                        Required
                      </th>
                      <th>                      
                      </th>
                  </tr>
                  </React.Fragment>
          </thead>
          <tbody>
            {props.defaultValues.map((item,index)=>(
                <AttributesDefault key={index} setFieldValue={props.setFieldValue} index={index} errors={props.errors} defaultValues={props.defaultValues} item={item} name={props.name} values={props.values} valuesIndex={props.values&&Array.isArray(props.values)?props.values.findIndex(x => x.friendly_name ===item.friendly_name):-1} disabled={props.disabled} changed={props.changed}/>
            ))}
          </tbody>
        </Table>
    )
  }
  
  
  
  function AttributesDefault(props){
    const [show, setShow] = useState(false);
    const [type, setType] = useState("");
    const [required , setRequired] = useState(props.valuesIndex>-1?props.values[props.valuesIndex].required:props.item.required);
    const [name,setName] = useState(props.valuesIndex>-1?props.values[props.valuesIndex].name:props.item.name);
    const target = useRef(null);
    const [showError,setShowError] = useState(false);
    const targetName = useRef(null);

    

    const mystyle = {
      width: "50%",
      wordWrap: "break-word",
      wordBreak:"break-all"
    };
    useEffect(()=>{
      if(props.changed){
        if(props.changed.N.some(e=>e.friendly_name===props.item.friendly_name)){
          setType('added');
        }
        else if(props.changed.D.some(e=>e.friendly_name===props.item.friendly_name)){
          setType('deleted');
        }
        else if(props.changed.U.some(e=>e.friendly_name===props.item.friendly_name)){
          setType('edited');
        }
      }
  
      // eslint-disable-next-line react-hooks/exhaustive-deps
    },[]);

    useEffect(()=>{
      if(!Array.isArray(props.values)){
        console.log(props.values);
        console.log(typeof(props.values));
      }
    },[props.values])



    useEffect(()=>{
      if(props.valuesIndex>-1&&required!==props.values[props.valuesIndex].required){
        props.values[props.valuesIndex].required = required; 
        props.setFieldValue(props.name,[...props.values]);
      }
      // eslint-disable-next-line react-hooks/exhaustive-deps
    },[required,props.valuesIndex]);

    useEffect(()=>{
      if(props.valuesIndex>-1&&props.values[props.valuesIndex].required!==required){
        setRequired(props.values[props.valuesIndex].required);
      }
      // eslint-disable-next-line react-hooks/exhaustive-deps
    },[props.values,props.valuesIndex]);


    useEffect(()=>{
      if(props.valuesIndex>-1&&name!==props.values[props.valuesIndex].name){
        props.values[props.valuesIndex].name = name.trim();          
        props.setFieldValue(props.name,[...props.values]);
      }
      // eslint-disable-next-line react-hooks/exhaustive-deps
    },[name,props.valuesIndex])

    const handleAttribute = () =>{
        if (props.valuesIndex>-1) {
          const nextValue = props.values.filter(
          value => value.friendly_name !== props.item.friendly_name
          );
          props.setFieldValue(props.name, nextValue);
      } else {
          const nextValue = props.values.concat({...props.item,required,name});
          props.setFieldValue(props.name, nextValue);
      }
    }
    return (
      <React.Fragment>
        <tr key={props.index} onMouseOver={()=>setShow(true)} onMouseOut={()=>setShow(false)} ref={target} className={type?("row-"+type):""}>
            <React.Fragment>
                <td style={mystyle} className={'td-item'}>
                    {props.item.friendly_name}
                </td>
                <td style={mystyle} className={'td-item'}>
                  <InputGroup className="">
                    <Form.Control
                        onMouseOver={()=>setShowError(true)} 
                        onMouseOut={()=>setShowError(false)}
                        onChange={(e)=>{setName(e.target.value)}}
                        value={name}
                        type="text"
                        size="sm"
                        isInvalid={props.errors&&props.errors[props.valuesIndex]?!!props.errors[props.valuesIndex].name:false}
                        ref={targetName}
                        disabled={props.disabled}
                        changed="false"
                      />
                    {props.defaultValues[props.index].name!==name&&!props.disabled?
                      <InputGroup.Append>
                        <Button size="sm" variant="outline-primary" onClick={()=>{setName(props.defaultValues[props.index].name)}}><FontAwesomeIcon icon={faArrowRotateBack}/></Button>
                      </InputGroup.Append>
                      :null
                    }  
                  </InputGroup>
                </td>
                <td>
                  {props.valuesIndex>-1?
                    <ButtonGroup toggle className='toggle-button'>
                        <ToggleButton
                          type="radio"
                          variant="primary"
                          className={props.disabled&&required?"toggle-checked focus":""}
                          name="radio"
                          size="sm"
                          disabled={props.disabled}
                          checked={required}
                          onChange={(e) => setRequired(true)}
                        >
                          Yes
                        </ToggleButton>
                        <ToggleButton
                          type="radio"
                          variant="primary"
                          className={props.disabled&&!required?"toggle-checked focus":"" }
                          name="radio"
                          size="sm"
                          disabled={props.disabled}
                          checked={!required}
                          onChange={(e) => setRequired(false)}
                        >
                          No
                        </ToggleButton>
                    </ButtonGroup>:null
                  }
                </td>
                <td style={{whiteSpace: "nowrap"}} onClick={()=>{
                  handleAttribute();
                }}>
                <Field name={props.name}>
                {({ field, form }) => (
                    <input
                        type="checkbox"
                        value={props.item}
                        className={'checkbox-'+type}
                        checked={props.valuesIndex>-1&&type!=='deleted'}
                        disabled={props.disabled}
                        onChange={()=>{}}
                    />
                )}
                </Field>
                </td>  
            </React.Fragment>
        </tr>
        <MyOverLay show={props.error&&showError?'true':""} type={props.error&&props.error.name} target={targetName}/>
        <MyOverLay show={type&&show?'true':""} type={type.charAt(0).toUpperCase() + type.slice(1)} target={target}/>
      </React.Fragment>
    )
  }

  

  
  