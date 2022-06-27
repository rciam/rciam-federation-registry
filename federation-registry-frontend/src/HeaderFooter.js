import React,{useState,useEffect,useContext} from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {faUser,faUserShield, faSignOutAlt} from '@fortawesome/free-solid-svg-icons';
import Col from 'react-bootstrap/Col';
import Row from 'react-bootstrap/Row';
import Image from 'react-bootstrap/Image';
import Navbar from 'react-bootstrap/Navbar';
import Button from 'react-bootstrap/Button';
import config from './config.json';
import DropdownButton from 'react-bootstrap/DropdownButton';
import Dropdown from 'react-bootstrap/Dropdown';
import { useTranslation } from 'react-i18next';
import {useHistory} from "react-router-dom";
import {userContext,tenantContext} from './context.js';

export const Header= (props)=> {
    const tenant = useContext(tenantContext);
    return(

      <div className={"header" + (props.alertBar?' alert_bar_displacement':'')}>
        {/*<div className="corner-ribbon red">Devel</div>*/}
        <div className="text-center ssp-logo">
          <a href="https://www.egi.eu/" >
            <Image src={tenant[0]?tenant[0].logo:null} fluid />
          </a>
        </div>
        <h1 className="text-center">
          {tenant[0]?tenant[0].main_title:null}
        </h1>
      </div>
    );
}



export const NavbarTop = (props)=>{
  const history = useHistory();
  // eslint-disable-next-line
  const [user,setUser] = useContext(userContext);
  // eslint-disable-next-line
  const { t, i18n } = useTranslation();
  const [admin,setAdmin] = useState(false);
  const tenant = useContext(tenantContext);


  useEffect(()=>{
    if(user){
      setAdmin(user.review);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  },[user]);
  return (
    <React.Fragment>
    {tenant[0]?
      <Navbar className={"navbar-fixed-top" + (props.alertBar?' alert_bar_displacement':'')}>
        <Navbar.Collapse className="justify-content-end">
          {user?
          (<DropdownButton
            variant="link"
            alignRight
            className='drop-menu drop-container-header'
            title={<React.Fragment>
              <span style={tenant&&tenant[0]?{color:tenant[0].color}:null}>
              {user?user.name:'login'}
              <span className="user-role">{user?' ('+user.role+')':null}</span>
              <FontAwesomeIcon icon={admin?faUserShield:faUser}/>
              </span>
            </React.Fragment>}
            id="dropdown-menu-align-right"
          >
            {user?(
              <Dropdown.Item>
                {user.sub} <strong>(sub)</strong>
              </Dropdown.Item>
            ):null}
            <Dropdown.Item onClick={()=>{history.push('/'+(tenant&&tenant[0]?(tenant[0].name+'/userinfo'):null));}}>
            {t('nav_link_userinfo')}
            </Dropdown.Item>
            <Dropdown.Item onClick={()=>{
              localStorage.removeItem('token');
              window.location.assign(tenant[0].logout_uri);
            }}>
              {t('logout')}<FontAwesomeIcon icon={faSignOutAlt}/>
            </Dropdown.Item>
          </DropdownButton>):(
          <React.Fragment>
            <a href={config.host+"tenants/"+(tenant[0]?tenant[0].name:null)+"/login"}><Button className="log-button" variant="outline-primary">{t('login')}</Button></a>
          </React.Fragment>
          )
        }
        </Navbar.Collapse>
      </Navbar>:null
    }
    </React.Fragment>

  )
}




export const Footer =(props) =>{
  // eslint-disable-next-line
  const { t, i18n } = useTranslation();
  const tenant = useContext(tenantContext);

  return (
    <footer className="ssp-footer text-center">
      <div className="container ssp-footer--container">
    		<Row className="row ssp-content-group--footer">
    			<Col md="4" className="ssp-footer__item">
          <div className="dropup ssp-footer__item__lang">

          <DropdownButton onSelect={(e)=>{props.changeLanguage(e)}} className="ssp-btn btn ssp-btn__footer dropdown-toggle"  id='dropdown-button-drop-up' key="up" title={<React.Fragment ><span className="caret"></span> {props.lang==='en'?'English':'Greek'}</React.Fragment> } drop="up" variant="link">
            <Dropdown.Item eventKey="en" >English</Dropdown.Item>
            <Dropdown.Item eventKey="gr">Greek</Dropdown.Item>
          </DropdownButton>
          </div>
          </Col>
    			<Col sm="3" className="ssp-footer__item">
            <div className="footer-logo-container">
              <a href="https://grnet.gr/">
                <Image className="ssp-footer__item__logo" src="https://vanilla-ui.aai-dev.grnet.gr/proxy/module.php/themevanilla/resources/images/grnet_logo_en.svg" alt="GRNET"/>
              </a>
              <div className="ssp-footer__item__copyright">
                Copyright ©2016-2022      </div>
            </div>
          </Col>
          <Col sm="4" className="ssp-footer__item">
            <div className="footer_link_container">
              <div className="ssp-footer__item__powered">
              <a href = {"mailto: "+ (tenant[0]&&tenant[0].config?tenant[0].config.contact:null) }>Contact us</a>
              </div>
              <div className="ssp-footer__item__powered">
                <a href={'https://federation.rciam.grnet.gr/docs'}>Documentation</a>
              </div>
            </div>
          </Col>
        </Row>
        <Row>
          <div className='copyright-funding-footer'>
            Copyright ©2016-2022 | Check-in is an EGI service provided by GRNET, receiving funding from the <a href="https://www.egi.eu/about/egi-foundation/" target="_blank" rel="noreferrer"> EGI Foundation (EGI.eu) </a> and the <a href="https://www.egi.eu/project/egi-ace/" target="_blank" rel="noreferrer">EGI-ACE project </a> (Horizon 2020) under Grant number 101017567 | Powered by <a href="https://rciam.github.io/rciam-docs/" target="_blank" rel="noreferrer"> RCIAM</a>

          </div>
        </Row>
      </div>
    </footer>

  )
}
