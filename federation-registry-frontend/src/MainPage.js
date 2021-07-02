import React,{useContext,useEffect} from 'react';
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


      useEffect(() => {
        const faviconUpdate = async () => {
          //grab favicon element by ID
          const favicon = document.getElementById("favicon");
          //check count value, if below 0 we change href property to our red circle image path
          if (tenant&&tenant[0]&&tenant[0].name==='egi') {
            favicon.href = "/favicon.ico?v=2";
          }
          //if above 0, we set back to green
          else if (tenant&&tenant[0]&&tenant[0].name==='eosc'){
            favicon.href = "/eosc.ico?v=2";
          }
        };
        //run our function here
        faviconUpdate();

        //2nd paramenter passed to useEffect is dependency array so that this effect only runs on changes to count
      }, [tenant]);

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
