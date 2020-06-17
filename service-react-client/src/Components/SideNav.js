import React,{useContext} from 'react';
import Nav from 'react-bootstrap/Nav';
import {Link} from "react-router-dom";
import StringsContext from '../localContext'

export const SideNav = () => {
  const strings = useContext(StringsContext);

  return (
    <Nav defaultActiveKey="/home" className="flex-column nav-side">
      <div className="nav-title">{strings.nav_title}</div>
      <Link to="/petitions">{strings.nav_link_petitions}</Link>
      <Link to="/userinfo">{strings.nav_link_userinfo}</Link>
    </Nav>
  )
}
