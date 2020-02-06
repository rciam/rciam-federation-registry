import React from 'react';
import Modal from 'react-bootstrap/Modal';
import {useHistory} from "react-router-dom";
import Button from 'react-bootstrap/Button';

export class SimpleModal extends React.Component {

  constructor(props){
    super(props);
    this.state = {active:false}
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
           <Modal.Title>Not all form fields are filled correctly!</Modal.Title>
         </Modal.Header>
         <Modal.Footer>
           <Button variant="secondary" onClick={handleClose}>
             Close
           </Button>
         </Modal.Footer>
      </Modal>
  )}
}



export function ResponseModal(props){

  let history = useHistory();


  const handleClose = () => history.push('/petitions');
  return (
    <Modal show={props.message?true:false} onHide={handleClose}>
        <Modal.Header closeButton>
          <Modal.Title>
              Petition with id: {props.clientId}
          </Modal.Title>
        </Modal.Header>
        <Modal.Body >
          {props.message}
        </Modal.Body>
        <Modal.Footer>

          <Button variant="secondary" onClick={handleClose}>
            Continue
          </Button>

        </Modal.Footer>
    </Modal>
  )
}
