import React from 'react';
import { Switch, Route,Redirect } from 'react-router-dom';
import Home from '../Home';
import ClientList from '../ClientList.js';
import {EditClient,NewClient} from '../ClientForms.js';
import useGlobalState from '../useGlobalState.js';
import UserInfo from '../Components/UserInfo.js';
const Routes = (props) => (
  <div className="content-container">
    <Switch>
      <Route exact path="/" component={Home}/>
      <Route path="/home">
        <Home/>
      </Route>
      <PrivateRoute path="/petitions">
        <ClientList/>
      </PrivateRoute>
      <PrivateRoute path="/userinfo">
        <UserInfo user={props.user} />
      </PrivateRoute>
      <PrivateRoute path="/form/new">
        <NewClient/>
      </PrivateRoute>
      <PrivateRoute path="/form/edit/:id" >
        <EditClient/>
      </PrivateRoute>
    </Switch>
      </div>
);


function PrivateRoute({ children, ...rest }) {
  const globalState = useGlobalState();
  const log_state = globalState.global_state.log_state;

  return (
    <Route
      {...rest}
      render={({ location }) =>
        log_state ? (
          children
        ) : (
          <Redirect
            to={{
              pathname: "/",
              state: { from: location }
            }}
          />
        )
      }
    />
  );
}

export default Routes;
