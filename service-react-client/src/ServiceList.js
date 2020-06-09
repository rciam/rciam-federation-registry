import React,{useState,useEffect} from 'react';
import OverlayTrigger from 'react-bootstrap/OverlayTrigger';
import Tooltip from 'react-bootstrap/Tooltip';
import DropdownButton from 'react-bootstrap/DropdownButton';
import Dropdown from 'react-bootstrap/Dropdown';
import Collapse from 'react-bootstrap/Collapse';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {faSync,faPlus,faTimes,faEdit,faExclamation,faCircle,faEllipsisV,faEye,faSortDown,faSortUp,faFilter} from '@fortawesome/free-solid-svg-icons';
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


const ServiceList= (props)=> {
  const [loadingList,setLoadingList] = useState();
  const [services,setServices] = useState([]);
  const [confirmationId,setConfirmationId] = useState();
  const [activePage,setActivePage] = useState(1);
  const [confirmationAction,setConfirmationAction] = useState();
  const [cancelRequest,setCancelRequest] = useState(false);
  const [displayedServices,setDisplayedServices] = useState(0);
  const [asyncResponse,setAsyncResponse] = useState(false);
  const [message,setMessage] = useState();
  const [responseTitle,setResponseTitle] = useState(null);
  const [searchString,setSearchString] = useState();
  const [alertMessage,setAlertMessage] = useState();
  const [expandFilters,setExpandFilters] = useState();


  let renderedConnections = 0;
  useEffect(()=>{
    setLoadingList(true);
    getServices();
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
  const getServices = ()=> {
    fetch(config.host+'servicelist', {
      method: 'GET', // *GET, POST, PUT, DELETE, etc.
      credentials: 'include', // include, *same-origin, omit
      headers: {
      'Content-Type': 'application/json'
    }}).then(response=>{
      if(response.status===200){
        return response.json();
      }
      else {
        return false
      }
    }).then(response=> {
      setLoadingList(false);
      if(response){
        response.services.forEach((item,index)=>{
            response.services[index].display = true;
          })
        setServices(response.services);
      }
    });
  }


  const deleteService = (id)=>{
    setAsyncResponse(true);
    fetch(config.host+'service/delete/'+id, {
      method: 'PUT', // *GET, POST, PUT, DELETE, etc.
      credentials: 'include', // include, *same-origin, omit
      headers: {
      'Content-Type': 'application/json'
    }}).then(response=> {
      getServices();
      setResponseTitle('Your deregistration request');
      setAsyncResponse(false);
      if(response.status===200){
        setMessage('Was submited succesfully and is currently pending approval from an administrator.');
      }
      else{
        setMessage('Was not submited Status:' + response.status);
      }
    });
  }
  const deletePetition = (id)=>{
    console.log('here we cancel');
    setAsyncResponse(true);
    fetch(config.host+'petition/'+id, {
      method: 'DELETE', // *GET, POST, PUT, DELETE, etc.
      credentials: 'include', // include, *same-origin, omit
      headers: {
      'Content-Type': 'application/json'
    }}).then(response=> {
      setResponseTitle('Your pending request:');
      setAsyncResponse(false);
      getServices();
      if(response.status===200){
        setMessage('Was succesfully canceled!');
      }
      else{
      setMessage('Could not be canceled please try again. Status:'+response.status);
      }
    });
 }


  return(
    <React.Fragment>
      <ListResponseModal message={message} modalTitle={responseTitle} setMessage={setMessage}/>
      <Confirmation confirmationId={confirmationId} cancelRequest={cancelRequest} setConfirmationId={setConfirmationId} confirmationAction={confirmationAction==='petition'?deletePetition:deleteService}/>
      <Alert alertMessage={alertMessage} setAlertMessage={setAlertMessage}/>
      <div>
        <LoadingBar loading={loadingList}>
          <div className="options-bar">
          <Row >
            <Col>
              <Button variant="light" onClick={getServices} ><FontAwesomeIcon icon={faSync} />Refresh</Button>
              <Link to="/form/new"><Button><FontAwesomeIcon icon={faPlus}/>New Service</Button></Link>
            </Col>
            <Col>
              <Button variant="light" className='filter-button' onClick={()=>setExpandFilters(!expandFilters)}><FontAwesomeIcon icon={faFilter} />
                {expandFilters?
                  <React.Fragment>
                    Hide Filters
                    <FontAwesomeIcon className='fa-arrow-up' icon={faSortUp}/>
                  </React.Fragment>
                  :
                  <React.Fragment>
                    Show Filters
                    <FontAwesomeIcon className='fa-arrow-down' icon={faSortDown}/>
                  </React.Fragment>
                }
              </Button>
            </Col>
            <Col className="options-search" md={3}>
              <InputGroup className="md-12">
                <FormControl
                placeholder="Search"
                value={searchString}
                onChange={(e)=>{setSearchString(e.target.value)}}
                />
                <InputGroup.Append onClick={()=>{setSearchString('')}}>
                  <InputGroup.Text><FontAwesomeIcon icon={faTimes}/></InputGroup.Text>
                </InputGroup.Append>
              </InputGroup>
            </Col>
          </Row>
          <Collapse in={expandFilters}>
          <Row className="filters-row">
              <Col>
                <div className="filters-col">
                  <Filters user={props.user} services={services} setServices={setServices} setActivePage={setActivePage} searchString={searchString}/>
                </div>
              </Col>
            </Row>
          </Collapse>
          </div>
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
                      {services.length>=1?services.map((item,index)=>{
                        if(item.display){
                          renderedConnections++
                        }
                        if(index===services.length-1&&renderedConnections!==displayedServices){
                          setDisplayedServices(renderedConnections);
                        }
                        if(Math.ceil(renderedConnections/itemsPerPage)===activePage&&item.display){
                          return(
                            <TableItem item={item} user={props.user} key={index} setAlertMessage={setAlertMessage} setCancelRequest={setCancelRequest}  setConfirmationAction={setConfirmationAction} setConfirmationId={setConfirmationId}/>
                          )
                        }
                        return null
                      }):<tr><td></td><td>No services to display...</td><td></td></tr>}
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
          <h3 className="petition-title">{props.item.service_name}</h3>
          <div className="badge-container">
            {props.item.hasOwnProperty('state')&&props.item.state!==null?<Badge className="status-badge" variant={props.item.state==='deployed'?'primary':'danger'}>{props.item.state==='deployed'?'Deployed':props.item.state==='error'?'Deployment Malfunction':props.item.deleted===false?'Deployment in Progress':'Deregistration in Progress'}</Badge>:null}
            {props.item.hasOwnProperty('type')?<Badge className="status-badge" variant="warning">
              {props.item.type==='edit'?'Reconfiguration Pending':props.item.type==='create'?'Registration Pending':'Deregistration Pending'}
              </Badge>:null}
            {props.item.comment?<Badge className="status-badge" variant="info">Changes Requested</Badge>:null}
          </div>
          <p>{props.item.service_description}</p>
        </div>
      </td>
      <td>
        <div className="petition-actions">
          <Row>
            <Col className='controls-col  controls-col-buttons'>
              <Link
                className='button-link'
                to={{
                pathname:"/form/view",
                state:{
                  service_id:props.item.id,
                  petition_id:props.item.petition_id,
                  type:props.item.type
                }
              }}>
                <Button variant="secondary"><FontAwesomeIcon icon={faEye}/>View</Button>
              </Link>
              {props.item.requester===props.user.sub?
                <React.Fragment>
                  {props.item.comment?
                  <div className="notification">
                    <FontAwesomeIcon icon={faExclamation} className="fa-exclamation"/>
                    <FontAwesomeIcon icon={faCircle} className="fa-circle"/>
                  </div>:null}
                  <OverlayTrigger
                    placement='top'
                    overlay={
                      <Tooltip id={`tooltip-top`}>
                        {props.item.comment?'An admin has requested changes':props.item.state==='deployed'?'Click to Reconfigure':'Cannot be edited while waiting deployment'}
                      </Tooltip>
                    }
                  >

                  <Link
                  className='button-link'
                  to={{
                    pathname:"/form/edit",
                    state:{
                      service_id:props.item.id,
                      petition_id:props.item.petition_id,
                      type:props.item.type,
                      comment:props.item.comment
                    }
                  }}>
                  <Button variant="info" disabled={props.item.state==='deployed'||props.item.state===null?false:true}><FontAwesomeIcon icon={faEdit}/>Reconfigure</Button></Link>
                  </OverlayTrigger>
                </React.Fragment>
              :null
              }
              {props.user.admin&&props.item.petition_id&&!props.item.comment?<Link
                className='button-link'
                to={{
                pathname:"/form/review",
                state:{
                  service_id:props.item.id,
                  petition_id:props.item.petition_id,
                  type:props.item.type,
                  comment:props.item.comment
                }
              }}><Button variant="success"><FontAwesomeIcon icon={faEdit}/>Review</Button></Link>:null}
            </Col>
            <Col className='controls-col' md="auto">
            <DropdownButton
              variant="link"
              alignRight
              className='drop-container-controls'
              title={<React.Fragment>
                <div className='controls-options-container'>
                  <FontAwesomeIcon icon={faEllipsisV}/>
                </div>
              </React.Fragment>}
              id="dropdown-menu-align-right"
            >
            {props.item.requester===props.user.sub?
              <React.Fragment>
                {props.item.type!=='create'?
                  <Dropdown.Item>
                    <div
                    className={props.item.state==='deployed'?'options-disabled':null}
                    onClick={()=>{
                      if(props.item.state==='deployed'){
                        if(props.item.type==='create'||props.item.type==='delete'){
                          props.setConfirmationId(props.item.petition_id);
                          props.setConfirmationAction('petition');
                          if(props.item.type==='delete'){
                            props.setCancelRequest(true);
                          }
                        }else{
                          props.setConfirmationId(props.item.id);
                          props.setConfirmationAction('service');
                        }
                      }else{
                        props.setAlertMessage('Service cannot be deregistered until it is deployed');
                      }
                    }}>
                      {props.item.type==='delete'?'Cancel Deregistration':'Deregister Service'}
                    </div>
                  </Dropdown.Item>
              :null}
                {props.item.type==='edit'|| props.item.type==='create'?
                <Dropdown.Item>
                  <div onClick={()=>{
                      props.setConfirmationId(props.item.petition_id);
                      props.setConfirmationAction('petition');
                      props.setCancelRequest(true);
                  }}>
                    {props.item.type==='create'?'Cancel Registration':props.item.type==='edit'?'Cancel Reconfiguration':null}
                  </div>
                </Dropdown.Item>
                :null
                }
              </React.Fragment>
            :null}
            {props.item.id?
              <Dropdown.Item as='span'>
              <div>
                <Link to={{
                  pathname:"/history/list",
                  state:{
                    service_id:props.item.id
                  }
                }}>View History</Link>
              </div>
              </Dropdown.Item>

            :null
            }

            </DropdownButton>
            </Col>
        </Row>
        </div>
      </td>
    </tr>
  )
}
function Alert(props){
  const handleClose = () => props.setAlertMessage();
  return (
    <Modal show={props.alertMessage?true:false} onHide={handleClose}>
        <Modal.Header closeButton>
          <Modal.Title>
              {props.alertMessage}
          </Modal.Title>
        </Modal.Header>
        <Modal.Footer>
          <Button variant="primary" onClick={handleClose}>
            Continue
          </Button>
        </Modal.Footer>
    </Modal>
  )
}

function Confirmation(props){
  const handleClose = () => props.setConfirmationId();
  return (
    <Modal show={props.confirmationId?true:false} onHide={handleClose}>
        <Modal.Header closeButton>
          <Modal.Title>
              Are you sure sure you would like to {props.cancelRequest?'cancel the pending request for this service?':'deregister this service?'}
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

function Filters (props) {

  const [showPending,setShowPending] = useState(false);
  const [showOwned,setShowOwned] = useState(false);
  const [showEnvironment,setShowEnvironment] = useState();


  useEffect(()=>{
    if(props.services.length>0){
      props.services.forEach((item,index)=>{
        if(OwnedFilter(item)||PendingFilter(item)||SearchFilter(item)||EnvironmentFilter(item)){
          props.services[index].display=false;
        }
        else{
          props.services[index].display=true;
        }
      });
      props.setServices([...props.services])
      props.setActivePage(1);
    }


    // eslint-disable-next-line react-hooks/exhaustive-deps
  },[props.searchString,showOwned,showPending,showEnvironment]);
  const EnvironmentFilter = (item) => {
    return (showEnvironment&&item.integration_environment!==showEnvironment)
  }
  const SearchFilter = (item) => {
    return (props.searchString&&!item.service_name.toLowerCase().includes(props.searchString.toLowerCase().trim()))
  }
  const PendingFilter = (item) =>{
    return (showPending&&!item.petition_id)
  }
  const OwnedFilter = (item)=>{
    return (showOwned&&(item.requester!==props.user.sub))
  }


  return (
    <React.Fragment>
      <SimpleCheckboxFilter name="Show Pending" setFilter={setShowPending} filterValue={showPending} />
      {props.user.admin?<SimpleCheckboxFilter name="Show Owned By Me" setFilter={setShowOwned} filterValue={showOwned}/>:null}

      <div className='select-filter-container'>
          <select value={showEnvironment} onChange={(e)=>{

            setShowEnvironment(e.target.value);}}>
            <option value=''>All Environments</option>
            <option value='demo'>Demo</option>
            <option value='production'>Production</option>
            <option value='development'>Development</option>
          </select>
      </div>
    </React.Fragment>
  )
}

function SimpleCheckboxFilter (props) {

  const handleChange = () =>{
    props.setFilter(!props.filterValue);
  }

  return (
    <div className='filter-container' onClick={handleChange}>
      <span>{props.name}</span>
      <input type='checkbox' name='filter' checked={props.filterValue} onChange={handleChange}/>
    </div>
  )
}


export default ServiceList;
