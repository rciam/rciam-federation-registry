import React,{useState} from 'react';
import './App.css';
import { withTranslation } from 'react-i18next';
import MainPage from './MainPage.js';
import {userContext,tenantContext} from './context.js';



const App = (props) =>{
  const [lang,setLang]= useState('en');
  const [context,setContext] = useState(null);
  const [tenant,setTenant] = useState(null);
  const onLanguageHandle = (newLang) => {
    setLang(newLang);
    props.i18n.changeLanguage(newLang);
  }
  return (

    <userContext.Provider value={[context, setContext]}>
      <tenantContext.Provider value={[tenant,setTenant]}>
        <MainPage lang={lang} changeLanguage={onLanguageHandle}/>
      </tenantContext.Provider>
    </userContext.Provider>

  );
}

export default withTranslation()(App);
