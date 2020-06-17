import React,{useEffect,useContext} from 'react';
import useGlobalState from './useGlobalState.js';
import * as config from './config.json';
import StringsContext from './localContext';

const Home = ()=> {
  const globalState = useGlobalState();
  const strings = useContext(StringsContext);

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
        <h1>{strings.main_greeting}</h1>
        <p>{strings.main_description}</p>
      </div>
  )
}

export default Home;
