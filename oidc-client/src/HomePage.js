import React from 'react';
import Navbar from 'react-bootstrap/Navbar';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import * as config from './config.json';
import {
  BrowserRouter as Router,
  Switch,
  Route,
  Link,useParams
} from "react-router-dom";
import Image from 'react-bootstrap/Image';
import { faUser,faSync,faPlus,faTimes,faEdit, faTrash } from '@fortawesome/free-solid-svg-icons';
import Button from 'react-bootstrap/Button'
import Nav from 'react-bootstrap/Nav';
import NavDropdown from 'react-bootstrap/NavDropdown';
import InputGroup from 'react-bootstrap/InputGroup';
import FormControl from 'react-bootstrap/FormControl';
import Col from 'react-bootstrap/Col';
import Row from 'react-bootstrap/Row';
import Table from 'react-bootstrap/Table';
import FormTabs from './FormTabs.js'
export default class HomePage extends React.Component {
  constructor(props) {
  super(props);
  this.state = {connections:''};
  this.getCall();

  }

  getCall(){
    fetch(config.host+'client/1').then(response=>response.json()).then(response=> {
      if(response.success){
        this.setState({connections:response.connections});
      }
    });
  }
  render(){
    let petitions;
    if(this.state.connections){
    petitions = this.state.connections.map(function(item,index){
      return (
        <tr key={index}>
          <td className="petition-details">
            <div className="table-image-container">
              <Image src={item.logo_uri} thumbnail/>
            </div>
          </td>
          <td>
            <div className="flex-column">
              <h3>{item.client_name}</h3>
              <p>{item.client_description}</p>
            </div>
          </td>
          <td>
            <div className="petition-actions">
            <Link to={"/form/"+index}><Button variant="light"><FontAwesomeIcon icon={faEdit}/>Edit</Button></Link>
            <Button variant="danger"><FontAwesomeIcon icon={faTrash} onClick={()=>console.log(this.state)}/>Delete</Button>
            </div>
          </td>
        </tr>
      )
    });
  }
    return(
      <React.Fragment>
      <div className="main-container">
        <Navbar>
          <Navbar.Collapse className="justify-content-end">
            <NavDropdown drop='left' title={<FontAwesomeIcon icon={faUser} />} id="collasible-nav-dropdown">
              <NavDropdown.Item>Logout</NavDropdown.Item>
            </NavDropdown>
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
        <Router>
          <div className="flex-container">
            <Nav defaultActiveKey="/home" className="flex-column nav-side">
              <div className="nav-title">PERSONAL</div>
              <Link to="/petitions">Manage Petitions</Link>
            </Nav>
            <Switch>
              <React.Fragment>
              <div className="content-container">
                <Route path="/home">
                  <div className="home-container">
                    <h1>Welcome</h1>
                    <p>OpenID Connect (OIDC) is an identity protocol built on top of the OAuth2 authorization framework. Service Providers can connect to the EGI AAI using OIDC as an alternative to the SAML2 protocol.</p>
                  </div>
                </Route>
                <Route path="/petitions">
                  <div className="links">
                    <Link to="/home">Home</Link>
                    <span className="link-seperator">/</span>
                    Manage Clients
                  </div>
                  <div >
                    <Row className="options-bar">
                      <Col>
                        <Button variant="light"><FontAwesomeIcon icon={faSync} onClick={this.getCall} />Refresh</Button>
                        <Link to="/form"><Button><FontAwesomeIcon icon={faPlus}/>New Client</Button></Link>
                      </Col>
                      <Col className="options-search" md={3}>
                        <InputGroup className="md-12">
                          <FormControl
                            placeholder="Search"
                          />
                          <InputGroup.Append>
                            <InputGroup.Text><FontAwesomeIcon icon={faTimes}/></InputGroup.Text>
                          </InputGroup.Append>
                        </InputGroup>
                      </Col>
                    </Row>
                    <Table striped bordered hover className="petitions-table">
                      <thead>
                        <tr>
                          <td>Service</td>
                          <td></td>
                          <td><FontAwesomeIcon icon={faEdit}/></td>
                        </tr>
                      </thead>
                      <tbody>
                        {petitions}
                      </tbody>
                    </Table>

                  </div>
                </Route>
                <Route exact path="/form">
                  <div className="links">
                    <Link to="/home">Home</Link>
                    <span className="link-seperator">/</span>
                    <Link to="/petitions">Manage Clients</Link>
                    <span className="link-seperator">/</span>
                    Edit Petition
                  </div>
                  <FormTabs/>
                </Route>
                <Route path="/form/:id" children={<Child connections={this.state.connections}/>}/>

              </div>
              </React.Fragment>

            </Switch>
          </div>
        </Router>
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
      </div>
      </React.Fragment>
    );
  }
}

function Child(props) {
  // We can use the `useParams` hook here to access
  // the dynamic pieces of the URL.
  let { id } = useParams();

  return <FormTabs editConnection={props.connections[id]}/>
}
