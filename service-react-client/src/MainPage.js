import React,{useState,useEffect} from 'react';
import {BrowserRouter as Router} from "react-router-dom";
import useGlobalState from './useGlobalState.js';
import {Header,Footer,NavbarTop} from './HeaderFooter.js';
import Routes from './Router';
import {SideNav} from './Components/SideNav.js';
import * as config from './config.json';
import { useTranslation } from 'react-i18next';

 const MainPage= (props)=> {
      // eslint-disable-next-line
      const { t, i18n } = useTranslation();
      const [user,setUser] = useState();
      const globalState = useGlobalState();

      useEffect(()=>{
        if(!localStorage.getItem('token')){
          setUser(null);
        }
        if(localStorage.getItem('token')&&!user){
          getUser();
        }
    },[localStorage.getItem('token'),user])

      const getUser = ()=> {
        fetch(config.host+'user', {
          method: 'GET', // *GET, POST, PUT, DELETE, etc.
          credentials: 'include', // include, *same-origin, omit
          headers: {
          'Content-Type': 'application/json',
          'Authorization': localStorage.getItem('token')
          }}).then(response=>response.json()).then(response=> {
            setUser(response.user);
        });
      }

      return(
        <React.Fragment>
          <Router>
          <Header user={user}/>
          <NavbarTop user={user}/>
          <div className="ssp-container main">

            <div className="flex-container">
              {localStorage.getItem('token')&&<SideNav/>}
              <Routes user={user} t={t} />
            </div>

          </div>

          <Footer lang={props.lang} changeLanguage={props.changeLanguage}/>
        </Router>

        </React.Fragment>
      );

}
export default MainPage;
