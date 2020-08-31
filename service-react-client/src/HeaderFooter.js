import React,{useState,useEffect,useContext} from 'react';
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
import {useHistory} from "react-router-dom";
import {Context} from './user-context.js';

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
  const history = useHistory();
  const user = useContext(Context);
  // eslint-disable-next-line
  const { t, i18n } = useTranslation();
  const globalState = useGlobalState();
  const logged = globalState.global_state.log_state;
  const tenant = tenant_data.data[globalState.global_state.tenant];
  const [admin,setAdmin] = useState(false);
  useEffect(()=>{

    if(user[0]){
      setAdmin(user[0].admin);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  },[user[0]]);
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
            {user[0]?user[0].name:'login'}
            <span className="user-role">{user[0]?' ('+user[0].role+')':null}</span>
            <FontAwesomeIcon icon={admin?faUserShield:faUser}/>
            </span>
          </React.Fragment>}
          id="dropdown-menu-align-right"
        >
          {user[0]?(
            <Dropdown.Item>
              {user[0].sub}
            </Dropdown.Item>
          ):null}
          <Dropdown.Item onClick={()=>{localStorage.removeItem('token'); globalState.setLogState({tenant:'EGI',log_state:false}); history.push('/'); }} >
            {t('logout')}<FontAwesomeIcon icon={faSignOutAlt}/>
          </Dropdown.Item>
        </DropdownButton>):(
        <React.Fragment>
          <a href={config.host+"login"}><Button className="log-button" variant="outline-primary">{t('login')}</Button></a>
        </React.Fragment>
        )
      }
      </Navbar.Collapse>
    </Navbar>
  )
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
