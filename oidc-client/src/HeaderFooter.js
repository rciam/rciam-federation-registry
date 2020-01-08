import React from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {faUser } from '@fortawesome/free-solid-svg-icons';
import Col from 'react-bootstrap/Col';
import Row from 'react-bootstrap/Row';
import Image from 'react-bootstrap/Image';
import NavDropdown from 'react-bootstrap/NavDropdown';
import Navbar from 'react-bootstrap/Navbar';
import Button from 'react-bootstrap/Button';
import useGlobalState from './useGlobalState.js';


export const Header= ()=> {

  const globalState = useGlobalState();
  const logged = globalState.global_state.log_state;


    return(
      <React.Fragment>
        <Navbar>
          <Navbar.Collapse className="justify-content-end">
            {logged?
            (<NavDropdown drop='left' title={
                <React.Fragment>
                  Login
                  <FontAwesomeIcon icon={faUser}/>
                </React.Fragment>
                }
                id="collasible-nav-dropdown">
              <NavDropdown.Item href="http://localhost:5000/logout">

                <Button className="log-button"  variant="outline-primary">Logout</Button></NavDropdown.Item>
            </NavDropdown>):(
            <React.Fragment>
              <a href="http://localhost:5000/login"><Button className="log-button" variant="outline-primary">Login</Button></a>

            </React.Fragment>
            )
          }
          </Navbar.Collapse>
        </Navbar>
        <div className="logo">
          <a href="https://www.egi.eu/" >
            <Image src={process.env.PUBLIC_URL + '/logo.png'} fluid />
          </a>
        </div>
        <h1 className="text-center main-title">
          EGI AAI OpenID Connect Provider
        </h1>
      </React.Fragment>
    );
}

export class Footer extends React.Component {
  render(){
    return(
      <React.Fragment>
        <div className='footer'>
          <Row>
            <Col md={4}>
            </Col>
            <Col md={4}>
              <Image className="logo-grnet" src='https://aai-dev.egi.eu/oidc/resources/images/grnet_logo_en.svg' fluid />
              <Image className="logo-eu" src='https://aai-dev.egi.eu/oidc/resources/images/eu.svg' fluid />
            </Col>
            <Col className="footer-links" md={4}>
              <a href="https://aai.egi.eu/ToU.html">Terms</a>
              <a href="https://aai.egi.eu/privacy.html">Privacy</a>
            </Col>
          </Row>
          <Row className='footer-description'>
            <Col>
            <p>Check-in is an EGI service provided by GRNET, receiving funding from the <a href='https://www.egi.eu/about/egi-foundation/'>EGI Foundation (EGI.eu)</a> and the <a href="https://eosc-hub.eu/">EOSC-hub project (Horizon 2020)</a> under Grant number 777536</p>
            </Col>
          </Row>
        </div>
      </React.Fragment>
    );
  }
}
