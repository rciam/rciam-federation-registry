import React,{useState,useEffect,useContext} from 'react';
import OverlayTrigger from 'react-bootstrap/OverlayTrigger';
import Tooltip from 'react-bootstrap/Tooltip';
import DropdownButton from 'react-bootstrap/DropdownButton';
import Dropdown from 'react-bootstrap/Dropdown';
import Collapse from 'react-bootstrap/Collapse';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {faSync,faPlus,faTimes,faEdit,faExclamation,faQuestionCircle,faCircle,faCheckCircle,faEllipsisV,faEye,faSortDown,faSortUp,faFilter,faFileDownload} from '@fortawesome/free-solid-svg-icons';
import InputGroup from 'react-bootstrap/InputGroup';
import FormControl from 'react-bootstrap/FormControl';
import Button from 'react-bootstrap/Button';
import Col from 'react-bootstrap/Col';
import Row from 'react-bootstrap/Row';
import Table from 'react-bootstrap/Table';
import config from './config.json';
import {Link,useParams} from "react-router-dom";
import Badge from 'react-bootstrap/Badge';
import Pagination from 'react-bootstrap/Pagination';
import {LoadingBar,ProcessingRequest} from './Components/LoadingBar';
import {ListResponseModal,Logout,NotFound} from './Components/Modals.js';
import CopyDialog from './Components/CopyDialog.js';
import ManageTags from './Components/ManageTags.js';
import { useTranslation } from 'react-i18next';
import Alert from 'react-bootstrap/Alert';
import {ConfirmationModal} from './Components/Modals';
import {userContext,tenantContext} from './context.js';
import ButtonGroup from 'react-bootstrap/ButtonGroup';
import LogoContainer from './Components/LogoContainer.js';
const {capitalWords} = require('./helpers.js');
var filterTimeout;


