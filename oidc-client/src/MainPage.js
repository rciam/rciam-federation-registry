import React from 'react';
import {BrowserRouter as Router} from "react-router-dom";
import useGlobalState from './useGlobalState.js';
import {Header,Footer} from './HeaderFooter.js';
import Routes from './Router';
import {SideNav} from './Components/SideNav.js';


 const MainPage= ()=> {



      const globalState = useGlobalState();
      const logged = globalState.global_state.log_state;

      return(
        <React.Fragment>
        <div className="main-container">

          <Header/>
          <Router>
            <div className="flex-container">
              {logged&&<SideNav/>}

              <Routes/>
            </div>
          </Router>
          <Footer/>
        </div>

        </React.Fragment>
      );

}
export default MainPage;
