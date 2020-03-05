import React,{useState,useEffect} from 'react';
import OverlayTrigger from 'react-bootstrap/OverlayTrigger';
import Tooltip from 'react-bootstrap/Tooltip';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {faSync,faPlus,faTimes,faEdit, faTrash, faExclamation,faCircle} from '@fortawesome/free-solid-svg-icons';
import InputGroup from 'react-bootstrap/InputGroup';
import FormControl from 'react-bootstrap/FormControl';
import Button from 'react-bootstrap/Button';
import Col from 'react-bootstrap/Col';
import Row from 'react-bootstrap/Row';
import Table from 'react-bootstrap/Table';
import * as config from './config.json';
import Image from 'react-bootstrap/Image';
import {Link} from "react-router-dom";
import Badge from 'react-bootstrap/Badge';
import Modal from 'react-bootstrap/Modal';
import Pagination from 'react-bootstrap/Pagination';
import {LoadingBar,ProcessingRequest} from './Components/LoadingBar';
import {ListResponseModal} from './Components/Modals.js';


const ClientList= (props)=> {
  const [loadingList,setLoadingList] = useState();
  const [services,setServices] = useState([]);
  const [confirmationId,setConfirmationId] = useState();
  const [activePage,setActivePage] = useState(1);
  const [confirmationAction,setConfirmationAction] = useState();
  const [cancelDelete,setCancelDelete] = useState(false);
  const [displayedServices,setDisplayedServices] = useState(0);
  const [asyncResponse,setAsyncResponse] = useState(false);
  const [message,setMessage] = useState();
  const [responseTitle,setResponseTitle] = useState(null);


  let renderedConnections = 0;
  useEffect(()=>{
    setLoadingList(true);
    getClients();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  },[]);

  let items = [];
  let itemsPerPage = 10;
  // issue here displaying less
  if(services){
    for (let number = 1; number <= Math.ceil(displayedServices/itemsPerPage) ; number++) {
      items.push(
        <Pagination.Item key={number} onClick={()=>{setActivePage(number)}} active={number === activePage}>
          {number}
        </Pagination.Item>,
      );
    }
  }

  // Get data, to create Service List
  const getClients = ()=> {
    fetch(config.host+'services/user', {
      method: 'GET', // *GET, POST, PUT, DELETE, etc.
      credentials: 'include', // include, *same-origin, omit
      headers: {
      'Content-Type': 'application/json'
    }}).then(response=>response.json()).then(response=> {
      if(response.success){
        setLoadingList(false);
        if(response.services){
          response.services.forEach((item,index)=>{
            response.services[index].display = true;
          })
        }
        setServices(response.services);
      }
    });
  }
  const filterOwned = ()=>{
    services.forEach((item,index)=>{

      if(item.requester!==props.user.sub){
        services[index].display=false;
      }
    })
    setServices([...services]);
  }

  const filterReset = () => {
    services.forEach((item,index)=>{
      services[index].display=true;
    })
    setServices([...services]);
  }

  const filterPending = ()=>{
    services.forEach((item,index)=>{
      if(!item.petition_id){
        services[index].display=false;
      }
    })
    setServices([...services]);
  }

  const filterClientName = (str)=>{
    services.forEach((item,index)=>{
      if(!item.client_name.toLowerCase().includes(str.toLowerCase().trim())){
        services[index].display=false;
      }
      else{
        services[index].display=true;
      }
    })
    setServices([...services]);
  }

  const deleteService = (id)=>{
    setAsyncResponse(true);
    fetch(config.host+'service/delete/'+id, {
      method: 'PUT', // *GET, POST, PUT, DELETE, etc.
      credentials: 'include', // include, *same-origin, omit
      headers: {
      'Content-Type': 'application/json'
    }}).then(response=>response.json()).then(response=> {
      getClients();
      setResponseTitle('Your deregistration request');
      if(response.success){
        setAsyncResponse(false);
        if(props.user.admin){
            confirmPetition(response.id);
        }
        else{

          setMessage('Was submited succesfully and is currently pending approval from an administrator.');
        }

      }
      else{
        setMessage('Was not submited due to the following error: ' + response.error);
      }
    });
  }
  const deletePetition = (id)=>{
    setAsyncResponse(true);
    fetch(config.host+'petition/delete/'+id, {
      method: 'PUT', // *GET, POST, PUT, DELETE, etc.
      credentials: 'include', // include, *same-origin, omit
      headers: {
      'Content-Type': 'application/json'
    }}).then(response=>response.json()).then(response=> {
      setResponseTitle('Your deregistration request was');
      if(response){
          setAsyncResponse(false);
          getClients();
          if(response.success){
            setMessage('Was canceled succesfully.');
          }
          else{
            setMessage('Could not get canceled due to the following error: '+response.error);
          }
      }

    });
  }
  const confirmPetition = (id) => {
    setAsyncResponse(true);
    fetch(config.host+'petition/approve/'+id, {
      method: 'PUT', // *GET, POST, PUT, DELETE, etc.
      credentials: 'include', // include, *same-origin, omit
      headers: {
      'Content-Type': 'application/json'
    },
      body:JSON.stringify({comment:null})
    }).then(response=>response.json()).then(response=> {
      if(response){
        if(response.success){
          setMessage('Was submited succesfully.');
        }
        else{
          setMessage('Was not submited due to the following error: '+response.error);
        }
        setAsyncResponse(false);
        getClients();
      }
    });
  }



  return(
    <React.Fragment>
      <ListResponseModal message={message} modalTitle={responseTitle} setMessage={setMessage}/>
      <Confirmation confirmationId={confirmationId} cancelDelete={cancelDelete} setConfirmationId={setConfirmationId} confirmationAction={confirmationAction==='petition'?deletePetition:deleteService}/>
      <div>
        <LoadingBar loading={loadingList}>
          <Row className="options-bar">
            <Col>
              <Button variant="light" onClick={getClients} ><FontAwesomeIcon icon={faSync} />Refresh</Button>
              <Link to="/form/new"><Button><FontAwesomeIcon icon={faPlus}/>New Service</Button></Link>
            </Col>
            <Col>
              <Filter name="Show Pending" resetFilter={filterReset} setActivePage={setActivePage} activateFilter={filterPending}/>
              {props.user.admin?<Filter name="Show Owned By Me" resetFilter={filterReset} setActivePage={setActivePage} activateFilter={filterOwned}/>:null}

            </Col>
            <Col className="options-search" md={3}>
              <InputGroup className="md-12">
                <FormControl
                placeholder="Search"
                onChange={(e)=>{e.target.value?filterClientName(e.target.value):filterReset()}}
                />
                <InputGroup.Append>
                  <InputGroup.Text><FontAwesomeIcon icon={faTimes}/></InputGroup.Text>
                </InputGroup.Append>
              </InputGroup>
            </Col>
          </Row>
          <Table striped bordered hover className="petitions-table">
            <thead>
              <tr>
                <td>Service</td>
                <td>Details</td>
                <td>Controls</td>
              </tr>
            </thead>
            <tbody>
              <React.Fragment>


                      {services.map((item,index)=>{
                        if(item.display){
                          renderedConnections++
                        }
                        if(index===services.length-1&&renderedConnections!==displayedServices){
                          setDisplayedServices(renderedConnections);
                        }
                        if(Math.ceil(renderedConnections/itemsPerPage)===activePage&&item.display){
                          return(
                            <TableItem item={item} user={props.user} key={index} setCancelDelete={setCancelDelete}  setConfirmationAction={setConfirmationAction} setConfirmationId={setConfirmationId}/>
                          )
                        }
                        return null
                      })}

              </React.Fragment>
            </tbody>
          </Table>
          <Pagination>{items}</Pagination>
        </LoadingBar>
        <ProcessingRequest active={asyncResponse}/>
      </div>

    </React.Fragment>
    )
  }

