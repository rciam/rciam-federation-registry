import React,{useEffect} from 'react';
import useGlobalState from './useGlobalState.js';
import * as config from './config.json';
import { useTranslation } from 'react-i18next';

const Home = ()=> {
  // eslint-disable-next-line
  const { t, i18n } = useTranslation();
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
        tenant:'vanilla',
        log_state:response.auth,

      };
      globalState.setLogState(new_state);
    });
  }

  return (
      <div className="home-container">
        <h1>{t('main_greeting')}</h1>
        <p>{t('main_description')}</p>
      </div>
  )
}

export default Home;
