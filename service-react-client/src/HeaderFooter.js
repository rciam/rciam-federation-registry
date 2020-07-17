import React,{useState,useEffect} from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {faUser,faUserShield, faSignOutAlt} from '@fortawesome/free-solid-svg-icons';
import Col from 'react-bootstrap/Col';
import Row from 'react-bootstrap/Row';
import Image from 'react-bootstrap/Image';
import Navbar from 'react-bootstrap/Navbar';
import Button from 'react-bootstrap/Button';
import useGlobalState from './useGlobalState.js';
import * as config from './config.json';
import DropdownButton from 'react-bootstrap/DropdownButton';
import Dropdown from 'react-bootstrap/Dropdown';
import * as tenant_data from './tenant-config.json'
import { useTranslation } from 'react-i18next';

export const Header= (props)=> {
    const globalState = useGlobalState();
    const tenant = tenant_data.data[globalState.global_state.tenant];
    return(

      <div className="header">
        <div className="corner-ribbon red">Devel</div>

        <div className="text-center ssp-logo">
          <a href="https://www.egi.eu/" >
            <Image src={tenant?tenant.logo:null} fluid />
          </a>
        </div>
        <h1 className="text-center">
          {tenant?tenant.main_title:null}
        </h1>
      </div>
    );
}

export const NavbarTop = (props)=>{
  // eslint-disable-next-line
  const { t, i18n } = useTranslation();
  const globalState = useGlobalState();
  const logged = globalState.global_state.log_state;
  const tenant = tenant_data.data[globalState.global_state.tenant];
  const [admin,setAdmin] = useState(false);
  useEffect(()=>{
    let admin = false;

    if(props.user&&props.user.eduperson_entitlement){
      ["urn:mace:egi.eu:group:service-integration.aai.egi.eu:role=member#aai.egi.eu"].forEach((item)=>{
        if(props.user.eduperson_entitlement.includes(item)){
          admin = true;
        }
      })
    }
    setAdmin(admin);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  },[props.user]);
  return (
    <Navbar className="navbar-fixed-top">
      <Navbar.Collapse className="justify-content-end">
        {logged?
        (<DropdownButton
          variant="link"
          alignRight
          className='drop-menu drop-container-header'
          title={<React.Fragment>
            <span style={{color:tenant.color}}>
            {props.user?props.user.name:'login'}
            <FontAwesomeIcon icon={admin?faUserShield:faUser}/>
            </span>
          </React.Fragment>}
          id="dropdown-menu-align-right"
        >
          {props.user?(
            <Dropdown.Item>
              {props.user.sub}
            </Dropdown.Item>
          ):null}
          <Dropdown.Item href={config.host+"logout" } >
            {t('logout')}<FontAwesomeIcon icon={faSignOutAlt}/>
          </Dropdown.Item>
        </DropdownButton>):(
        <React.Fragment>
          <a href={config.host+"login/egi"}><Button className="log-button" variant="outline-primary">{t('login')}</Button></a>
        </React.Fragment>
        )
      }
      </Navbar.Collapse>
    </Navbar>
  )
}


// no extra css
export const FooterOld = ()=>{
  // eslint-disable-next-line
  const { t, i18n } = useTranslation();
  return(
    <React.Fragment>
      <div className="text-center footer">
        <Row>
          <Col md={4}>
          </Col>
          <Col md={4}>
            <Image className="logo-grnet" src={t('footer_logo_uri')} fluid />
            <Image className="logo-eu" src={t('footer_flag_uri')} fluid />
          </Col>
          <Col className="footer-links" md={4}>
            <a href={t('terms_uri')}>Terms</a>
            <a href={t('privacy_uri')}>Privacy</a>
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



export const Footer =(props) =>{
  // eslint-disable-next-line
  const { t, i18n } = useTranslation();

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
            <a href="https://grnet.gr/">
              <Image className="ssp-footer__item__logo" src="https://vanilla-ui.aai-dev.grnet.gr/proxy/module.php/themevanilla/resources/images/grnet_logo_en.svg" alt="GRNET"/>
            </a>
            <div className="ssp-footer__item__copyright">
              Copyright ©2016-2020      </div>
          </Col>
          <Col sm="4" className="ssp-footer__item">
            <div className="ssp-footer__item__powered">
              Powered by <a href="https://github.com/rciam">RCIAM</a>
            </div>
          </Col>
        </Row>
      </div>
    </footer>

  )
}


// oidc-base.css
export const Footer1 =() =>{
  // eslint-disable-next-line
  const { t, i18n } = useTranslation();
  return (
    <div className="text-center" id="footer">
      <div className="container">
    		<Row className="row align-items-center">
    			<Col md="4" className="ssp-footer__item"></Col>
    			<Col md="4" className="ssp-footer__item text-center col-images">
            <a href="https://grnet.gr/">
              <Image className="ssp-footer__item__logo" src={t('footer_logo_uri')} alt="GRNET" fluid/>
            </a>
            <Image className="ssp-footer__item__logo--eu" src={t('footer_flag_uri')} alt="European Union" text=""/>
    			</Col>
    			<Col md="4" className="ssp-footer__item ssp-footer__item--links text-right">
    		    <a href="https://aai.egi.eu/ToU.html">Terms</a>
    		    <a href="https://aai.egi.eu/privacy.html">Privacy</a>
    			</Col>
    		</Row>
        <Row>
          <Col className="text-center">
            <p> Check-in is an EGI service provided by GRNET, receiving funding from the <a href="https://www.egi.eu/about/egi-foundation/">EGI Foundation (EGI.eu)</a> and the <a href="https://eosc-hub.eu">EOSC-hub project</a> (Horizon 2020) under Grant number 777536</p>
          </Col>
        </Row>
      </div>
    </div>

  )
}
