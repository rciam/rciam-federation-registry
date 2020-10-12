import React from 'react';
import ReactDOM from 'react-dom';
import App from './App';
import { I18nextProvider } from 'react-i18next';
import i18n from './i18n';
import * as serviceWorker from './serviceWorker';
//import './oidc-base.css';
import 'bootstrap/dist/css/bootstrap.min.css';
import './index.css';
import './vanilla.css'
import {GlobalStateProvider} from './useGlobalState.js';



const Root = () => (

  <GlobalStateProvider>
  <I18nextProvider i18n={i18n}>
      <App />
  </I18nextProvider>
  </GlobalStateProvider>

)


ReactDOM.render(<Root />, document.getElementById('root'));

// If you want your app to work offline and load faster, you can change
// unregister() to register() below. Note this comes with some pitfalls.
// Learn more about service workers: https://bit.ly/CRA-PWA
serviceWorker.unregister();
