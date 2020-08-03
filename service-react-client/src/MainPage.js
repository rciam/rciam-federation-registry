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
        if(!logged){
          setUser(null);
        }
        if(logged&&!user){
          getUser();
        }
    },[logged,user])

      const getUser = ()=> {
        setLoading(true);
        fetch(config.host+'user', {
          method: 'GET', // *GET, POST, PUT, DELETE, etc.
          credentials: 'include', // include, *same-origin, omit
          headers: {
          'Content-Type': 'application/json',
          'Authorization': localStorage.getItem('token')
          }}).then(response=>response.json()).then(response=> {
            setUser(response.user);
            setLoading(false);
        });
      }

      return(
        <React.Fragment>
        <Router>
          <Header user={user}/>
          <NavbarTop user={user}/>
          {loading?<LoadingPage/>:null}
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
