import React,{useContext} from 'react';
import {Switch,Route,Redirect,Link} from 'react-router-dom';
import Home from '../Home';
import ServiceList from '../ServiceList.js';
import {EditService,NewService,ViewService} from '../FormHandler.js';
import UserInfo from '../Components/UserInfo.js';
import {HistoryList} from '../Components/History.js';
import {Callback} from '../Components/Callback.js';
import {InvitationRoute,InvitationNotFound} from '../Components/InvitationRoute.js';
import GroupsPage from '../Groups.js';
import InvitationsPage from '../Invitations.js'
import {tenantContext,userContext} from '../context.js';
import {PageNotFound,TenantHandler} from '../Components/TenantHandler.js';
const Routes = (props) => {
  const tenant = useContext(tenantContext);

  return(
  <div className="content-container">
    <Switch>
      <Route exact path='/404' component={PageNotFound} />
      <Route exact path="/:tenant_name/code/:code">
        <Callback/>
      </Route>
      <TenantRoute path="/:tenant_name/home">
        <Home/>
      </TenantRoute>
      <Route path="/:tenant_name/invitation/:code">
        <InvitationRoute/>
      </Route>
      <ProtectedRoute user={props.user} path="/:tenant_name/invitation_error">
        <InvitationNotFound/>
      </ProtectedRoute>
      <ProtectedRoute user={props.user} path="/:tenant_name/petitions">
        <div className="links">
          <Link to={"/"+ (tenant&&tenant[0]?tenant[0].name:null) +"/home"}>{props.t('link_home')}</Link>
          <span className="link-seperator">/</span>
          {props.t('link_petitions')}
        </div>
        <ServiceList user={props.user}/>
      </ProtectedRoute>
      <ProtectedRoute user={props.user} path="/:tenant_name/userinfo">
        <div className="links">
          <Link to={"/"+ (tenant&&tenant[0]?tenant[0].name:null) +"/home"}>{props.t('link_home')}</Link>
          <span className="link-seperator">/</span>
           View User Profile
        </div>
        <UserInfo user={props.user} />
      </ProtectedRoute>
      <ProtectedRoute user={props.user} path="/:tenant_name/form/new">
        <div className="links">
          <Link to={"/"+ (tenant&&tenant[0]?tenant[0].name:null) +"/home"}>{props.t('link_home')}</Link>
          <span className="link-seperator">/</span>
          <Link to={"/"+ (tenant&&tenant[0]?tenant[0].name:null) +"/petitions"}>{props.t('link_petitions')}</Link>
          <span className="link-seperator">/</span>
          New Service
        </div>
        <NewService user={props.user}/>
      </ProtectedRoute>
      <ProtectedRoute user={props.user} path="/:tenant_name/invitations">
        <div className="links">
          <Link to={"/"+ (tenant&&tenant[0]?tenant[0].name:null) +"/home"}>{props.t('link_home')}</Link>
          <span className="link-seperator">/</span>
          <Link to={"/"+ (tenant&&tenant[0]?tenant[0].name:null) +"/petitions"}>{props.t('link_petitions')}</Link>
          <span className="link-seperator">/</span>
          Invitations
        </div>
        <InvitationsPage/>
      </ProtectedRoute>
      <ProtectedRoute user={props.user} path="/:tenant_name/form/edit">
        <div className="links">
          <Link to={"/"+ (tenant&&tenant[0]?tenant[0].name:null) +"/home"}>{props.t('link_home')}</Link>
          <span className="link-seperator">/</span>
          <Link to={"/"+ (tenant&&tenant[0]?tenant[0].name:null) +"/petitions"}>{props.t('link_petitions')}</Link>
          <span className="link-seperator">/</span>
          Edit Service
        </div>
        <EditService user={props.user}/>
      </ProtectedRoute>
      <ProtectedRoute user={props.user} path="/:tenant_name/group">
        <div className="links">
          <Link to={"/"+ (tenant&&tenant[0]?tenant[0].name:null) +"/home"}>{props.t('link_home')}</Link>
          <span className="link-seperator">/</span>
          <Link to={"/"+ (tenant&&tenant[0]?tenant[0].name:null) +"/petitions"}>{props.t('link_petitions')}</Link>
          <span className="link-seperator">/</span>
          {props.t('group')}
        </div>
        <GroupsPage/>
      </ProtectedRoute>
      <ProtectedRoute user={props.user} path='/:tenant_name/history/list'>
        <HistoryList user={props.user}/>
      </ProtectedRoute>
      <ProtectedRoute user={props.user} path="/:tenant_name/form/review" admin={true}>
          <div className="links">
            <Link to={"/"+ (tenant&&tenant[0]?tenant[0].name:null) +"/home"}>{props.t('link_home')}</Link>
            <span className="link-seperator">/</span>
            <Link to={"/"+ (tenant&&tenant[0]?tenant[0].name:null) +"/petitions"}>{props.t('link_petitions')}</Link>
            <span className="link-seperator">/</span>
            Review
          </div>
          <EditService review={true}/>
      </ProtectedRoute>
      <ProtectedRoute user={props.user} path="/:tenant_name/form/view">
          <div className="links">
            <Link to={"/"+ (tenant&&tenant[0]?tenant[0].name:null) +"/home"}>{props.t('link_home')}</Link>
            <span className="link-seperator">/</span>
            <Link to={"/"+ (tenant&&tenant[0]?tenant[0].name:null) +"/petitions"}>{props.t('link_petitions')}</Link>
            <span className="link-seperator">/</span>
            View Service
          </div>
          <ViewService/>
      </ProtectedRoute>
      <Redirect from="/:tenant_name" to="/:tenant_name/home"/>
      <Redirect from='*' to='/404' />
    </Switch>
  </div>
);
};



const TenantRoute = (props) => {
  const tenant = useContext(tenantContext);
  const childrenWithProps = React.Children.map(props.children, child =>
      React.cloneElement(child, {...props.location.state})
    );

  return (
    <Route
      path={props.path}
      render={({ location }) =>
        (tenant && tenant[0] && (props.computedMatch.params.tenant_name === tenant[0].name)) ? (
          childrenWithProps
        ) : (
          <TenantHandler/>
        )
      }
    />
  );
}


const ProtectedRoute= (props)=> {
  const user = useContext(userContext);
  const tenant = useContext(tenantContext);

  const childrenWithProps = React.Children.map(props.children, child =>
      React.cloneElement(child, {...props.location.state})
    );
  return (
    <Route
      path={props.path}
      render={({ location }) =>
        !(tenant && tenant[0] && (props.computedMatch.params.tenant_name === tenant[0].name)) ?
        <TenantHandler/>:
        localStorage.getItem('token')&& user && user[0] && !(props.admin && !user[0].admin) ? (
          childrenWithProps
        ) : (
          <Redirect
            to={{
              pathname: "/"+tenant[0].name+"/home",
              state: { from: location }
            }}
          />
        )
      }
    />
  );
}



export default Routes;
