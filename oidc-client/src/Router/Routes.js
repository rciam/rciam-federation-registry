import React from 'react';
import { Switch, Route } from 'react-router-dom';
import { withOidcSecure } from '@axa-fr/react-oidc-context';
import Home from '../Home';
import ClientList from '../ClientList.js';
import {EditClient,NewClient} from '../ClientForms.js'


const Routes = () => (
  <div className="content-container">
    <Switch>
      <Route exact path="/" component={Home}/>
      <Route path="/home" component={Home}/>
      <Route path="/petitions" component={withOidcSecure(ClientList)}/>
      <Route path="/form/new" component={withOidcSecure(NewClient)}/>
      <Route path="/form/edit/:id" component={withOidcSecure(EditClient)}/>
    </Switch>
  </div>

);

export default Routes;
