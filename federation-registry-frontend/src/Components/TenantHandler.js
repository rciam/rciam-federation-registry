import React,{useEffect,useContext} from 'react';
import {useParams,useHistory} from "react-router-dom";
import * as config from '../config.json';
import {tenantContext} from '../context.js';
import {LoadingPage} from './LoadingPage.js';

export const TenantHandler = () => {
  // eslint-disable-next-line
  let {tenant_name} = useParams();
  // eslint-disable-next-line
  const [tenant,setTenant] = useContext(tenantContext);
  let history = useHistory();

  useEffect(()=>{
    getTenant(tenant_name);

    // eslint-disable-next-line
  },[]);

  const getTenant = (tenant_name)=>{
    fetch(config.host+'tenants/'+tenant_name,{
      method:'GET',
      credentials:'include',
      headers:{
        'Content-Type': 'application/json'
      }
    }).then(response => {
      if(response.status===200){
        return response.json();
      }
      else {
        return false
      }
    }).then(response=>{
      if(response){
        setTenant(response);
        history.push('/'+tenant_name+'/home');
      }
      else{
        setTenant(null);
        history.push('/404');
      }
    });
  }
  return (
    <React.Fragment>
      <LoadingPage loading={true}/>
    </React.Fragment>
  )
}

export const PageNotFound = (props) => {
  return (

      <div className="not_found_container">
        <h1><b>404</b>. That's an error.</h1>
        <h3>The requested url was not found on this server. <span>That's all we know.</span></h3>
      </div>

  )
}
