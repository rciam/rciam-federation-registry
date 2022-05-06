import React,{useEffect,useState,useContext} from 'react';
import { useTranslation } from 'react-i18next';
import {userContext,tenantContext} from './context.js';
import { useHistory,useParams } from "react-router-dom";
import {LoadingPage} from './Components/LoadingPage.js';
import config from './config.json';
import ServicePreviewTable from './Components/ServicePreviewTable.js'

const Home = ()=> {

  // eslint-disable-next-line
  let history = useHistory();
  let {tenant_name} = useParams();
  // eslint-disable-next-line
  const [tenant,setTenant] = useContext(tenantContext);
  // eslint-disable-next-line
  const [user, setUser] = useContext(userContext);
  // eslint-disable-next-line
  const { t, i18n } = useTranslation();
  const [loading,setLoading] = useState(false);
  const [services,setServices] = useState([]);

   useEffect(()=>{
    if(user&&user.name){
      let redirectUrl = localStorage.getItem('url');
      if(localStorage.getItem('invitation')){
        activateInvitation();
      }
      else if(redirectUrl){
        if(redirectUrl.split('/')[1]===tenant_name){
          localStorage.removeItem('url');
          history.push(redirectUrl);
        }
        else{
          localStorage.removeItem('url');
        }
      }
    }
     // eslint-disable-next-line
   },[user]);

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

   const activateInvitation = () => {
     fetch(config.host+'tenants/'+tenant_name+'/invitations/activate_by_code', {
       method: 'PUT', // *GET, POST, PUT, DELETE, etc.
       credentials: 'include', // include, *same-origin, omit
       headers: {
       'Content-Type': 'application/json',
       'Authorization': localStorage.getItem('token')
       },
       body: JSON.stringify({code:localStorage.getItem('invitation')})
     }).then( response=>{
           if(response.status===406){return response.json();}
           else if(response.status!==200){return true}
           else {return false}
         }).then(response=>{
           setLoading(false);
           localStorage.removeItem('invitation');
           if(response){
             history.push('/'+tenant_name+'/invitation_error',{error: response.error});
           }
           else {
             history.push('/'+tenant_name+'/invitations');
           }
     })
   }


  return (
    <React.Fragment>
      {loading?<LoadingPage  loading={loading}/>:null}
      <div className="home-container">
        <h1>{t('main_greeting')}</h1>
        <p>{localStorage.getItem('invitation')?t('invitation_landing_page_message'):tenant.description}</p>
        
      </div>
      {services.length>0&&!user?<ServicePreviewTable services={services}/>:null}
    </React.Fragment>
  )
}


export default Home;
