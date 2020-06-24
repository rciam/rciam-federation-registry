import React from 'react';
import './App.css';
import { withTranslation } from 'react-i18next';
import MainPage from './MainPage.js';




class  App extends React.Component {

  constructor(props) {
     super(props);
     this.state = {
         lang: "en"
     }
  }

  onLanguageHandle = (newLang) => {
    this.setState({lang: newLang})
    this.props.i18n.changeLanguage(newLang)
  }


    render(){
      return (
        <MainPage lang={this.state.lang} changeLanguage={this.onLanguageHandle}/>
      );
    }
}

export default withTranslation()(App);
