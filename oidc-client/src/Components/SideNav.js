import React from 'react';
import Nav from 'react-bootstrap/Nav';
import {Link} from "react-router-dom";

export const SideNav = () => {
  return (
    <Nav defaultActiveKey="/home" className="flex-column nav-side">
      <div className="nav-title">PERSONAL</div>
      <Link to="/petitions">Manage Petitions</Link>
      <Link to="/userinfo">View Profile Information</Link>
    </Nav>
  )
}
