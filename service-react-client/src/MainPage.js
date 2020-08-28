import React,{useContext} from 'react';
import {BrowserRouter as Router} from "react-router-dom";
import useGlobalState from './useGlobalState.js';
import {Header,Footer,NavbarTop} from './HeaderFooter.js';
import Routes from './Router';
import {SideNav} from './Components/SideNav.js';
import { useTranslation } from 'react-i18next';
import {Context} from './user-context.js';

 const MainPage= (props)=> {

      const user = useContext(Context);
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
              {logged&&<SideNav/>}
              <Routes user={user[0]} t={t} />
            </div>

          </div>

        <Footer lang={props.lang} changeLanguage={props.changeLanguage}/>

      </Router>

        </React.Fragment>
      );

}





export default MainPage;
