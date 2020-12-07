import React,{useContext} from 'react';
import Modal from 'react-bootstrap/Modal';
import {useHistory,useParams} from "react-router-dom";
import Button from 'react-bootstrap/Button';
import { useTranslation } from 'react-i18next';
import { Translation } from 'react-i18next';
import {tenantContext} from '../context.js';

export const Logout = (props) => {
  const history = useHistory();
  const tenant = useContext(tenantContext);
  const handleClose = () => {
    localStorage.removeItem('token'); history.push('/'+(tenant&&tenant[0]?tenant[0].name:null));
  }
  return (
    <Translation>
      {t=> {
        return(
          <Modal show={props.logout} onHide={handleClose}>
            <Modal.Header >
              <Modal.Title>You have been logged out</Modal.Title>
            </Modal.Header>
            <Modal.Footer>
              <Button variant="secondary" onClick={handleClose}>
                Continue
              </Button>
            </Modal.Footer>
          </Modal>
        )
      }}
    </Translation>
  )


}

export class SimpleModal extends React.Component {

  constructor(props){
    super(props);
    this.state = {active:false,
      strings:null
    }
  }

  componentDidUpdate(prevProps) {
   // if form was submitting, but now is not submitting because it is invalid
    if (prevProps.isSubmitting && !this.props.isSubmitting && !this.props.isValid) {
      // and assume you've added refs to each input: `ref={ i => this[name] = i}` , then...
      this.setState({active:true});
      // or do other imperative stuff that DOES NOT SET STATE
      // smoothScroll(Object.keys(this.props.errors)[0].<offsetY | or whatever>)
    }
  }

  render(){
    const active=this.state.active;
    const handleClose = () => {
      this.setState({active:false})
    }


    return (
      <Translation>
        {t=> {
          return(
            <Modal show={active} onHide={handleClose}>
              <Modal.Header >
                <Modal.Title>{t('modal_field_error')}</Modal.Title>
              </Modal.Header>
              <Modal.Footer>
                <Button variant="secondary" onClick={handleClose}>
                  {t('modal_close')}
                </Button>
              </Modal.Footer>
            </Modal>
          )
        }}
      </Translation>
    )
  }
}


export const ConfirmationModal = (props) =>{
  const close = () => {props.setActive({})}
  return (
    <Modal show={props.active} onHide={close}>
        <Modal.Header closeButton>
          <Modal.Title>
              {props.title}
          </Modal.Title>
        </Modal.Header>

          {props.message?
              <Modal.Body>
                {props.message}
              </Modal.Body>
              :null
          }

        <Modal.Footer>
            <React.Fragment>
              <Button variant="primary" onClick={()=>{props.action(); close();}}>
                {props.accept}
              </Button>
              <Button variant="danger" onClick={close}>
                {props.decline}
              </Button>
            </React.Fragment>
        </Modal.Footer>
    </Modal>
  )
}

export function ResponseModal(props){
  let {tenant_name} = useParams();
  // eslint-disable-next-line
  const { t, i18n } = useTranslation();
  let history = useHistory();

  //const handleClose = () => props.setMessage();
  const handleClose = () => {
    history.push('/'+tenant_name+'/petitions');}
  return (
    <Modal show={props.message?true:false} onHide={handleClose}>
        <Modal.Header closeButton>
          <Modal.Title>
              {props.modalTitle}
          </Modal.Title>
        </Modal.Header>
        <Modal.Body >
          {props.message}
        </Modal.Body>
        <Modal.Footer>

          <Button variant="secondary" onClick={handleClose}>
            {t('modal_continue')}
          </Button>

        </Modal.Footer>
    </Modal>
  )
}
export function ListResponseModal(props){

  // eslint-disable-next-line
  const { t, i18n } = useTranslation();
  const handleClose = () => props.setMessage();

  return (
    <Modal show={props.message?true:false} onHide={handleClose}>
        <Modal.Header closeButton>
          <Modal.Title>
              {props.modalTitle}
          </Modal.Title>
        </Modal.Header>
        <Modal.Body >
          {props.message}
        </Modal.Body>
        <Modal.Footer>

          <Button variant="secondary" onClick={handleClose}>
            {t('modal_continue')}
          </Button>

        </Modal.Footer>
    </Modal>
  )
}
