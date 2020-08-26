import React,{useState,useEffect} from 'react';
import {BrowserRouter as Router} from "react-router-dom";
import useGlobalState from './useGlobalState.js';
import {Header,Footer,NavbarTop} from './HeaderFooter.js';
import Routes from './Router';
import {SideNav} from './Components/SideNav.js';
import * as config from './config.json';
import { useTranslation } from 'react-i18next';
import {LoadingPage} from './Components/LoadingPage.js';

 const MainPage= (props)=> {
      // eslint-disable-next-line
      const { t, i18n } = useTranslation();
      const [user,setUser] = useState();
      const globalState = useGlobalState();
      const logged = globalState.global_state.log_state;
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
              }}).then(response=>{
                  if(response.status===200){return response.json();}
                  else {return false}
                }).then(response=> {
                console.log(response);
                if(response){
                  console.log(response.user);
                  setUser(response.user);
                  if(localStorage.getItem('invitation')){
                    activateInvitation();
                  }
                }
                else{
                  setUser(null);
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
              if(response.status===200){
                localStorage.setItem('invitation',null)
              }
            })
      }



      return(
        <React.Fragment>
        <Router>
          <Header user={user}/>
          <NavbarTop user={user}/>
          {loading?<LoadingPage  loading={loading}/>:null}
          <div className="ssp-container main">

            <div className="flex-container">
              {logged&&<SideNav/>}
              <Routes user={user} t={t} />
            </div>

          </div>

        <Footer lang={props.lang} changeLanguage={props.changeLanguage}/>
      </Router>

        </React.Fragment>
      );

}





export default MainPage;
