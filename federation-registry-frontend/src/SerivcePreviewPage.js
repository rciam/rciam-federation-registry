import React,{useEffect,useState} from 'react';
import {useParams } from "react-router-dom";
import {LoadingPage} from './Components/LoadingPage.js';
import config from './config.json';
import ServicePreviewTable from './Components/ServicePreviewTable.js'

const ServicePreviewPage = ()=> {

  // eslint-disable-next-line
  let {tenant_name} = useParams();
  const [loading,setLoading] = useState(false);
  const [services,setServices] = useState([]);


   useEffect(()=>{
     getServices();
      // eslint-disable-next-line
    },[])

   const getServices = () => {
    fetch(config.host+'tenants/'+tenant_name+'/services?integration_environment=production', {
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
      
      <ServicePreviewTable services={services}/>
    </React.Fragment>
  )
}


export default ServicePreviewPage;
