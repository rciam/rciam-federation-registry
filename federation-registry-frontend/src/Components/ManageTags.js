import React,{useState,useRef,useEffect} from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {faSearch,faTimes} from '@fortawesome/free-solid-svg-icons';
import InputGroup from 'react-bootstrap/InputGroup';
import Button from 'react-bootstrap/Button';
import config from '../config.json';
import {useParams} from "react-router-dom";
import Modal from 'react-bootstrap/Modal';
import Form from 'react-bootstrap/Form';
import { Typeahead } from 'react-bootstrap-typeahead'; // ES2015
import 'react-bootstrap-typeahead/css/Typeahead.css';
import {ConfirmationModal,MessageModal} from './Modals';


const ManageTags = (props) => {
    let {tenant_name} = useParams();
    //const [singleSelections, setSingleSelections] = useState((props.values.organization_name?[props.values.organization_name]:[]));
    const target = useRef(null);

    const [singleSelections, setSingleSelections] = useState([]);
    const [serviceTags,setServiceTags] = useState(props.tags);
    const [tags,setTags] = useState([]);
    const [tagToDelete,setTagToDelete] = useState();
    const [alertMessage,setAlertMessage] = useState();

    useEffect(()=>{
      if(props.manageTags){
        getTags();
      }
      // eslint-disable-next-line react-hooks/exhaustive-deps
    },[props.manageTags]);

    useEffect(()=>{
      setServiceTags(props.tags);
    },[props.tags])


    const handleClose = () => {
      props.getServices();
      props.setManageTags(false);
    }


    const addTag = () => {
      fetch(config.host+'tenants/'+tenant_name+'/tags/services/'+props.service_id , {
        method: 'POST', // *GET, POST, PUT, DELETE, etc.
        credentials: 'include', // include, *same-origin, omit
        headers: {
        'Content-Type': 'application/json',
        'Authorization': localStorage.getItem('token')
        },
        body:JSON.stringify([singleSelections[0]])
      }).then(response=>{
        if(response.status===200){
          return true
        }
        else if(response.status===401){
          //setLogout(true);
          return false;
        }
        else{
          return false;
        }
      }).then((response)=>{
        if(response){
          setServiceTags([...serviceTags,singleSelections[0]]);
          setAlertMessage('Tag was added successfully');
          setSingleSelections([]);
        }
        else{
          setAlertMessage('Tag could not be added');
        }
        
      })
    }
    

    const deleteTag = () => {
      fetch(config.host+'tenants/'+tenant_name+'/tags/services/'+props.service_id, {
        method: 'DELETE', // *GET, POST, PUT, DELETE, etc.
        credentials: 'include', // include, *same-origin, omit
        headers: {
        'Content-Type': 'application/json',
        'Authorization': localStorage.getItem('token')
        },
        body:JSON.stringify([tagToDelete])
      }).then(response=>{
        if(response.status===200){
          return true
        }
        else if(response.status===401){
          //setLogout(true);
          return false;
        }
        else{
          return false;
        }
      }).then((response)=>{
        if(response){
          setServiceTags([...serviceTags.filter(e => e !== tagToDelete)]);
          setAlertMessage('Tag was removed successfully');
        }
        else{
          setAlertMessage('Tag could not be removed');
        }
      })
      setTagToDelete();

    }

    const getTags = (searchString) => {
        fetch(config.host+'tenants/'+tenant_name+'/tags' + (searchString?('?tag='+searchString):''),{
            method:'GET',
            credentials:'include',
            headers:{
              'Content-Type':'application/json',
              'Authorization': localStorage.getItem('token')
            }
          }).then(response=>{
            if(response.status===200||response.status===304){
              return response.json();
            }
            else if(response.status===401){
              //setLogout(true);
              return false;
            }
            else if(response.status===404){
              //setNotFound('No invitations found');
              return false;
            }
            else{
              return false
            }
          }).then(response=>{
            if(response){
              let tags = response;
              serviceTags.forEach(tag=>{
                tags = tags.filter(e => e !== tag);
              })
              if(searchString&&!tags.includes(searchString)&&!serviceTags.includes(searchString)){
                tags.unshift(searchString + ' (Add new Tag)');
              }
              setTags(tags);
            }
          })
    }

    const handleChange = async (selected) => {
      if(selected&&selected[0]&&selected[0].length>=14&& selected[0].slice(selected[0].length-14,selected[0].length)===' (Add new Tag)'){
        selected[0] =selected[0].slice(0,selected[0].length -14)
      }
      setSingleSelections(selected);
    } 
  
    return(
      <React.Fragment>
        <MessageModal active={alertMessage} close={()=>{setAlertMessage()}} title={alertMessage} />
        <ConfirmationModal active={tagToDelete?true:false} setActive={()=>{setTagToDelete()}} action={()=>{deleteTag(tagToDelete);}} title={'Are you sure you want to remove the tag '+ tagToDelete + ' from this service?' } accept={'Yes'} decline={'No'}/>
        <Modal show={props.manageTags} onHide={handleClose}>
          <Modal.Header closeButton>
            <Modal.Title>Manage Service Tags
            </Modal.Title>
          </Modal.Header>
          <Modal.Body>
            <Form.Group className='organizations-input'>
                <InputGroup>  
                  <InputGroup.Text><FontAwesomeIcon icon={faSearch}/></InputGroup.Text>
                  <Typeahead
                      id="basic-typeahead-single"
                      labelKey="name"
                      name='tags'
                      onInputChange={(e)=>{
                        getTags(e);
                        handleChange([e]);
                      }}
                      filterBy={() => true}
                      onChange={(selected)=>{
                        if(!singleSelections[0]||(singleSelections[0]&&selected[0]&&!singleSelections[0]!==selected[0])){
                          handleChange(selected);
                        }
                      }}
                      options={[...tags]}
                      ref={target}
                      placeholder="Type tag you want to add..."
                      selected={singleSelections}
                  />
                  <InputGroup.Append>
                    <Button variant="success" onClick={()=>{
                      if(singleSelections&&singleSelections[0]){
                        if(!serviceTags.includes(singleSelections[0])){
                          addTag();  
                        }
                        else{
                          setAlertMessage('This tag already exists')
                        }
                      }
                      else{
                        setAlertMessage('Cannot create empty tag')
                      }
                    }}>+</Button>
                  </InputGroup.Append>
                </InputGroup>
            </Form.Group>  
            <Form.Text className="text-mute"> Tags can be used to filter service search results </Form.Text>


            <div className={'manage-tags-container '+(serviceTags.length<1?'manage-tags-container-small ':'')}>
              {serviceTags.length>0?serviceTags.map((tag,index)=>{
                return <Button key={index} className='tag-button' size='sm' variant='outline-dark' onClick={()=>{setTagToDelete(tag)}}>{tag} <FontAwesomeIcon icon={faTimes}/> </Button>
              }):
              <span className="text-muted">No active tags for this service</span>
              }
              
            </div>
          </Modal.Body>
        </Modal>
      </React.Fragment>
    )
}

export default ManageTags