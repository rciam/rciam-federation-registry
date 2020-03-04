import React from 'react';
import { Switch, Route,Redirect,Link } from 'react-router-dom';
import Home from '../Home';
import ClientList from '../ClientList.js';
import {EditClient,NewClient,ViewClient} from '../FormHandler.js';
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
      <div className="links">
        <Link to="/home">Home</Link>
        <span className="link-seperator">/</span>
        Manage Services
      </div>
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
          <Link to="/petitions">Manage Services</Link>
          <span className="link-seperator">/</span>
          New Service
        </div>
        <NewClient user={props.user}/>
      </PrivateRoute>
      <RouteWithState path="/form/edit">
        <div className="links">
          <Link to="/home">Home</Link>
          <span className="link-seperator">/</span>
          <Link to="/petitions">Manage Services</Link>
          <span className="link-seperator">/</span>
          Edit Service
        </div>
        <EditClient user={props.user}/>
      </RouteWithState>
      <RouteWithState path="/form/review">
        <AdminRoute path="/form/review" user={props.user}>
          <div className="links">
            <Link to="/home">Home</Link>
            <span className="link-seperator">/</span>
            <Link to="/petitions">Manage Services</Link>
            <span className="link-seperator">/</span>
            Review
          </div>
          <EditClient review={true}/>
        </AdminRoute>
      </RouteWithState>
      <RouteWithState path="/form/view">
          <div className="links">
            <Link to="/home">Home</Link>
            <span className="link-seperator">/</span>
            <Link to="/petitions">Manage Services</Link>
            <span className="link-seperator">/</span>
            View Service
          </div>
          <ViewClient/>
      </RouteWithState>
    </Switch>
      </div>
);

function AdminRoute(props) {

  const childrenWithProps = React.Children.map(props.children, child =>
      React.cloneElement(child, { petition_id:props.petition_id,service_id:props.service_id,type:props.type,comment:props.comment})
    );
  return (
    <Route
      path={props.path}
      render={({ location }) =>
        props.user.admin ? (
          childrenWithProps
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


function RouteWithState(props) {
  const globalState = useGlobalState();
  const log_state = globalState.global_state.log_state;
  const childrenWithProps = React.Children.map(props.children, child =>
      React.cloneElement(child, { petition_id:props.location.state.petition_id,service_id:props.location.state.service_id,type:props.location.state.type,comment:props.location.state.comment})
    );
  return (
    <Route
      path={props.path}
      render={({ location }) =>
        log_state ? (
          childrenWithProps
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

function PrivateRoute(props) {

  const globalState = useGlobalState();
  const log_state = globalState.global_state.log_state;

  return (
    <Route
      path={props.path}
      render={({ location }) =>
        log_state ? (
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

export default Routes;
