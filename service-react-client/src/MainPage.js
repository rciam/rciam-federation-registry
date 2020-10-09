import React,{useContext} from 'react';
import {BrowserRouter as Router} from "react-router-dom";
import useGlobalState from './useGlobalState.js';
import {Header,Footer,NavbarTop} from './HeaderFooter.js';
import Routes from './Router';
import {SideNav} from './Components/SideNav.js';
import { useTranslation } from 'react-i18next';
import {userContext,tenantContext} from './context.js';

 const MainPage= (props)=> {
      const tenant = useContext(tenantContext);
      const user = useContext(userContext);
      // eslint-disable-next-line
      const { t, i18n } = useTranslation();
      const globalState = useGlobalState();
      const logged = globalState.global_state.log_state;

      return(
        <React.Fragment>
          <Router>
            <Header/>
            <NavbarTop/>
            <div className="ssp-container main">
              <div className="flex-container">
                {logged&&<SideNav tenant_name={tenant&&tenant[0]?tenant[0].name:null}/>}
                <Routes user={user[0]} tenant={tenant[0]} t={t} />
              </div>
            </div>
            <Footer lang={props.lang} changeLanguage={props.changeLanguage}/>
          </Router>
        </React.Fragment>
      );
}





export default MainPage;
