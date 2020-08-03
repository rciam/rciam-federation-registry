import React,{useState,useEffect} from 'react';
import OverlayTrigger from 'react-bootstrap/OverlayTrigger';
import Tooltip from 'react-bootstrap/Tooltip';
import DropdownButton from 'react-bootstrap/DropdownButton';
import Dropdown from 'react-bootstrap/Dropdown';
import useGlobalState from './useGlobalState.js';
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
import * as tenant_data from './tenant-config.json';
import { useTranslation } from 'react-i18next';

const ServiceList= (props)=> {
  // eslint-disable-next-line
  const { t, i18n } = useTranslation();
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
  const globalState = useGlobalState();
  let tenant = tenant_data.data[globalState.global_state.tenant];

  let renderedConnections = 0;
  useEffect(()=>{
    setLoadingList(true);
    getServices();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  },[]);

  let items = [];
  let itemsPerPage = 5;
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
    fetch(config.host+'service/list', {
      method: 'GET', // *GET, POST, PUT, DELETE, etc.
      credentials: 'include', // include, *same-origin, omit
      headers: {
      'Content-Type': 'application/json',
      'Authorization': localStorage.getItem('token')
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
        console.log(response.services);
        setServices(response.services);

      }
    });
  }


  const deleteService = (id)=>{
    setAsyncResponse(true);
    fetch(config.host+'petition/delete/'+id, {
      method: 'PUT', // *GET, POST, PUT, DELETE, etc.
      credentials: 'include', // include, *same-origin, omit
      headers: {
      'Content-Type': 'application/json',
      'Authorization': localStorage.getItem('token')
    }}).then(response=> {
      getServices();
      setResponseTitle(t('request_submit_title'));
      setAsyncResponse(false);
      if(response.status===200){
        setMessage(t('request_submit_success_msg'));
      }
      else{
        setMessage(t('request_submit_failled_msg') + response.status);
      }
    });
  }
  const deletePetition = (id)=>{
    setAsyncResponse(true);
    fetch(config.host+'petition/'+id, {
      method: 'DELETE', // *GET, POST, PUT, DELETE, etc.
      credentials: 'include', // include, *same-origin, omit
      headers: {
      'Content-Type': 'application/json',
      'Authorization': localStorage.getItem('token')
    }}).then(response=> {
      setResponseTitle(t('request_cancel_title'));
      setAsyncResponse(false);
      getServices();
      if(response.status===200){
        setMessage(t('request_cancel_success_msg'));
      }
      else{
      setMessage(t('request_cancel_fail_msg') + response.status);
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
              <Button variant="light" onClick={getServices} ><FontAwesomeIcon icon={faSync} />{t('petitions_refresh')}</Button>
              <Link to="/form/new"><Button style={{background:tenant.color}}><FontAwesomeIcon icon={faPlus}/>{t('petitions_new')}</Button></Link>
            </Col>
            <Col>
              <Button variant="light" className='filter-button' style={{color:tenant.color}} onClick={()=>setExpandFilters(!expandFilters)}><FontAwesomeIcon icon={faFilter} />
                {expandFilters?
                  <React.Fragment>
                    {t('filters_hide')}
                    <FontAwesomeIcon className='fa-arrow-up' icon={faSortUp}/>
                  </React.Fragment>
                  :
                  <React.Fragment>
                    {t('filters_show')}
                    <FontAwesomeIcon className='fa-arrow-down' icon={faSortDown}/>
                  </React.Fragment>
                }
              </Button>
            </Col>
            <Col className="options-search" md={3}>
              <InputGroup className="md-12">
                <FormControl
                placeholder={t('search')}
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
                <td>{t('td_service_name')}</td>
                <td>{t('td_service_desc')}</td>
                <td>{t('td_service_controls')}</td>
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
                            <TableItem service={item} user={props.user} key={index} setAlertMessage={setAlertMessage} setCancelRequest={setCancelRequest}  setConfirmationAction={setConfirmationAction} setConfirmationId={setConfirmationId}/>
                          )
                        }
                        return null
                      }):<tr><td></td><td>{t('no_services')}</td><td></td></tr>}
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
  // eslint-disable-next-line
  const { t, i18n } = useTranslation();
  const globalState = useGlobalState();
  console.log(props);
  let tenant = tenant_data.data[globalState.global_state.tenant];
  return (
    <tr>
      <td className="petition-details">
        <div className="table-image-container">
          <Image src={props.service.logo_uri} thumbnail/>
        </div>
      </td>
      <td>
        <div className="flex-column">
          <h3 className="petition-title">{props.service.service_name}</h3>
          <div className="badge-container">

            {props.service.hasOwnProperty('state')&&props.service.state!==null?<Badge className="status-badge" style={props.service.state==='deployed'?{background:tenant.color}:null} variant={props.service.state==='deployed'?'primary':'danger'}>{props.service.state==='deployed'?t('badge_deployed'):props.service.state==='error'?t('badge_error'):props.service.deleted===false?t('badge_pending'):t('badge_deleting')}</Badge>:null}
            {props.service.type?<Badge className="status-badge" variant="warning">
              {props.service.type==='edit'?t('badge_edit_pending'):props.service.type==='create'?t('badge_create_pending'):t('badge_delete_pending')}
              </Badge>:null}
            {props.service.comment?<Badge className="status-badge" variant="info">{t('badge_changes_requested')}</Badge>:null}
          </div>
          <p>{props.service.service_description}</p>
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
                  service_id:props.service.service_id,
                  petition_id:props.service.petition_id,
                  type:props.service.type
                }
              }}>
                <Button variant="secondary"><FontAwesomeIcon icon={faEye}/>{t('button_view')}</Button>
              </Link>
              {props.service.owned?
                <React.Fragment>
                  {props.service.comment?
                  <div className="notification">
                    <FontAwesomeIcon icon={faExclamation} className="fa-exclamation"/>
                    <FontAwesomeIcon icon={faCircle} className="fa-circle"/>
                  </div>:null}
                  <OverlayTrigger
                    placement='top'
                    overlay={
                      <Tooltip id={`tooltip-top`}>
                        {props.service.comment?t('changes_notification'):props.service.state==='deployed'?t('edit_notification'):t('pending_notification')}
                      </Tooltip>
                    }
                  >

                  <Link
                  className='button-link'
                  to={{
                    pathname:"/form/edit",
                    state:{
                      service_id:props.service.service_id,
                      petition_id:props.service.petition_id,
                      type:props.service.type,
                      comment:props.service.comment
                    }
                  }}>
                  <Button variant="info" style={{background:tenant.color}} disabled={props.service.state==='deployed'||!props.service.state?false:true}><FontAwesomeIcon icon={faEdit}/>{t('button_reconfigure')}</Button></Link>
                  </OverlayTrigger>
                </React.Fragment>
              :null
              }
              {props.user.admin&&props.service.petition_id&&!props.service.comment?<Link
                className='button-link'
                to={{
                pathname:"/form/review",
                state:{
                  service_id:props.service.service_id,
                  petition_id:props.service.petition_id,
                  type:props.service.type,
                  comment:props.service.comment
                }
              }}><Button variant="success"><FontAwesomeIcon icon={faEdit}/>{t('button_review')}</Button></Link>:null}
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
            {props.service.owned && (props.service.state==='deployed'||!props.service.service_id)?
              <React.Fragment>
                {props.service.type!=='create'?
                  <Dropdown.Item>
                    <div
                    className={props.service.state==='deployed'?'options-disabled':null}
                    onClick={()=>{
                      if(props.service.state==='deployed'){
                        if(props.service.type==='create'||props.service.type==='delete'){
                          props.setConfirmationId(props.service.petition_id);
                          props.setConfirmationAction('petition');
                          if(props.service.type==='delete'){
                            props.setCancelRequest(true);
                          }
                        }else{
                          props.setConfirmationId(props.service.service_id);
                          props.setConfirmationAction('service');
                        }
                      }else{
                        props.setAlertMessage(t('delete_pending_alert'));
                      }
                    }}>
                      {props.service.type==='delete'?t('options_cancel_delete'):t('options_delete')}
                    </div>
                  </Dropdown.Item>
              :null}
                {props.service.type==='edit'|| props.service.type==='create'?
                <Dropdown.Item>
                  <div onClick={()=>{
                      props.setConfirmationId(props.service.petition_id);
                      props.setConfirmationAction('petition');
                      props.setCancelRequest(true);
                  }}>
                    {props.service.type==='create'?t('options_cancel_create'):props.service.type==='edit'?t('options_cancel_edit'):null}
                  </div>
                </Dropdown.Item>
                :null
                }
              </React.Fragment>
            :null}
            {props.service.service_id?
              <Dropdown.Item as='span'>
              <div>
                <Link to={{
                  pathname:"/history/list",
                  state:{
                    service_id:props.service.service_id
                  }
                }}>{t('options_history')}</Link>
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
  // eslint-disable-next-line
  const { t, i18n } = useTranslation();
  const handleClose = () => props.setConfirmationId();
  return (
    <Modal show={props.confirmationId?true:false} onHide={handleClose}>
        <Modal.Header closeButton>
          <Modal.Title>
              {t('confirmation_title')} {props.cancelRequest?t('confirmation_cancel_request'):t('confirmation_delete')}
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
  // eslint-disable-next-line
  const { t, i18n } = useTranslation();

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
    return (showOwned&&(item.owned))
  }


  return (
    <React.Fragment>
      <SimpleCheckboxFilter name={t('pending_filter')} setFilter={setShowPending} filterValue={showPending} />
      {props.user.admin?<SimpleCheckboxFilter name={t('owned_filter')} setFilter={setShowOwned} filterValue={showOwned}/>:null}

      <div className='select-filter-container'>
          <select value={showEnvironment} onChange={(e)=>{

            setShowEnvironment(e.target.value);}}>
            <option value=''>{t('all_environments_filter')}</option>
            <option value='demo'>{t('demo_filter')}</option>
            <option value='production'>{t('production_filter')}</option>
            <option value='development'>{t('development_filter')}</option>
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
