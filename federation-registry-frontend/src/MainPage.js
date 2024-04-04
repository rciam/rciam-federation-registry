import React,{useContext,useEffect,useState} from 'react';
import {Header,Footer} from './HeaderFooter.js';
import Routes from './Router';
import {SideNav} from './Components/SideNav.js';
import { useTranslation } from 'react-i18next';
import {userContext,tenantContext} from './context.js';
import config from './config.json';


 const MainPage= (props)=> {
     
      const [tenant] = useContext(tenantContext);
      const [user] = useContext(userContext);
      // eslint-disable-next-line
      const { t, i18n } = useTranslation();




      const [bannerAlertInfo,setBannerAlertInfo] = useState([]);
      const getBannerAlerts = () => {
        if(tenant){
          fetch(config.host[tenant.name]+'tenants/'+tenant.name+'/banner_alert?active=true', {
            method: 'GET', // *GET, POST, PUT, DELETE, etc.
            credentials: 'include', // include, *same-origin, omit
            headers: {
              'Content-Type': 'application/json'
            }
          }).then(response=>{
            if(response.status===200){
              return response.json();
            }else if(response.status===401){
              return false
            }
            if(response.status===404){
              return false;
            }
            else {
              return false
            }
          }).then(response=> {
            if(response){
              setBannerAlertInfo(response);
            }
          });

        }
      }


      
      useEffect(()=>{
        getBannerAlerts();
        // eslint-disable-next-line react-hooks/exhaustive-deps
      },[tenant])
      
      useEffect(() => {
        if(tenant){
          const faviconUpdate = async () => {
            //grab favicon element by ID
            const favicon = document.getElementById("favicon");
            favicon.href = tenant?.base_url.slice(0,tenant.base_url.length - tenant.name.length)+'/'+tenant.config.icon+"?v=2";
          }
          //run our function here
          faviconUpdate();
        }
        
        //2nd paramenter passed to useEffect is dependency array so that this effect only runs on changes to count
      }, [tenant]);

      return(
        <React.Fragment>
            
            
            
            <Header bannerAlertInfo={bannerAlertInfo} alertBar={bannerAlertInfo.length>0} />
            <div className="ssp-container main">
              <div className="flex-container">
                {user&&<SideNav tenant_name={tenant?tenant.name:null}/>}
                <Routes user={user} tenant={tenant} t={t} />
              </div>
            </div>
            <Footer lang={props.lang} changeLanguage={props.changeLanguage}/>
          
        </React.Fragment>
      );
}





export default MainPage;
