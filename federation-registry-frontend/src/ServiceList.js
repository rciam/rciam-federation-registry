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
import {ListResponseModal,Logout,NotFound} from './Components/Modals.js';
import CopyDialog from './Components/CopyDialog.js';
import { useTranslation } from 'react-i18next';
import Alert from 'react-bootstrap/Alert';import {ConfirmationModal} from './Components/Modals';
import {userContext,tenantContext} from './context.js';
const {capitalWords} = require('./helpers.js');
var filterTimeout;


const ServiceList= (props)=> {
  // eslint-disable-next-line
  const [tenant,setTeanant] = useContext(tenantContext);
  const {tenant_name} = useParams();
  const [logout,setLogout] = useState(false);
  const [notFound,setNotFound] = useState();
  // eslint-disable-next-line
  const { t, i18n } = useTranslation();
  const [loadingList,setLoadingList] = useState();
  const [services,setServices] = useState([]);
  const [activePage,setActivePage] = useState(1);
  const [asyncResponse,setAsyncResponse] = useState(false);
  const [invites,setInvites] = useState();
  const [message,setMessage] = useState();
  const [responseTitle,setResponseTitle] = useState(null);
  const [searchString,setSearchString] = useState();
  const [expandFilters,setExpandFilters] = useState();
  const [confirmationData,setConfirmationData] = useState({});
  const [reset,setReset] = useState(false);
  const [outdatedCount,setOutdatedCount] = useState(0);
  const [requestReviewCount,setRequestReviewCount] = useState(0);
  // eslint-disable-next-line
  const [user,setUser] = useContext(userContext);
  const [showPending,setShowPending] = useState(false);
  const [showOwned,setShowOwned] = useState(false);
  const [integrationEnvironment,setIntegrationEnvironment] = useState();
  const [showOutdated,setShowOutdated] = useState(false);
  const [showRequestReview,setShowRequestReview] = useState(false);
  const [paginationItems,setPaginationItems] = useState([]);
  const [initialLoading,setInitialLoading] = useState();


  const [showNotification,setShowNotification] = useState(true);

  const pageSize = 10;

  useEffect(()=>{
    setInitialLoading(true);
    getInvites();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  },[]);

  useEffect(()=>{
     getServices();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  },[searchString,showOwned,showPending,integrationEnvironment,activePage,showOutdated,showRequestReview]);

  useEffect(()=>{
    setActivePage(1);
  },[searchString,showOwned,showPending,integrationEnvironment,showOutdated,setShowRequestReview]);




  const generateFilerString = ()=> {
    let filterString='';
    if(searchString){
      filterString = filterString + '&search_string=' + searchString;
    }
    if(showOwned){
      filterString = filterString + '&owned=' + true;
    }
    if(integrationEnvironment){
      filterString = filterString + '&env=' + integrationEnvironment;
    }
    if(showPending){
      filterString = filterString + '&pending=' + true;
    }
    if(showOutdated){
      filterString = filterString + '&outdated=' +true;
    }
    if(showRequestReview){
      filterString = filterString + '&request_review=' +true
    }

    return filterString;
  }
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
        return false;
      }
      else if(response.status===404){
        setNotFound('No invitations found');
        return false;
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
    setLoadingList(true);
    fetch(config.host+'tenants/'+tenant_name+'/services?page='+activePage+'&limit='+pageSize+generateFilerString(), {
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
        return false;
      }
      else if(response.status===416){
        setNotFound('Out of index');
        setActivePage(1);
        return false;
      }
      else {
        return false
      }
    }).then(response=> {
      setLoadingList(false);
      setInitialLoading(false);
      if(response){
        console.log(response);
        try{
          if(response.list_items.length===0&& activePage!==1){
              setActivePage(1);
          }
          setServices(response.list_items);
          if(!showOwned&&!showPending&!showOutdated&&!searchString){
            setOutdatedCount(response.outdated_count);
          }
          setRequestReviewCount(response.request_review_count);
          createPaginationItems(response.full_count);
          setReset(!reset);
        }
        catch(err){
          setActivePage(1);
        }
      }
    });
  }




  const createPaginationItems = (full_count)=>{
    const paginationItemsDisplayed = 15;
    let items = [];
    let totalPages = Math.ceil(full_count/pageSize);
    let startPage = (activePage-Math.floor(paginationItemsDisplayed/2)>=1?activePage-Math.floor(paginationItemsDisplayed/2):1);
    let finishPage = (startPage+paginationItemsDisplayed-1>totalPages?totalPages:startPage+paginationItemsDisplayed-1);


    if(full_count>=1){
      if(startPage>2){
        items.push(<Pagination.First key='first' onClick={()=>{setActivePage(1)}}/>)
        items.push(<Pagination.Prev key='prev' onClick={()=>{setActivePage((activePage-1<1?1:activePage-1))}}/>);
        items.push(<Pagination.Item key='prev10' onClick={()=>{setActivePage((activePage-10<1?1:activePage-10))}}>{activePage-10<1?1:activePage-10}</Pagination.Item>,<Pagination.Ellipsis key="dots_start" disabled={true}/>)
      }
      else{
        items.push(<Pagination.Prev key='prev' onClick={()=>{setActivePage((activePage-1<1?1:activePage-1))}}/>);
      }
      for(let pageNumber=startPage;pageNumber<=finishPage;pageNumber++){

        items.push(
          <Pagination.Item key={pageNumber} onClick={()=>{setActivePage(pageNumber)}} active={pageNumber === activePage}>
          {pageNumber}
          </Pagination.Item>
        )
      }
      if(finishPage<totalPages-2){
        items.push(<Pagination.Ellipsis key="dots_end" disabled={true}/>,<Pagination.Item key='next10' onClick={()=>{setActivePage((activePage+10>totalPages?totalPages:activePage+10))}}>{activePage+10>totalPages?totalPages:activePage+10}</Pagination.Item>);
        items.push(<Pagination.Next key='next' onClick={()=>{setActivePage((activePage+1>totalPages?totalPages:activePage+1))}}/>)
        items.push(<Pagination.Last key='last' onClick={()=>{setActivePage(totalPages)}}/>)
      }
      else{
        items.push(<Pagination.Next key='next' onClick={()=>{setActivePage((activePage+1>totalPages?totalPages:activePage+1))}}/>)
      }
    }
    setPaginationItems(items);
  };





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
          return false;
        }
        else if(response.status===404){
          setNotFound('Could not find service');
          return false;
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
          return false;
        }
        else if(response.status===404){
          setNotFound('Could not create petition');
          return false;
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
        return false;
      }
      else if(response.status===404){
        setNotFound('Petition not Found');
        return false;
      }
      else{
      setMessage(t('request_cancel_fail_msg') + response.status);
      }
    });
 }


  return(
    <React.Fragment>
      <Logout logout={logout}/>
      <NotFound notFound={notFound?true:false} setNotFound={setNotFound}/>
      <ListResponseModal message={message} modalTitle={responseTitle} setMessage={setMessage}/>

      <ConfirmationModal active={confirmationData.action?true:false} setActive={setConfirmationData} action={()=>{if(confirmationData.action==='delete_service'){deleteService(...confirmationData.args)}else{deletePetition(...confirmationData.args)}}} title={confirmationData.title} accept={'Yes'} decline={'No'}/>
      <div>
        <LoadingBar loading={initialLoading}>
        {requestReviewCount>0&&props.user.review_restricted?<Collapse in={showNotification}>
          <div>
            <Alert variant='primary' className="invitation_alert">
              {requestReviewCount>1?'There are ':'There is '} <span>{requestReviewCount}</span>{' '}
              request{requestReviewCount>1?'s':''} awaiting reviewal click
                Click{' '}
               <span className="alert_fake_link_primary" onClick={()=>{setExpandFilters(!expandFilters); setShowRequestReview(true); setShowNotification(false);}}>here</span>
                {' '}to find {requestReviewCount>1?'them':'it'} using the requested review filter and submit your review.
            </Alert>
          </div>
        </Collapse>:null}
        {outdatedCount>0&&props.user.review_restricted?<Collapse in={showNotification}>
          <div>
            <Alert variant='warning' className="invitation_alert">

              <span>{outdatedCount}</span>{' '}
               of the services you own are not up to date with the lastest requirements. Click{' '}
               <span className="alert_fake_link" onClick={()=>{setExpandFilters(!expandFilters); setShowOutdated(true); setShowNotification(false);}}>here</span>
                {' '}to find {outdatedCount>1?'them':'it'} using the outdated filter and reconfigure them following the instructions.
            </Alert>
          </div>
        </Collapse>:null}
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
                onChange={(e)=>{
                  clearTimeout(filterTimeout);
                  setLoadingList(true);
                  let value = e.target.value;
                  filterTimeout = setTimeout(function(){setSearchString(value);} ,1000)}}
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
                  <div className='filter-container' onClick={()=> setShowPending(!showPending)}>
                    <span>Show Pending</span>
                    <input type='checkbox' name='filter' checked={showPending} onChange={()=>setShowPending(!showPending)}/>
                  </div>
                  <div className='filter-container' onClick={()=> setShowOutdated(!showOutdated)}>
                    <span>Show Outdated</span>
                    <input type='checkbox' name='filter' checked={showOutdated} onChange={()=>setShowOutdated(!showOutdated)}/>
                  </div>
                  {props.user.review_restricted?<div className='filter-container' onClick={()=> setShowRequestReview(!showRequestReview)}>
                    <span>Show Pending Review</span>
                    <input type='checkbox' name='filter' checked={showRequestReview} onChange={()=>setShowRequestReview(!showRequestReview)}/>
                  </div>:null}
                  {props.user.view_all?
                  <div className='filter-container' onClick={()=> setShowOwned(!showOwned)}>
                    <span>Show Owned by Me</span>
                    <input type='checkbox' name='filter' checked={showOwned} onChange={()=> setShowOwned(!showOwned)}/>
                  </div>
                  :null}

                  <div className='select-filter-container'>
                      <select value={integrationEnvironment} onChange={(e)=>{
                        setIntegrationEnvironment(e.target.value);}}>
                        <option value=''>{t('all_environments_filter')}</option>
                        {tenant.form_config.integration_environment.map((item,index)=>{
                          return <option value={item} key={index}>{capitalWords(item)}</option>
                        })}
                      </select>
                  </div>
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
                    return(
                      <TableItem service={item} user={props.user} key={index}  setConfirmationData={setConfirmationData} />
                    )
                }):<tr><td></td><td>{t('no_services')}</td><td></td></tr>}
                {loadingList?
                  <tr className="table-overlay">
                    <td></td>
                  </tr>:null
                }

              </React.Fragment>

            </tbody>
          </Table>

          <Pagination>{paginationItems}</Pagination>
        </LoadingBar>
        <ProcessingRequest active={asyncResponse}/>
      </div>
    </React.Fragment>
    )
  }

