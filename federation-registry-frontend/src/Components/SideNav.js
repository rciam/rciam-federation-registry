import React,{useContext} from 'react';
import Nav from 'react-bootstrap/Nav';
import {Link} from "react-router-dom";
import { useTranslation } from 'react-i18next';
import {userContext} from '../context.js';

export const SideNav = (props) => {
  // eslint-disable-next-line
  const [user] = useContext(userContext);
    // eslint-disable-next-line
  const { t, i18n } = useTranslation();

  return (
    <Nav defaultActiveKey="/home" className="flex-column">
      <div className="nav-side">
        <div className="nav-side-category">
          <div className="nav-title">MAIN</div>
          <Link to={"/"+props.tenant_name+"/services"}>{t('nav_link_petitions')}</Link>
        </div>
        <div className="nav-side-category">
          <div className="nav-title">PERSONAL</div>
          <Link to={"/"+props.tenant_name+"/invitations"}>Invitations</Link>
          <Link to={"/"+props.tenant_name+"/userinfo"}>User Information</Link>
        </div>
        {user?.actions.includes('send_notifications')?
          <div className="nav-side-category">
            <div className="nav-title">NOTIFICATIONS</div>
            <Link to={"/"+props.tenant_name+"/notifications/broadcast"}>Broadcast Message</Link>
            <Link to={"/"+props.tenant_name+"/notifications/outdated"}>Oudated Alert</Link>
          </div>
        :null}
        <div className='nav-side-category'> 
          <div className='nav-title'>FEDERATION</div>
          <Link to={"/"+props.tenant_name+"/service_overview"}>All Services</Link>
        </div>
    </div>
    </Nav>
  )
}
