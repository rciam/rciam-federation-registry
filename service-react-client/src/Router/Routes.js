import React from 'react';
import { Switch, Route,Redirect,Link } from 'react-router-dom';
import Home from '../Home';
import ServiceList from '../ServiceList.js';
import {EditService,NewService,ViewService} from '../FormHandler.js';
import useGlobalState from '../useGlobalState.js';
import UserInfo from '../Components/UserInfo.js';
import {HistoryList} from '../Components/History.js'



const Routes = (props) => (

  <div className="content-container">
    <Switch>
      <Route exact path="/" component={Home}/>
      <Route path="/home">
        <Home />
      </Route>
      <PrivateRoute user={props.user} path="/petitions">
        <div className="links">
          <Link to="/home">{props.t('link_home')}</Link>
          <span className="link-seperator">/</span>
          Manage Services
        </div>
        <ServiceList user={props.user}/>
      </PrivateRoute>
      <PrivateRoute user={props.user} path="/userinfo">
        <div className="links">
          <Link to="/home">{props.t('link_home')}</Link>
          <span className="link-seperator">/</span>
           View User Profile
        </div>
        <UserInfo user={props.user} />
      </PrivateRoute>
      <PrivateRoute user={props.user} path="/form/new">
        <div className="links">
          <Link to="/home">{props.t('link_home')}</Link>
          <span className="link-seperator">/</span>
          <Link to="/petitions">{props.t('link_petitions')}</Link>
          <span className="link-seperator">/</span>
          New Service
        </div>
        <NewService user={props.user}/>
      </PrivateRoute>
      <RouteWithState user={props.user} path="/form/edit">
        <div className="links">
          <Link to="/home">{props.t('link_home')}</Link>
          <span className="link-seperator">/</span>
          <Link to="/petitions">{props.t('link_petitions')}</Link>
          <span className="link-seperator">/</span>
          Edit Service
        </div>
        <EditService user={props.user}/>
      </RouteWithState>
      <RouteWithState user={props.user} path='/history/list'>

        <HistoryList user={props.user}/>
      </RouteWithState>


      <RouteWithState user={props.user} path="/form/review">
        <AdminRoute path="/form/review" user={props.user}>
          <div className="links">
            <Link to="/home">{props.t('link_home')}</Link>
            <span className="link-seperator">/</span>
            <Link to="/petitions">{props.t('link_petitions')}</Link>
            <span className="link-seperator">/</span>
            Review
          </div>
          <EditService review={true}/>
        </AdminRoute>
      </RouteWithState>
      <RouteWithState user={props.user} path="/form/view">
          <div className="links">
            <Link to="/home">{props.t('link_home')}</Link>
            <span className="link-seperator">/</span>
            <Link to="/petitions">{props.t('link_petitions')}</Link>
            <span className="link-seperator">/</span>
            View Service
          </div>
          <ViewService/>
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
        log_state&&props.user ? (
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
        log_state&&props.user ? (
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
