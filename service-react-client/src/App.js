import React,{useState} from 'react';
import './App.css';
import { withTranslation } from 'react-i18next';
import MainPage from './MainPage.js';
import {Context} from './user-context.js';



const App = (props) =>{
  const [lang,setLang]= useState('en');
  const [context,setContext] = useState(null);

  const onLanguageHandle = (newLang) => {
    setLang(newLang);
    props.i18n.changeLanguage(newLang);
  }
  return (
    <Context.Provider value={[context, setContext]}>

      <MainPage lang={lang} changeLanguage={onLanguageHandle}/>
    </Context.Provider>

  );
}

export default withTranslation()(App);
