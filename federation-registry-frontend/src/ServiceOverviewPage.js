import React,{useEffect,useState,useContext} from 'react';
import {useParams } from "react-router-dom";
import {LoadingPage} from './Components/LoadingPage.js';
import config from './config.json';
import ServiceOverviewTable from './Components/ServiceOverviewTable.js'
import {tenantContext} from './context.js';

const ServiceOverviewPage = ()=> {

  // eslint-disable-next-line
  let {tenant_name} = useParams();
  const [loading,setLoading] = useState(false);
  const [services,setServices] = useState([]);
  const [tenant] = useContext(tenantContext);


   useEffect(()=>{
     getServices();
      // eslint-disable-next-line
    },[])

   const getServices = () => {
    fetch(config.host[tenant_name]+'tenants/'+tenant_name+'/services?integration_environment='+tenant.config.home_page_services_integration_env+'&exclude_tags=test', {
      method: 'GET', // *GET, POST, PUT, DELETE, etc.
      credentials: 'include', // include, *same-origin, omit
      headers: {
      'Content-Type': 'application/json'}
    }).then( response=>{
          if(response.status===200||response.status===200){return response.json();}
          else if(response.status!==200){return true}
          else {return false}
        }).then(response=>{
          setLoading(false);
          if(response){
            setServices(response);
          }
    })
   }



  return (
    <React.Fragment>
      {loading?<LoadingPage  loading={loading}/>:null}
      
      <ServiceOverviewTable services={services}/>
    </React.Fragment>
  )
}


export default ServiceOverviewPage;
