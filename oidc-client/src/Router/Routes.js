import React from 'react';
import { Switch, Route,Redirect,Link } from 'react-router-dom';
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
        <Home />
      </Route>
      <PrivateRoute path="/petitions">
        <ClientList user={props.user}/>
      </PrivateRoute>
      <PrivateRoute path="/userinfo">
        <div className="links">
          <Link to="/home">Home</Link>
          <span className="link-seperator">/</span>
           View User Profile
        </div>
        <UserInfo user={props.user} />
      </PrivateRoute>
      <PrivateRoute path="/form/new">
        <div className="links">
          <Link to="/home">Home</Link>
          <span className="link-seperator">/</span>
          <Link to="/petitions">Manage Clients</Link>
          <span className="link-seperator">/</span>
          New Client
        </div>
        <NewClient/>
      </PrivateRoute>
      <PrivateRoute path="/form/edit/:id" >
        <EditClient/>
      </PrivateRoute>
      <PrivateRoute path="/form/review/:id">
        <AdminRoute path="/form/review/:id" user={props.user}>
          <div className="links">
            <Link to="/home">Home</Link>
            <span className="link-seperator">/</span>
            <Link to="/petitions">Manage Clients</Link>
            <span className="link-seperator">/</span>
            Edit Client
          </div>
          <EditClient review={true}/>
        </AdminRoute>
      </PrivateRoute>
    </Switch>
      </div>
);

function AdminRoute(props) {

  console.log(props);
  return (
    <Route
      path={props.path}
      render={({ location }) =>
        props.user.admin ? (
          props.children
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
