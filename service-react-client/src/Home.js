import React,{useEffect,useState,useContext} from 'react';
import { useTranslation } from 'react-i18next';
import {userContext,tenantContext} from './context.js';
import { useHistory,useParams } from "react-router-dom";
import useGlobalState from './useGlobalState.js';
import {LoadingPage} from './Components/LoadingPage.js';
import * as config from './config.json';


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
  const globalState = useGlobalState();
  const [loading,setLoading] = useState(false);

   useEffect(()=>{
     login();
     // eslint-disable-next-line
   },[]);

   const login = () => {

       if(localStorage.getItem('token')){
         setLoading(true);
         fetch(config.host+'tenants/'+tenant_name+'/user', {
           method: 'GET', // *GET, POST, PUT, DELETE, etc.
           credentials: 'include', // include, *same-origin, omit
           headers: {
           'Content-Type': 'application/json',
           'Authorization': localStorage.getItem('token')
         }}).then( response=>{
               if(response.status===200){return response.json();}
               else {return false}
             }).then(response=> {
             globalState.setLogState({log_state:response});

             if(response){
               setUser(response.user);
               if(localStorage.getItem('invitation')){
                 activateInvitation();
               }
               else{
                 setLoading(false);
               }
             }
             else{
               setLoading(false);
               setUser(null);
               localStorage.removeItem('token');
             }

         })
       }
       else{
         globalState.setLogState({log_state:false});
       }
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
             history.push('/'+tenant.name+'/invitations');
           }


     })
   }

   const test = "greet";
  return (
    <React.Fragment>
      {loading?<LoadingPage  loading={loading}/>:null}
      <div className="home-container">
        <h1>{t('main_'+test+'ing')}</h1>
        <p>{tenant.description}</p>
      </div>
    </React.Fragment>
  )
}

export default Home;
