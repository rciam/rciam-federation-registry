import React,{useContext} from 'react';
import Nav from 'react-bootstrap/Nav';
import {Link} from "react-router-dom";
import { useTranslation } from 'react-i18next';
import {userContext,tenantContext} from '../context.js';

export const SideNav = (props) => {
  // eslint-disable-next-line
  const tenant = useContext(tenantContext);
  const user = useContext(userContext);
    // eslint-disable-next-line
  const { t, i18n } = useTranslation();

  return (
    <Nav defaultActiveKey="/home" className="flex-column nav-side">
      <div className="nav-title">{t('nav_title')}</div>
      <Link to={"/"+props.tenant_name+"/services"}>{t('nav_link_petitions')}</Link>
      <Link to={"/"+props.tenant_name+"/invitations"}>Invitations</Link>
      {user&&user[0]&&user[0].actions.includes('send_notifications')?<Link to={"/"+props.tenant_name+"/notifications"}>Send Notifications</Link>:null}
    </Nav>
  )
}
