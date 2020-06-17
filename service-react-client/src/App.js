import React from 'react';
import './App.css';
import MainPage from './MainPage.js';
import LocalizedStrings from 'react-localization';
import * as localise from './localise.json';
import {StringsProvider} from './localContext';

export default function App() {

  let strings = new LocalizedStrings(localise.default);
  strings.setLanguage("standard");


  return (

        <StringsProvider value={strings}>
        <div className="App">
          <MainPage/>
        </div>
      </StringsProvider>
  );
}