const ServiceList= (props)=> {

  const query = new Proxy(new URLSearchParams(window.location.search), {
    get: (searchParams, prop) => searchParams.get(prop),
  });
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
  const [searchOwnerString,setSearchOwnerString] = useState();
  const [expandFilters,setExpandFilters] = useState();
  const [confirmationData,setConfirmationData] = useState({});
  const [reset,setReset] = useState(false);
  const [outdatedCount,setOutdatedCount] = useState(0);
  const [requestReviewCount,setRequestReviewCount] = useState(0);
  // eslint-disable-next-line
  const [user,setUser] = useContext(userContext);
  const [createdAfterString,setCreatedAfterString] = useState();
  const [createdBeforeString,setCreatedBeforeString] = useState();
  const [showPending,setShowPending] = useState(false);
  const [showOwned,setShowOwned] = useState(false);
  const [integrationEnvironment,setIntegrationEnvironment] = useState();
  const [showOutdated,setShowOutdated] = useState(false);
  const [showRequestReview,setShowRequestReview] = useState(false);
  const [showPendingSubFilter,setShowPendingSubFilter] = useState('');
  const [paginationItems,setPaginationItems] = useState([]);
  const [initialLoading,setInitialLoading] = useState(true);
  const [showOrphan,setShowOrphan] = useState(false);
  const [showNotification,setShowNotification] = useState(true);
  const [errorFilter,setErrorFilter] = useState(false);
  const [serviceCount,setServiceCount] = useState(0);
  const [tagString,setTagString] = useState();
  const [searchInputString,setSearchInputString] = useState("");
  const [protocolFilter,setProtocolFilter] = useState();
  const [waitingDeploymentFilter,setWaitingDeploymentFilter] = useState();
  const pageSize = 10;
  

  useEffect(()=>{
    localStorage.removeItem('url');
    getInvites();
    if(query.integration_environment){
      setExpandFilters(true);

      setIntegrationEnvironment(query.integration_environment);
    }
    if(query.outdated==='true'){
      setExpandFilters(true);
      setShowOutdated(true);
    }    
    // eslint-disable-next-line react-hooks/exhaustive-deps
  },[]);


  useEffect(()=>{
     getServices();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  },[searchString,showOwned,showPending,integrationEnvironment,activePage,showOutdated,showPendingSubFilter,showRequestReview,showOrphan,errorFilter,searchOwnerString,tagString,createdAfterString,createdBeforeString,protocolFilter,waitingDeploymentFilter]);

  useEffect(()=>{
    setActivePage(1);
  },[searchString,showOwned,showPending,integrationEnvironment,showOutdated,showPendingSubFilter,setShowRequestReview,showOrphan,errorFilter,searchOwnerString,tagString,createdAfterString,createdBeforeString,protocolFilter,waitingDeploymentFilter]);

  


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
    if(showPendingSubFilter){
      filterString = filterString + '&pending_sub=' +showPendingSubFilter;
    }
    if(showOrphan){
      filterString = filterString + '&orphan=' +true;
    }
    if(errorFilter){
      filterString = filterString + '&error=' + true;
    }
    if(searchOwnerString){
      filterString= filterString + '&owner=' + searchOwnerString;
    }
    if(tagString){
      filterString= filterString + '&tags=' + tagString;
    }
    if(createdAfterString){
      filterString = filterString + '&created_after=' + createdAfterString
    }
    if(createdBeforeString){
      filterString = filterString + '&created_before=' + createdBeforeString
    }
    if(protocolFilter){
      filterString = filterString + '&protocol=' + protocolFilter;
    }
    if(waitingDeploymentFilter){
      filterString = filterString + '&waiting_deployment=' +true; 
    }
    //filterString=filterString + '&tags=test,egi';

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
    fetch(config.host+'tenants/'+tenant_name+'/services/list?page='+activePage+'&limit='+pageSize+generateFilerString(), {
      method: 'GET', // *GET, POST, PUT, DELETE, etc.
      credentials: 'include', // include, *same-origin, omit
      headers: {
      'Content-Type': 'application/json',
      'Authorization': localStorage.getItem('token')
    }}).then(response=>{
      if(response.status===200||response.status===304){
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
        try{
          if(response.list_items.length===0&& activePage!==1){
              setActivePage(1);
          }
          setServices(response.list_items);
          if(!showOwned&&!showPending&!showOutdated&&!searchString){
            setOutdatedCount(response.outdated_count);
          }
          setRequestReviewCount(response.request_review_count);
          setServiceCount(response.full_count);
          createPaginationItems(response.full_count);
          setReset(!reset);
        }
        catch(err){
          setActivePage(1);
        }
      }
    });
  }


  const exportServicesToCsv = ()=> {
    fetch(config.host+'tenants/'+tenant_name+'/services/list?'+(generateFilerString().length>0?generateFilerString().slice(1):""), {
      method: 'GET', // *GET, POST, PUT, DELETE, etc.
      credentials: 'include', // include, *same-origin, omit
      headers: {
      'Content-Type': 'application/json',
      'Authorization': localStorage.getItem('token')
    }}).then(response=>{
      if(response.status===200||response.status===304){
        return response.json();
      }
      else if(response.status===401){
        setLogout(true);
        return false;
      }
      else if(response.status===416){
        return false;
      }
      else {
        return false
      }
    }).then(response=> {
      if(response){
        try{
          createCsv(response.list_items)
        }
        catch(err){
          
        }
      }
    });
  }


  const createCsv = (exportedServices) => {
    var csv =
      "Country,Organization,Service Name, Service Url, Service Managers, Integration Date, Last Update Date\n";
      exportedServices.forEach((service) => {
      csv += service.country + ",";
      csv += service.organization_name + ",";
      csv += service.service_name + ",";
      csv += service.website_url + ",";
      csv += service.owners.join(" ") + ",";
      //csv += Array.isArray(service.owners)?(service.owners.join(" ") + ","):[];
      csv += service.created_at + ",";
      csv += service.last_edited + ",";
      csv += "\n";
    });

    var hiddenElement = document.createElement("a");
    hiddenElement.href = "data:text/csv;charset=utf-8," + encodeURI(csv);
    hiddenElement.target = "_blank";

    //provide the name for the CSV file to be downloaded
    hiddenElement.download = "ServiceExport.csv";
    hiddenElement.click();
    console.log(csv);
  };




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
          setNotFound('Could not create request');
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
        setNotFound('Request not Found');
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
      <ConfirmationModal active={confirmationData.action?true:false} close={()=>{setConfirmationData({})}} action={()=>{if(confirmationData.action==='delete_service'){deleteService(...confirmationData.args)}else{deletePetition(...confirmationData.args)} setConfirmationData({});}} title={confirmationData.title} accept={'Yes'} decline={'No'}/>
      <div>
        <LoadingBar loading={initialLoading}>
        {requestReviewCount>0&&user.review_restricted?<Collapse in={showNotification}>
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
        {outdatedCount>0?<Collapse in={showNotification}>
          <div>
            <Alert variant='warning' className="invitation_alert">

              <span>{outdatedCount}</span>{' '}
               of the services you own are not up to date with the lastest requirements. Click{' '}
               <span className="alert_fake_link" onClick={()=>{setExpandFilters(!expandFilters); setShowOutdated(true); setShowOwned(true); setShowNotification(false);}}>here</span>
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
              {user.actions.includes('export_services')?
                <OverlayTrigger
                  placement='top'
                  overlay={
                    <Tooltip id={`tooltip-top`}>
                      Export filtered Services to a CSV file 
                    </Tooltip>
                  }
                > 
                  <Button variant="dark" onClick={exportServicesToCsv} >
                    <FontAwesomeIcon icon={faFileDownload} /> Export
                  </Button>
                </OverlayTrigger>
              :null}
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
                {user.actions.includes('get_services')||user.actions.includes('manage_tags')?
                  <div className='more_info_container'>
                    <OverlayTrigger
                      placement='top'
                      overlay={
                        <Tooltip id={`tooltip-top`}>
                          Use :owner=username|email to search by owner {user.actions.includes('manage_tags')?'and :tag=tag to search by service tag':''} and (:reg_after or :reg_before) =yyyy/mm/dd   in the Search Input.
                        </Tooltip>
                      }
                    >
                      <Col md="auto" className='more_info_field'>
                        <FontAwesomeIcon icon={faQuestionCircle} /> 
                      </Col>
                    </OverlayTrigger>
                  </div>
                :null}
                <FormControl
                placeholder={t('search')}
                value={searchInputString}
                type='text'
                onChange={(e)=>{
                  clearTimeout(filterTimeout);
                  setSearchInputString(e.target.value);
                  let value = e.target.value;
                  let regex_1 = /:owner *= *\S*/g;
                  let regex_tag_1 = /:tag *= *\S*/g;
                  let regex_tag_2 = /( )|:tag *=/g;
                  let regex_2 = /( )|:owner *=/g;
                  let regex_created_after_1 = /:reg_after *= *\S*/g;
                  let regex_created_after_2 = /( )|:reg_after *=/g;
                  let regex_created_before_1 = /:reg_before *= *\S*/g;
                  let regex_created_before_2 = /( )|:reg_before *=/g;
                  let userString = "";
                  let tagString_1 = "";
                  let tag_arr = [];
                  let arr = regex_1.exec(value);
                  let created_after = '';
                  let created_before = '';
                  let created_after_arr = regex_created_after_1.exec(value);
                  let created_before_arr = regex_created_before_1.exec(value);
                  value= value.replace(regex_created_after_1,'');
                  value= value.replace(regex_created_before_1,'');
                  if(created_after_arr){
                    created_after = created_after_arr[0].replace(regex_created_after_2,'');
                    if(created_after.length!==10){
                      created_after= "";
                    }
                  }
                  if(created_before_arr){
                    created_before = created_before_arr[0].replace(regex_created_before_2,'');
                    if(created_before.length!==10){
                      created_before= "";
                    }
                  }
                  value = value.replace(regex_1, '');
                  if(user.actions.includes('manage_tags') ){
                    tag_arr = regex_tag_1.exec(value);
                    value = value.replace(regex_tag_1,'')
                  }
                  value = value.replace(/ +/g,' ');
                  value = value.replace(/ *$/g,'');
                  value = value.replace(/^ */g,'');
                  if(arr &&arr.length>0){
                    userString = arr[0].replace(regex_2,'');
                  }
                  if(tag_arr && tag_arr.length>0){
                    tagString_1 = tag_arr[0].replace(regex_tag_2,'');
                  }
                  if(value==='undefined'||!value){
                    value='';
                  }
                  if(tagString!==tagString_1||searchOwnerString!==userString||searchString!==value||createdBeforeString!==created_before||createdAfterString!==created_after){
                    setLoadingList(true);
                  }
                  filterTimeout = setTimeout(function(){setSearchString(value); setTagString(tagString_1); setSearchOwnerString(userString); setCreatedAfterString(created_after); setCreatedBeforeString(created_before) } ,1000)}}
                />
                <InputGroup.Append role="button" onClick={()=>{setSearchInputString('')}}>
                  <InputGroup.Text><FontAwesomeIcon icon={faTimes}/></InputGroup.Text>
                </InputGroup.Append>
              </InputGroup>
            </Col>
          </Row>
          <Collapse in={expandFilters}>
          <Row className="filters-row">
              <Col>
                <div className="filters-col">
                  {user.actions.includes('review_petition')||user.actions.includes('review_restricted')?
                    <div className='pending-filter-container'>
                      <Dropdown as={ButtonGroup}>
                        <Button variant="secondary" className="split-button" onClick={()=> {if(showPending||waitingDeploymentFilter){setShowPendingSubFilter(''); setWaitingDeploymentFilter(false); setShowPending(false); }else{setWaitingDeploymentFilter(true); setShowPending(true);}  } }>Show Pending <input type="checkbox" readOnly checked={showPending||waitingDeploymentFilter}/></Button>
                        <Dropdown.Toggle split variant="secondary" id="dropdown-split-basic" />
                        <Dropdown.Menu>
                          <Dropdown.Item className={showPending&&!showPendingSubFilter?'pending-filter-active':''}>
                            <div className="dropdown_item_container_pending_filter" onClick={()=>{setShowPendingSubFilter(''); setWaitingDeploymentFilter(true); setShowPending(true);}}>
                              All Pending
                              {showPending&&!showPendingSubFilter?
                                <div><FontAwesomeIcon icon={faCheckCircle}/></div>
                                :''} 
                            </div>                                                
                          </Dropdown.Item>
                          <Dropdown.Item className={showPendingSubFilter==='pending'?'pending-filter-active':''}>
                            <div className="dropdown_item_container_pending_filter" onClick={()=>{setShowPendingSubFilter('pending'); setWaitingDeploymentFilter(false); setShowPending(true);}}>
                              Pending Review 
                              {showPendingSubFilter==='pending'?
                                <div><FontAwesomeIcon icon={faCheckCircle}/></div>:''} 
                            </div>
                          </Dropdown.Item>
                          <Dropdown.Item className={showPendingSubFilter==='request_review'?'pending-filter-active':''}>
                            <div className="dropdown_item_container_pending_filter" onClick={()=>{setShowPendingSubFilter('request_review'); setWaitingDeploymentFilter(false); setShowPending(true);}}>  
                              Review Requested 
                              {showPendingSubFilter==='request_review'?<div><FontAwesomeIcon icon={faCheckCircle}/></div>:''} 
                            </div>
                          </Dropdown.Item>
                          <Dropdown.Item className={showPendingSubFilter==='changes'?'pending-filter-active':''}>
                            <div className="dropdown_item_container_pending_filter" onClick={()=>{setShowPendingSubFilter('changes'); setWaitingDeploymentFilter(false); setShowPending(true);}}>
                              Changes Requested 
                              {showPendingSubFilter==='changes'?<div><FontAwesomeIcon icon={faCheckCircle}/></div>:''} 
                            </div>
                          </Dropdown.Item>
                          <Dropdown.Item className={waitingDeploymentFilter&&!showPendingSubFilter&&!showPending?'pending-filter-active':''}>
                            <div className="dropdown_item_container_pending_filter" onClick={()=>{setWaitingDeploymentFilter(true); setShowPendingSubFilter(); setShowPending(false);}}>
                              Pending Deployment 
                              {waitingDeploymentFilter&&!showPendingSubFilter&&!showPending?<div><FontAwesomeIcon icon={faCheckCircle}/></div>:''} 
                            </div>
                          </Dropdown.Item>
                        </Dropdown.Menu>
                      </Dropdown>
                    </div>  
                  :
                  <div className='filter-container' onClick={()=> setShowPending(!showPending)}>
                    <span>Show Pending</span>
                    <input type='checkbox' name='filter' checked={showPending} onChange={()=>setShowPending(!showPending)}/>
                  </div>
                  }
                 <OverlayTrigger
                                placement='top'
                                overlay={
                                    <Tooltip id={`tooltip-top`}>
                                      Show services whose configuration needs to be updated
                                    </Tooltip>
                                  }
                                >
                    <div className='filter-container' onClick={()=> setShowOutdated(!showOutdated)}>
                      <span>Show Outdated</span>
                      <input type='checkbox' name='filter' checked={showOutdated} onChange={()=>setShowOutdated(!showOutdated)}/>
                    </div>
                  </OverlayTrigger>
                  {user.view_all?
                    <React.Fragment>
                      <OverlayTrigger
                                placement='top'
                                overlay={
                                    <Tooltip id={`tooltip-top`}>
                                      Show services having no owner
                                    </Tooltip>
                                  }
                                >
                       <div className='filter-container' onClick={()=> setShowOrphan(!showOrphan)}>
                        <span>Show Ownerless</span>
                        <input type='checkbox' name='filter' checked={showOrphan} onChange={()=>setShowOrphan(!showOrphan)}/>
                        </div>
                      </OverlayTrigger>
                      <div className='filter-container' onClick={()=> setShowOwned(!showOwned)}>
                        <span>Show Owned by Me</span>
                        <input type='checkbox' name='filter' checked={showOwned} onChange={()=> setShowOwned(!showOwned)}/>
                      </div>
                    </React.Fragment>
                  :null}
                  {user.actions.includes('error_action')?
                    <div className='filter-container' onClick={()=> setErrorFilter(!errorFilter)}>
                      <span>Show Malfunctioned</span>
                      <input type='checkbox' name='filter' checked={errorFilter} onChange={()=>setErrorFilter(!errorFilter)}/>
                    </div>
                  :null}
                  <div className='select-filter-container'>
                      <select value={protocolFilter} onChange={(e)=>{
                        setProtocolFilter(e.target.value);}}>
                        <option value=''>All Protocols</option>
                        {tenant.form_config.protocol.map((item,index)=>{
                          return <option value={item} key={index}>{item.toUpperCase()}</option>
                        })}
                      </select>
                  </div>
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
                      <TableItem service={item} key={index}  setConfirmationData={setConfirmationData} getServices={getServices} setSearchInputString={setSearchInputString} setTagString={setTagString}/>
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
          <div className='service-count'>{'('+serviceCount+ " Total Services)"}</div>
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
  const [manageTags,setManageTags] = useState(false);
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
          <ManageTags manageTags={manageTags} setManageTags={setManageTags} tags={props.service.tags?props.service.tags:[]} service_id={props.service.service_id} getServices={props.getServices}/>
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
          <LogoContainer url={props.service.logo_uri}/>
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
         
          {user.actions.includes('manage_tags')&&props.service.tags?
            <div className="tags-container-servicelist">
              {props.service.tags.map((tag,index)=>{
                return (
                  <Badge key={index} onClick={()=>{
                    props.setSearchInputString(':tag='+tag);
                    props.setTagString(tag);
                  }} pill variant="dark">{tag}</Badge>
                )
              })}
            </div>
            :null
          }
          <p>{props.service.service_description}</p>
          
        </div>
        
      </td>
      <td>
        <div className="petition-actions">
          <Row>
            <Col className='controls-col  controls-col-buttons'>
            <CopyDialog service_id={props.service.service_id} show={showCopyDialog} toggleCopyDialog={toggleCopyDialog} current_environment={props.service.integration_environment} />
                {props.service.state==='error'&&user.view_errors?
                <div className="notification">
                  <FontAwesomeIcon icon={faExclamation} className="fa-exclamation"/>
                  <FontAwesomeIcon icon={faCircle} className="fa-circle"/>
                </div>
                :null}
                <OverlayTrigger
                  placement='top'
                  overlay={
                    <Tooltip id={`tooltip-top`}>
                      {props.service.state==='error'&&user.view_errors?'Deployment error click to view':'View Service'}
                    </Tooltip>
                  }
                >
                  <Link
                    className='button-link'
                    to={{
                    pathname:'/'+tenant_name+(props.service.service_id?"/services/"+props.service.service_id:'')+(props.service.petition_id?"/requests/"+props.service.petition_id:'')
                  }}>
                    <Button variant="secondary"><FontAwesomeIcon icon={faEye}/>{t('button_view')}</Button>
                  </Link>
                </OverlayTrigger>          


              {props.service.owned?
                <React.Fragment>
                  {props.service.status==='changes'||(props.service.outdated&&!props.service.petition_id&&props.service.state==='deployed')?
                  <div className="notification">
                    <FontAwesomeIcon icon={faExclamation} className="fa-exclamation"/>
                    <FontAwesomeIcon icon={faCircle} className="fa-circle"/>
                  </div>:null}
                  <OverlayTrigger
                    placement='top'
                    overlay={
                      <Tooltip id={`tooltip-top`}>
                        {props.service.status==='changes'?t('changes_notification'):props.service.outdated&&!props.service.petition_id&&props.service.state==='deployed'?"Service needs to be updated":(props.service.state==='deployed'||props.service.type==='create')&&props.service.status!=='request_review'?t('edit_notification'):props.service.status==='request_review'?t('review_requested_notification'):t('pending_notification')}
                      </Tooltip>
                    }
                  >

                  <Link
                  className='button-link'
                  to={{
                    pathname:'/'+tenant_name+(props.service.service_id?"/services/"+props.service.service_id:"")+ (props.service.petition_id?"/requests/"+props.service.petition_id:"") + "/edit"
                  }}>
                  <Button variant="info" style={{background:tenant.color}} disabled={props.service.status!=='request_review'&&(props.service.state==='deployed'||!props.service.state)?false:true}><FontAwesomeIcon icon={faEdit}/>{t('button_reconfigure')}</Button></Link>
                  </OverlayTrigger>
                </React.Fragment>
              :null
              }
              {
                (user.review||
                  (props.service.owned&&props.service.integration_environment==='development'))
                &&props.service.petition_id
                &&!(props.service.status==='changes')
                &&(props.service.status!=='request_review'||(props.service.status==='request_review'&&user.review_restricted))?
              <React.Fragment>
              {props.service.status==='request_review'&&user.review_restricted?
                <div className="notification">
                <FontAwesomeIcon icon={faExclamation} className="fa-exclamation"/>
                <FontAwesomeIcon icon={faCircle} className="fa-circle"/>
                </div>
                :null
              }
              <Link
                className='button-link'
                to={{
                pathname:'/'+tenant_name+(props.service.service_id?"/services/"+props.service.service_id:"")+ (props.service.petition_id?"/requests/"+props.service.petition_id:"") + "/review"
              }}><Button variant="success" disabled={props.service.status==="request_review"&&!user.review_restricted}><FontAwesomeIcon icon={faEdit}/>{t('button_review')}</Button></Link>
              </React.Fragment>
              :null}
              {(user.actions.includes('review_petition')&&props.service.status==='changes'&&!props.service.owned)||(!user.actions.includes('review_restricted')&&props.service.status==='request_review'&&!props.service.owned)?
                <React.Fragment>
                  <Link
                className='button-link'
                to={{
                pathname:'/'+tenant_name+(props.service.service_id?"/services/"+props.service.service_id:"")+ (props.service.petition_id?"/requests/"+props.service.petition_id:"") + "/view_request"
              }}><Button variant="warning" ><FontAwesomeIcon icon={faEye}/>View Request</Button></Link>
                </React.Fragment>
                :null
              }

            </Col>
            <Col className='controls-col' md="auto">
            <DropdownButton
              variant="link"
              alignRight
              className='drop-container-controls dropdown-filter'
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
              {props.service.owned && props.service.state==='deployed'&& props.service.status!=='request_review' && props.service.type!=='delete'?
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
              {user.actions.includes('manage_tags')&&props.service.service_id?
                <Dropdown.Item >
                  <div onClick={()=>{
                    setManageTags(true);
                  }}>
                    Manage Tags
                  </div>
                </Dropdown.Item>
              :null}
              {user.actions.includes('send_notifications')?
                <Dropdown.Item as='span'>
                  <Link to={{
                    pathname:'/'+tenant_name+(props.service.service_id?"/services/"+props.service.service_id:"/requests/"+props.service.petition_id)+"/groups/"+props.service.group_id+"/contact"
                  }}>Contact Owners</Link>
                </Dropdown.Item>
              :null}
              <Dropdown.Item as='span'>
                <div>
                  <Link to={{
                    pathname:'/'+tenant_name+(props.service.service_id?"/services/"+props.service.service_id:"/requests/"+props.service.petition_id)+"/groups/"+props.service.group_id
                  }}>{props.service.group_manager||user.actions.includes('invite_to_group')?t('manage_group'):t('view_group')}</Link>
                </div>
              </Dropdown.Item>

              {props.service.service_id?
                <Dropdown.Item as='span'>
                <div>
                  <Link to={{
                    pathname:'/'+tenant_name+"/services/"+props.service.service_id+"/history"
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