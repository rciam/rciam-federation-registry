import React,{useEffect,useState,useContext} from 'react';
import { useTranslation } from 'react-i18next';
import {Context} from './user-context.js';
import useGlobalState from './useGlobalState.js';
import {LoadingPage} from './Components/LoadingPage.js';
import * as config from './config.json';


const Home = ()=> {
  // eslint-disable-next-line
  const user = useContext(Context);
  const [context, setContext] = useContext(Context);
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
         fetch(config.host+'user', {
           method: 'GET', // *GET, POST, PUT, DELETE, etc.
           credentials: 'include', // include, *same-origin, omit
           headers: {
           'Content-Type': 'application/json',
           'Authorization': localStorage.getItem('token')
         }}).then( response=>{
               if(response.status===200){return response.json();}
               else {return false}
             }).then(response=> {
             if(response){
               setContext(response.user);
               if(localStorage.getItem('invitation')){
                 activateInvitation();
               }
             }
             else{
               setContext(null);
               localStorage.removeItem('token');
             }
             globalState.setLogState({tenant:'EGI',log_state:response});
             setLoading(false);
         })
       }
       else{
         globalState.setLogState({tenant:'EGI',log_state:false});
       }

     }



   const activateInvitation = () => {
     fetch(config.host+'invitation', {
       method: 'PUT', // *GET, POST, PUT, DELETE, etc.
       credentials: 'include', // include, *same-origin, omit
       headers: {
       'Content-Type': 'application/json',
       'Authorization': localStorage.getItem('token')
       },
       body: JSON.stringify({code:localStorage.getItem('invitation')})
     }).then(response=>{
             localStorage.removeItem('invitation')
         })
   }


  return (
    <React.Fragment>
      {loading?<LoadingPage  loading={loading}/>:null}
      <div className="home-container">
        <h1>{t('main_greeting')}</h1>
        <p>{t('main_description')}</p>
      </div>
    </React.Fragment>
  )
}

export default Home;
