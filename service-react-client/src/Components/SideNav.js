import React from 'react';
import Nav from 'react-bootstrap/Nav';
import {Link} from "react-router-dom";
import { useTranslation } from 'react-i18next';

export const SideNav = () => {
  // eslint-disable-next-line
  const { t, i18n } = useTranslation();

  return (
    <Nav defaultActiveKey="/home" className="flex-column nav-side">
      <div className="nav-title">{t('nav_title')}</div>
      <Link to="/petitions">{t('nav_link_petitions')}</Link>
      <Link to="/userinfo">{t('nav_link_userinfo')}</Link>
    </Nav>
  )
}
