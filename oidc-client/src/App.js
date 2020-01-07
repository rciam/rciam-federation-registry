import React from 'react';
import { useAlert } from 'react-alert';
import './App.css';
import {MainPage} from './MainPage.js';
import oidcConfiguration from './configuration';
import { AuthenticationProvider, oidcLog } from '@axa-fr/react-oidc-context';
import Home from './Home.js';

function App() {
  const alert = useAlert()
  return (
    <AuthenticationProvider
      configuration={oidcConfiguration}
      loggerLevel={oidcLog.ERRORS}
      isEnabled={true}
      notAuthenticated={Home}
      authenticating={Home}

    >
      <div className="App">
        <MainPage alert={alert}/>

      </div>
    </AuthenticationProvider>
  );
}

export default App;
