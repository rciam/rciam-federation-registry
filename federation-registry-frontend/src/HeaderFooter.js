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
import { useCookies } from 'react-cookie';
import parse from 'html-react-parser';
import {faTimes} from '@fortawesome/free-solid-svg-icons';


export const Header= (props)=> {
  const [tenant] = useContext(tenantContext);
  const [bannerAlertInfo,setBannerAlertInfo] = useState([]);

  useEffect(()=>{
    setBannerAlertInfo(props.bannerAlertInfo);
  },[props.bannerAlertInfo])

  return(
    <div className="header">
      {bannerAlertInfo[0]&&
              <div id="noty-info-bar" className={"noty-top-"+bannerAlertInfo[0].type+" noty-top-global"}>
                <div>
                  {parse(bannerAlertInfo[0].alert_message)}
                </div>
                <button className="noty-top-close link-button" onClick={()=>{setBannerAlertInfo([...bannerAlertInfo.slice(1)])}}>
                  <FontAwesomeIcon icon={faTimes}/>
                </button>
              </div>
      }
      <NavbarTop alertBar={bannerAlertInfo.length>0}/>

      <div className={"tenant_logo_container"}>
        <div className="text-center ssp-logo">
          <a href={tenant?.config.website_url}>
            <Image src={tenant?.config.logo_url} fluid />
          </a>
        </div>
        <h1 className="text-center">
          {tenant?.config.home_page_title}
        </h1>
      </div>
    </div>
  );
}

export const NavbarTop = (props)=>{
  const history = useHistory();
  // eslint-disable-next-line
  const [user,setUser] = useContext(userContext);
  // eslint-disable-next-line
  const { t, i18n } = useTranslation();
  const [tenant] = useContext(tenantContext);
  const [cookies] = useCookies(['federation_logoutkey']);

  return (
    <React.Fragment>
    
    {tenant&&
      <React.Fragment>
        {tenant.config.ribon.active&&<div class="corner-ribbon red">{tenant.config.ribon.text}</div>}
        <Navbar className={"navbar-fixed-top"}>
          <Navbar.Collapse className="justify-content-end">
            {user?
              <DropdownButton
                variant="link"
                alignRight
                className='drop-menu drop-container-header'
                title={<React.Fragment>
                  <span style={tenant&&{color:tenant?.config?.theme_color}}>
                  {user?user[tenant.config.claims.display_name_claim]:'login'}
                  <span>{user&&' ('+user.role+')'}</span>
                  <FontAwesomeIcon icon={user.actions.includes('review_petition')?faUserShield:faUser}/>
                  </span>
                </React.Fragment>}
                id="dropdown-menu-align-right"
              >
                {user&&
                  <Dropdown.Item>
                    {user[tenant.config.claims.sub_claim]} <strong>(sub)</strong>
                  </Dropdown.Item>
                }
                <Dropdown.Item onClick={()=>{history.push('/'+tenant?.name+'/userinfo');}}>
                {t('nav_link_userinfo')}
                </Dropdown.Item>
                <Dropdown.Item onClick={()=>{
                  window.location.assign(tenant?.logout_uri + "&id_token_hint="+cookies.federation_logoutkey);
                }}>
                  {t('logout')}<FontAwesomeIcon icon={faSignOutAlt}/>
                </Dropdown.Item>
              </DropdownButton>
            :(
            <React.Fragment>
              <a href={config.host[tenant?.name]+"tenants/"+tenant?.name+"/login"}><Button className="log-button" variant="outline-primary">{t('login')}</Button></a>
            </React.Fragment>
            )
          }
          </Navbar.Collapse>
        </Navbar>
      </React.Fragment>
    }
    </React.Fragment>
  )
}




export const Footer =(props) =>{
  const [tenant] = useContext(tenantContext);

  return (
    <footer>
      <div className="container ssp-footer--container">
    		<Row className="row justify-content-center">
    			<Col sm="3" className="ssp-footer__item">
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
                <Image className="ssp-footer__item__logo" src={process.env.PUBLIC_URL + '/grnet.png'} alt="GRNET"/>
              </a>
              <div className="ssp-footer__item__copyright">
              {tenant&&(tenant?.config?.copyright)}     </div>
            </div>
          </Col>
          <Col sm="3" className="ssp-footer__item">
            <div className="footer_link_container">
              <div className="ssp-footer__item__powered">
              <a href = {"mailto: "+ tenant?.config?.contact}>Support</a>
              </div>
              <div className="ssp-footer__item__powered">
                <a href={tenant&&(tenant?.config?.documentation)}>Documentation</a>
              </div>
            </div>
          </Col>
        </Row>
        <Row>
          <div className='copyright-funding-footer'>
            {tenant&&parse(tenant?.config?.footer_description)} | Powered by <a href="https://rciam.github.io/rciam-docs/" target="_blank" rel="noreferrer"> RCIAM</a>
          </div>
        </Row>
      </div>
    </footer>

  )
}