function TableItem(props) {
  // eslint-disable-next-line
  const [tenant,setTenant] = useContext(tenantContext);


  const {tenant_name} = useParams();

  const [showCopyDialog,setShowCopyDialog] = useState(false);
  const toggleCopyDialog = () => {
    setShowCopyDialog(!showCopyDialog);
  }


  // eslint-disable-next-line
  const { t, i18n } = useTranslation();
  // eslint-disable-next-line
  const [user,setUser] = useContext(userContext);
  return (
    <tr>
      <td className="petition-details">

        <div className="integration-environment-container">
          <h5>
          <OverlayTrigger
            placement='top'
            overlay={
              <Tooltip id={`tooltip-top`}>
                {'Service '+(props.service.type==='create'?'will be':'is') +' integrated in the ' +props.service.integration_environment + ' environment'}
              </Tooltip>
            }
          >
            <Badge className="status-badge" variant={props.service.integration_environment==='development'?'secondary':props.service.integration_environment==='demo'?'dark':props.service.integration_environment==='production'?'info':'warning'}>{capitalWords(props.service.integration_environment==='development'?'dev':props.service.integration_environment==='production'?'prod':props.service.integration_environment)}</Badge>
          </OverlayTrigger>
          </h5>
        </div>

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
            {props.service.outdated&&!props.service.petition_id&&props.service.state==='deployed'?<Badge className="status-badge" variant="danger">Update Required</Badge>:null}
            {props.service.status==='changes'?<Badge className="status-badge" variant="info">{t('badge_changes_requested')}</Badge>:null}
            {props.service.status==='request_review'?<Badge className="status-badge" variant="info">Review Requested</Badge>:null}
          </div>
          <p>{props.service.service_description}</p>
        </div>
      </td>
      <td>
        <div className="petition-actions">
          <Row>
            <Col className='controls-col  controls-col-buttons'>
            <CopyDialog service_id={props.service.service_id} show={showCopyDialog} toggleCopyDialog={toggleCopyDialog} current_environment={props.service.integration_environment} />
            {props.service.state==='error'&&user.view_errors?
              <React.Fragment>
                <div className="notification">
                  <FontAwesomeIcon icon={faExclamation} className="fa-exclamation"/>
                  <FontAwesomeIcon icon={faCircle} className="fa-circle"/>
                </div>
                <OverlayTrigger
                  placement='top'
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
                      owned:props.service.owned?"true":null,
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
                  owned:props.service.owned?"true":null,
                  get_error:props.service.state==='error'&&user.view_errors?'get_errors':undefined
                }
              }}>

              <Button variant="secondary"><FontAwesomeIcon icon={faEye}/>{t('button_view')}</Button>
            </Link>
            }


              {props.service.owned?
                <React.Fragment>
                  {props.service.status==='changes'||(props.service.outdated&&!props.service.pettion_id&&props.service.state==="deployed")?
                  <div className="notification">
                    <FontAwesomeIcon icon={faExclamation} className="fa-exclamation"/>
                    <FontAwesomeIcon icon={faCircle} className="fa-circle"/>
                  </div>:null}
                  <OverlayTrigger
                    placement='top'
                    overlay={
                      <Tooltip id={`tooltip-top`}>
                        {props.service.status==='changes'?t('changes_notification'):props.service.outdated&&!props.service.pettion_id&&props.service.state==="deployed"?"Service needs to be updated":(props.service.state==='deployed'||props.service.type==='create')&&props.service.status!=='request_review'?t('edit_notification'):props.service.status==='request_review'?t('review_requested_notification'):t('pending_notification')}
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
                      owned:props.service.owned?"true":null,
                      comment:props.service.comment
                    }
                  }}>
                  <Button variant="info" style={{background:tenant.color}} disabled={props.service.status!=='request_review'&&(props.service.state==='deployed'||!props.service.state)?false:true}><FontAwesomeIcon icon={faEdit}/>{t('button_reconfigure')}</Button></Link>
                  </OverlayTrigger>
                </React.Fragment>
              :null
              }
              {(props.user.review||(props.service.owned&&props.service.integration_environment==='development'))&&props.service.petition_id&&!(props.service.status==='changes')&&(props.service.status!=='request_review'||(props.service.status==='request_review'&&props.user.review_restricted))?
              <React.Fragment>
              {props.service.status==='request_review'&&props.user.review_restricted?
                <div className="notification">
                <FontAwesomeIcon icon={faExclamation} className="fa-exclamation"/>
                <FontAwesomeIcon icon={faCircle} className="fa-circle"/>
                </div>
                :null
              }
              <Link
                className='button-link'
                to={{
                pathname:'/'+tenant_name+"/form/review",
                state:{
                  service_id:props.service.service_id,
                  petition_id:props.service.petition_id,
                  submitted: props.service.last_edited,
                  integration_environment:props.service.integration_environment,
                  type:props.service.type,
                  comment:props.service.comment
                }
              }}><Button variant="success" disabled={props.service.status==="request_review"&&!props.user.review_restricted}><FontAwesomeIcon icon={faEdit}/>{t('button_review')}</Button></Link>
              </React.Fragment>
              :null}

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
              {props.service.service_id && props.service.state==='deployed' && props.service.owned?
              <Dropdown.Item as='span'>
                <div>
                  <Link to={"#"} onClick={()=>{
                    toggleCopyDialog();
                  }}>Copy Service</Link>
                </div>
              </Dropdown.Item>
              :null}
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
              {props.service.owned &&( props.service.state==='deployed'||props.service.type==='create')&&props.service.type?
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








export default ServiceList;
