import React,{useState,useEffect} from 'react';
import {BrowserRouter as Router} from "react-router-dom";
import useGlobalState from './useGlobalState.js';
import {Header,Footer} from './HeaderFooter.js';
import Routes from './Router';
import {SideNav} from './Components/SideNav.js';
import * as config from './config.json';

 const MainPage= ()=> {

      const [user,setUser] = useState();

      const globalState = useGlobalState();
      const logged = globalState.global_state.log_state;

      useEffect(()=>{
        if(!logged){
          setUser(null);
        }
        if(logged&&!user){
          getUser();
        }
    },[logged,user])

      const getUser = ()=> {
        fetch(config.host+'user', {
          method: 'GET', // *GET, POST, PUT, DELETE, etc.
          credentials: 'include', // include, *same-origin, omit
          headers: {
          'Content-Type': 'application/json'
        }}).then(response=>response.json()).then(response=> {
            setUser(response.user);
        });
      }

      return(
        <React.Fragment>
        <div className="main-container">

          <Header user={user}/>
          <Router >
            <div className="flex-container">
              {logged&&<SideNav/>}
              <Routes user={user} />
            </div>
          </Router>
          <Footer/>
        </div>

        </React.Fragment>
      );

}
export default MainPage;
