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

    if (localStorage.getItem('token')){

    fetch(config.host+'auth',{
      method:'GET',
      credentials:'include',
      headers:{
        'Content-Type': 'application/json',
        'Authorization': localStorage.getItem('token')
      }
    }).then(response => {
      let new_state;
      if(response.status===200){
        new_state = {
          tenant:'EGI',
          log_state:true
        };
      }
      else {
        new_state = {
          tenant:'EGI',
          log_state:false
        };
      }
      globalState.setLogState(new_state);
    });
    }
    else{
        globalState.setLogState({tenant:'EGI',log_state:false});

    }
  }

  return (
      <div className="home-container">
        <h1>{t('main_greeting')}</h1>
        <p>{t('main_description')}</p>
      </div>
  )
}

export default Home;
