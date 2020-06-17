import React,{useContext} from 'react';
import Modal from 'react-bootstrap/Modal';
import {useHistory} from "react-router-dom";
import Button from 'react-bootstrap/Button';
import StringsContext from '../localContext';

export class SimpleModal extends React.Component {

  constructor(props){
    super(props);
    this.state = {active:false,
      strings:useContext(StringsContext)
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
      <Modal show={active} onHide={handleClose}>
         <Modal.Header >
           <Modal.Title>{this.state.strings.modal_field_error}</Modal.Title>
         </Modal.Header>
         <Modal.Footer>
           <Button variant="secondary" onClick={handleClose}>
             {this.state.strings.modal_close}
           </Button>
         </Modal.Footer>
      </Modal>
  )}
}



export function ResponseModal(props){
  const strings = useContext(StringsContext);
  let history = useHistory();

  //const handleClose = () => props.setMessage();
  const handleClose = () => history.push('/petitions');
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
            {strings.modal_continue}
          </Button>

        </Modal.Footer>
    </Modal>
  )
}
export function ListResponseModal(props){


    const strings = useContext(StringsContext);

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
            {strings.modal_continue}
          </Button>

        </Modal.Footer>
    </Modal>
  )
}
