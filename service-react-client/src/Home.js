import React,{useEffect} from 'react';
import useGlobalState from './useGlobalState.js';
import * as config from './config.json';


const Home = ()=> {
  const globalState = useGlobalState();

  useEffect(()=>{
    getAuth();
    // eslint-disable-next-line
  },[]);

  const getAuth = ()=>{
    fetch(config.host+'auth',{
      method:'GET',
      credentials:'include',
      headers:{
        'Content-Type': 'application/json'
      }
    }).then(response=>response.json()).then(response => {
      const new_state = {
        log_state:response.auth
      };
      globalState.setLogState(new_state);
    });
  }

  return (
      <div className="home-container">
        <h1>Welcome</h1>

        <p>OpenID Connect (OIDC) is an identity protocol built on top of the OAuth2 authorization framework. Service Providers can connect to the EGI AAI using OIDC as an alternative to the SAML2 protocol.</p>
      </div>
  )
}

export default Home;
