import React,{useEffect,useContext,useState} from 'react';
import {useParams} from "react-router-dom";
import * as config from '../config.json';
import {tenantContext,userContext} from '../context.js';
import {LoadingPage} from './LoadingPage.js';
import {Logout} from './Modals';


export const UserHandler = () => {
  // eslint-disable-next-line
  let {tenant_name} = useParams();
  // eslint-disable-next-line
  const [tenant,setTenant] = useContext(tenantContext);
  // eslint-disable-next-line
  const [user,setUser] = useContext(userContext);
  const [logout,setLogout] = useState(false);

  useEffect(()=>{
    getUser(tenant_name);
    
    // eslint-disable-next-line
  },[]);

  const getUser = async (tenant_name)=>{
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
           //localStorage.setItem('user', response.user);  
          if(response){
            setUser(response.user);           
          }
          else{
            setLogout(true);
          }
         
      })
  }
  return (
    <React.Fragment>
      <Logout logout={logout}/>
      <LoadingPage loading={true}/>
    </React.Fragment>
  )
}

export default UserHandler;

