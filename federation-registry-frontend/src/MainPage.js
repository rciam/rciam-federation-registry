import React,{useContext,useEffect,useState} from 'react';
import {BrowserRouter as Router} from "react-router-dom";
import {Header,Footer,NavbarTop} from './HeaderFooter.js';
import Routes from './Router';
import {SideNav} from './Components/SideNav.js';
import { useTranslation } from 'react-i18next';
import {userContext,tenantContext} from './context.js';
import config from './config.json';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';

import {faTimes} from '@fortawesome/free-solid-svg-icons';

 const MainPage= (props)=> {
      const tenant = useContext(tenantContext);
      const user = useContext(userContext);
      // eslint-disable-next-line
      const { t, i18n } = useTranslation();
      const [showAlertBar,setShowAlertBar] = useState(config.testing_instance);
      

      useEffect(() => {
        const faviconUpdate = async () => {
          //grab favicon element by ID
          const favicon = document.getElementById("favicon");
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
          <Router basename={config.basename}>
            {showAlertBar?
              <div id="noty-info-bar" className="noty-top-info noty-top-global">
                <div>
                  This instance of Federation Registry is only used for testing purposes. 
                  {tenant&&tenant[0]&&tenant[0].config.production_url?
                    <React.Fragment>
                    To manage your services please use the production instance available at <a href={tenant[0].config.production_url}>{tenant[0].config.production_url}</a>
                    </React.Fragment>:null}
                </div>
                <a className="noty-top-close" href="#" onClick={()=>{setShowAlertBar(false); console.log('alert')}}>
                  <FontAwesomeIcon icon={faTimes}/>
                </a>
              </div>
            :null}
          
            <Header alertBar={showAlertBar} />
            <NavbarTop alertBar={showAlertBar}/>
            <div className="ssp-container main">
              <div className="flex-container">
                {user&&user[0]&&<SideNav tenant_name={tenant&&tenant[0]?tenant[0].name:null}/>}
                <Routes user={user[0]} tenant={tenant[0]} t={t} />
              </div>
            </div>
            <Footer lang={props.lang} changeLanguage={props.changeLanguage}/>
          </Router>
        </React.Fragment>
      );
}





export default MainPage;