function TableItem(props) {

  return (
    <tr>
      <td className="petition-details">
        <div className="table-image-container">
          <Image src={props.item.logo_uri} thumbnail/>
        </div>
      </td>
      <td>
        <div className="flex-column">
          <h3 className="petition-title">{props.item.client_name}</h3>
          <div className="badge-container">


            {props.item.hasOwnProperty('deployed')?<Badge className="status-badge" variant={props.item.deployed?'info':'danger'}>{props.item.deployed?'Deployed':'Deployment in Progress'}</Badge>:null}

            {props.item.hasOwnProperty('type')?<Badge className="status-badge" variant="warning">

              {props.item.type==='edit'?'Reconfiguration Pending':props.item.type==='create'?'Registration Pending':'Deregistration Pending'}
              </Badge>:null}
          </div>
          <p>{props.item.client_description}</p>
        </div>
      </td>
      <td>
        <div className="petition-actions">
        {props.item.requester===props.user.sub?
          <React.Fragment>
          {props.item.status==='approved_with_changes'?
          <div className="notification">
            <FontAwesomeIcon icon={faExclamation} className="fa-exclamation"/>
            <FontAwesomeIcon icon={faCircle} className="fa-circle"/>
          </div>:null}

          <OverlayTrigger
            placement='top'
            overlay={
              <Tooltip id={`tooltip-top`}>
                {props.item.status==='approved_with_changes'?'An admin has requested changes':'Click to Edit'}
              </Tooltip>
            }
          >


          <Link to={{
            pathname:"/form/edit",
            state:{
              service_id:props.item.id,
              petition_id:props.item.petition_id,
              type:props.item.type,
              comment:props.item.comment
            }
          }}><Button variant="light"><FontAwesomeIcon icon={faEdit}/>Edit</Button></Link>

          </OverlayTrigger>
          <Button variant="danger" onClick={()=>{
            if(props.item.type==='create'||props.item.type==='delete'){
              props.setConfirmationId(props.item.petition_id);
              props.setConfirmationAction('petition');
              if(props.item.type==='delete'){
                props.setCancelDelete(true);
              }

            }else{
              props.setConfirmationId(props.item.id);
              props.setConfirmationAction('service');
            }
          }}><FontAwesomeIcon icon={faTrash} />{props.item.type==='delete'?'Cancel':'Delete'}</Button>
          </React.Fragment>
        :null
        }
        {props.user.admin&&props.item.petition_id&&props.item.status!=='approved_with_changes'?<Link to={{
          pathname:"/form/review",
          state:{
            service_id:props.item.id,
            petition_id:props.item.petition_id,
            type:props.item.type,
            comment:props.item.comment
          }
        }}><Button variant="success"><FontAwesomeIcon icon={faEdit}/>Review</Button></Link>:null}
        <Link to={{
          pathname:"/form/view",
          state:{
            service_id:props.item.id,
            petition_id:props.item.petition_id,
            type:props.item.type
          }
        }}><Button variant="secondary">View</Button></Link>


        </div>
      </td>
    </tr>
  )
}


function Confirmation(props){
  const handleClose = () => props.setConfirmationId();
  return (
    <Modal show={props.confirmationId?true:false} onHide={handleClose}>
        <Modal.Header closeButton>
          <Modal.Title>
              Are you sure sure you would like to {props.cancelDelete?'cancel deregistration request for this client?':'deregistrate this service?'}
          </Modal.Title>
        </Modal.Header>
        <Modal.Footer>
          <Button variant="danger" onClick={handleClose}>
            Cancel
          </Button>
          <Button variant="primary" onClick={()=>{props.confirmationAction(props.confirmationId); handleClose();}}>
            OK
          </Button>
        </Modal.Footer>
    </Modal>
  )
}




function Filter (props) {
  const [active,setActive] = useState(false);
  const handleChange = () =>{
    if(active){
      props.resetFilter();
    }
    else{
      props.activateFilter();
    }
    setActive(!active);
    props.setActivePage(1);
  }

  return (
    <div className='filter-container' onClick={handleChange}>
      <span>{props.name}</span>
      <input type='checkbox' name='filter' checked={active} onChange={handleChange}/>
    </div>
  )
}


export default ClientList;
