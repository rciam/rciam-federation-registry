import React,{useState,useEffect,useContext} from 'react';
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
import {Link,useParams} from "react-router-dom";
import Badge from 'react-bootstrap/Badge';
import Pagination from 'react-bootstrap/Pagination';
import {LoadingBar,ProcessingRequest} from './Components/LoadingBar';
import {ListResponseModal,Logout} from './Components/Modals.js';
import { useTranslation } from 'react-i18next';
import Alert from 'react-bootstrap/Alert';
import {ConfirmationModal} from './Components/Modals';
import {userContext,tenantContext} from './context.js';
const {capitalWords} = require('./helpers.js');



const ServiceList= (props)=> {
  // eslint-disable-next-line
  const [tenant,setTeanant] = useContext(tenantContext);
  const {tenant_name} = useParams();
  const [logout,setLogout] = useState(false);
  // eslint-disable-next-line
  const { t, i18n } = useTranslation();
  const [loadingList,setLoadingList] = useState();
  const [services,setServices] = useState([]);
  const [activePage,setActivePage] = useState(1);
  const [displayedServices,setDisplayedServices] = useState(0);
  const [asyncResponse,setAsyncResponse] = useState(false);
  const [invites,setInvites] = useState();
  const [message,setMessage] = useState();
  const [responseTitle,setResponseTitle] = useState(null);
  const [searchString,setSearchString] = useState();
  const [expandFilters,setExpandFilters] = useState();
  const [confirmationData,setConfirmationData] = useState({});
  const [reset,setReset] = useState(false);
  // eslint-disable-next-line
  const [user,setUser] = useContext(userContext);

  let renderedConnections = 0;
  useEffect(()=>{
    setLoadingList(true);
    getServices();
    getInvites();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  },[]);

  const getInvites = () => {
    fetch(config.host+'tenants/'+tenant_name+'/invitations', {
      method: 'GET', // *GET, POST, PUT, DELETE, etc.
      credentials: 'include', // include, *same-origin, omit
      headers: {
      'Content-Type': 'application/json',
      'Authorization': localStorage.getItem('token')
    }}).then(response=>{
      if(response.status===200){
        return response.json();
      }else if(response.status===401){
        setLogout(true);
      }
      else {
        return false
      }
    }).then(response=> {
        if(response){
          setInvites(response);
        }
        else{
          setInvites();
        }
      });
  }


  // Get data, to create Service List
  const getServices = ()=> {
    fetch(config.host+'tenants/'+tenant_name+'/services', {
      method: 'GET', // *GET, POST, PUT, DELETE, etc.
      credentials: 'include', // include, *same-origin, omit
      headers: {
      'Content-Type': 'application/json',
      'Authorization': localStorage.getItem('token')
    }}).then(response=>{
      if(response.status===200){
        return response.json();
      }
      else if(response.status===401){
        setLogout(true);
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
        console.log(response.services);
        setReset(!reset);
      }
    });
  }


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




  const deleteService = (service_id,petition_id)=>{
    setAsyncResponse(true);
    if(petition_id){
      fetch(config.host+'tenants/'+tenant_name+'/petitions/'+petition_id, {
        method: 'PUT', // *GET, POST, PUT, DELETE, etc.
        credentials: 'include', // include, *same-origin, omit
        headers: {
          'Content-Type': 'application/json',
          'Authorization': localStorage.getItem('token')
        },
        body:JSON.stringify({service_id:service_id,type:'delete'})
      }).then(response=> {
        getServices();
        setResponseTitle(t('request_submit_title'));
        setAsyncResponse(false);
        if(response.status===200){
          setMessage(t('request_submit_success_msg'));
        }else if(response.status===401){
          setLogout(true);
        }
        else{
          setMessage(t('request_submit_failled_msg') + response.status);
        }
      });
    }
    else {
      fetch(config.host+'tenants/'+tenant_name+'/petitions', {
        method: 'POST', // *GET, POST, PUT, DELETE, etc.
        credentials: 'include', // include, *same-origin, omit
        headers: {
          'Content-Type': 'application/json',
          'Authorization': localStorage.getItem('token')
        },
        body:JSON.stringify({service_id:service_id,type:'delete'})
      }).then(response=> {
        getServices();
        setResponseTitle(t('request_submit_title'));
        setAsyncResponse(false);
        if(response.status===200){
          setMessage(t('request_submit_success_msg'));
        }else if(response.status===401){
          setLogout(true);
        }
        else{
          setMessage(t('request_submit_failled_msg') + response.status);
        }
      });
    }
  }

  const deletePetition = (id)=>{
    setAsyncResponse(true);
    fetch(config.host+'tenants/'+tenant_name+'/petitions/'+id, {
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
      }else if(response.status===401){
        setLogout(true);
      }
      else{
      setMessage(t('request_cancel_fail_msg') + response.status);
      }
    });
 }


  return(
    <React.Fragment>
      <Logout logout={logout}/>
      <ListResponseModal message={message} modalTitle={responseTitle} setMessage={setMessage}/>

      <ConfirmationModal active={confirmationData.action?true:false} setActive={setConfirmationData} action={()=>{if(confirmationData.action==='delete_service'){deleteService(...confirmationData.args)}else{deletePetition(...confirmationData.args)}}} title={confirmationData.title} accept={'Yes'} decline={'No'}/>
      <div>
        <LoadingBar loading={loadingList}>
        {invites&&invites.length>0?
          <React.Fragment>
          <Alert variant='primary' className="invitation_alert">
            {t('invitation_alert_1')}
            <span>{invites.length}</span>
            {invites.length>1?t('invitation_alert_mult'):t('invitation_alert_single')}
            <Link to={{pathname:'/'+tenant_name+"/invitations", state:{invitations:invites}}}>
              {t('invitation_alert_link')}
            </Link>
            {t('invitation_alert_2')}
          </Alert>
          </React.Fragment>
        :null}
          <div className="options-bar">
          <Row>
            <Col>
              <Button variant="light" onClick={getServices} ><FontAwesomeIcon icon={faSync} />{t('petitions_refresh')}</Button>
              <Link to={'/'+tenant_name+"/form/new"}><Button style={{background:tenant.color,borderColor:tenant.color}}><FontAwesomeIcon icon={faPlus}/>{t('petitions_new')}</Button></Link>
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
                  <Filters reset={reset} user={props.user} services={services} setServices={setServices} setActivePage={setActivePage} setSearchString={setSearchString} searchString={searchString}/>
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
                            <TableItem service={item} user={props.user} key={index} setConfirmationData={setConfirmationData} />
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
  const [tenant,setTenant] = useContext(tenantContext);
  // eslint-disable-next-line
  const {tenant_name} = useParams();
  // eslint-disable-next-line
  const { t, i18n } = useTranslation();
    // eslint-disable-next-line
  const [user,setUser] = useContext(userContext);
  return (
    <tr>
      <td className="petition-details">
        <div className="table-image-container">
        <Image src={props.service.logo_uri?props.service.logo_uri:process.env.PUBLIC_URL + '/placeholder.png'} thumbnail/>
        </div>
      </td>
      <td>
        <div className="flex-column">
          <h3 className="petition-title">{props.service.service_name?props.service.service_name:props.service.client_id?props.service.client_id:props.service.metadata_url}</h3>
          <div className="badge-container">
            {props.service.hasOwnProperty('state')&&props.service.state!==null?<Badge className="status-badge" style={props.service.state==='deployed'?{background:tenant.color}:null} variant={props.service.state==='deployed'?'primary':'danger'}>{props.service.state==='deployed'?t('badge_deployed'):props.service.state==='error'?t('badge_error'):props.service.deployment_type==='delete'?t('badge_deleting'):t('badge_pending')}</Badge>:null}
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
            {props.service.state==='error'&&user.view_errors?
              <React.Fragment>
                <div className="notification">
                  <FontAwesomeIcon icon={faExclamation} className="fa-exclamation"/>
                  <FontAwesomeIcon icon={faCircle} className="fa-circle"/>
                </div>
                <OverlayTrigger
                  placement='top'
                  show={false}
                  overlay={
                    <Tooltip id={`tooltip-top`}>
                      Deployment error click to view
                    </Tooltip>
                  }
                >
                  <Link
                    className='button-link'
                    to={{
                    pathname:'/'+tenant_name+"/form/view",
                    state:{
                      service_id:props.service.service_id,
                      petition_id:props.service.petition_id,
                      type:props.service.type,
                      get_error:props.service.state==='error'&&user.view_errors?'get_errors':undefined
                    }
                  }}>

                  <Button variant="secondary"><FontAwesomeIcon icon={faEye}/>{t('button_view')}</Button>
                </Link>
                </OverlayTrigger>
              </React.Fragment>
              :
              <Link
                className='button-link'
                to={{
                pathname:'/'+tenant_name+"/form/view",
                state:{
                  service_id:props.service.service_id,
                  petition_id:props.service.petition_id,
                  type:props.service.type,
                  get_error:props.service.state==='error'&&user.view_errors?'get_errors':undefined
                }
              }}>

              <Button variant="secondary"><FontAwesomeIcon icon={faEye}/>{t('button_view')}</Button>
            </Link>
            }


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
                    pathname:'/'+tenant_name+"/form/edit",
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
                pathname:'/'+tenant_name+"/form/review",
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
              {props.service.owned && props.service.state==='deployed' && props.service.type!=='delete'?
                <Dropdown.Item>
                  <div
                  onClick={()=>{
                    props.setConfirmationData({
                      action:'delete_service',
                      args:[props.service.service_id,props.service.petition_id],
                      title:t('confirmation_title')+' '+t('confirmation_delete')
                    })
                  }}>
                    {t('options_delete')}
                  </div>
                </Dropdown.Item>
              :null}
              {props.service.owned && props.service.state==='deployed'&&props.service.type?
                <Dropdown.Item>
                  <div
                  onClick={()=>{
                    props.setConfirmationData({
                      action:'delete_petition',
                      args:[props.service.petition_id],
                      title:t('confirmation_title')+' '+t('confirmation_cancel_request')
                    })
                  }}>
                    {props.service.type==='create'?t('options_cancel_create'):props.service.type==='edit'?t('options_cancel_edit'):t('options_cancel_delete')}
                  </div>
                </Dropdown.Item>
              :null}

              <Dropdown.Item as='span'>
                <div>
                  <Link to={{
                    pathname:'/'+tenant_name+"/group",
                    state:{
                      group_manager:props.service.group_manager.toString(),
                      service_id:props.service.service_id,
                      group_id:props.service.group_id
                    }
                  }}>{props.service.group_manager||user.actions.includes('invite_to_group')?t('manage_group'):t('view_group')}</Link>
                </div>
              </Dropdown.Item>

              {props.service.service_id?
                <Dropdown.Item as='span'>
                <div>
                  <Link to={{
                    pathname:'/'+tenant_name+"/history/list",
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




function Filters (props) {


  const [showPending,setShowPending] = useState(false);
  const [showOwned,setShowOwned] = useState(false);
  const [showEnvironment,setShowEnvironment] = useState();
  // eslint-disable-next-line
  const { t, i18n } = useTranslation();
  // eslint-disable-next-line
  const [tenant,setTenant] = useContext(tenantContext);


  useEffect(()=>{
    setShowPending(false);
    setShowEnvironment();
    setShowOwned(false);
    props.setSearchString('');
    // eslint-disable-next-line
  },[props.reset]);

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
    if(item.service_name||!props.searchString){
      return (props.searchString&&!item.service_name.toLowerCase().includes(props.searchString.toLowerCase().trim()))
    }
    else{return true}
  }
  const PendingFilter = (item) =>{
    return (showPending&&!item.petition_id)
  }
  const OwnedFilter = (item)=>{
    return (showOwned&&!item.owned)
  }




  return (
    <React.Fragment>
      <SimpleCheckboxFilter name={t('pending_filter')} setFilter={setShowPending} filterValue={showPending} />
      {props.user.admin?<SimpleCheckboxFilter name={t('owned_filter')} setFilter={setShowOwned} filterValue={showOwned}/>:null}

      <div className='select-filter-container'>
          <select value={showEnvironment} onChange={(e)=>{
            setShowEnvironment(e.target.value);}}>

            <option value=''>{t('all_environments_filter')}</option>
            {tenant.form_config.integration_environment.map((item,index)=>{
              return <option value={item} key={index}>{capitalWords(item)}</option>
            })}
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
