import React,{useState,useEffect} from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {faSync,faPlus,faTimes,faEdit, faTrash } from '@fortawesome/free-solid-svg-icons';
import InputGroup from 'react-bootstrap/InputGroup';
import FormControl from 'react-bootstrap/FormControl';
import Button from 'react-bootstrap/Button';
import Col from 'react-bootstrap/Col';
import Row from 'react-bootstrap/Row';
import Table from 'react-bootstrap/Table';
import * as config from './config.json';
import Image from 'react-bootstrap/Image';
import {Link} from "react-router-dom";
import Badge from 'react-bootstrap/Badge';
import Modal from 'react-bootstrap/Modal';

import {LoadingBar} from './Components/LoadingBar';

const ClientList= (props)=> {
  const [loadingList,setLoadingList] = useState();
  const [clients,setClients] = useState();
  const [confirmationId,setConfirmationId] = useState();

  useEffect(()=>{
    setLoadingList(true);
    getClients();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  },[]);

  const getClients = ()=> {
    fetch(config.host+'clients/user', {
      method: 'GET', // *GET, POST, PUT, DELETE, etc.
      credentials: 'include', // include, *same-origin, omit
      headers: {
      'Content-Type': 'application/json'
    }}).then(response=>response.json()).then(response=> {
      if(response.success){
        setLoadingList(false);
        setClients(response.connections);
      }
    });
  }
  const deleteClient = (id)=>{
    fetch(config.host+'client/delete/'+id, {
      method: 'PUT', // *GET, POST, PUT, DELETE, etc.
      credentials: 'include', // include, *same-origin, omit
      headers: {
      'Content-Type': 'application/json'
    }}).then(response=>response.json()).then(response=> {
      getClients();
    });
  }


  return(
    <React.Fragment>

      <Confirmation confirmationId={confirmationId} setConfirmationId={setConfirmationId} deleteClient={deleteClient}/>
      <div className="links">
        <Link to="/home">Home</Link>
        <span className="link-seperator">/</span>
        Manage Clients
      </div>
      <div>
        <LoadingBar loading={loadingList}>
          <Row className="options-bar">
            <Col>
              <Button variant="light" onClick={getClients} ><FontAwesomeIcon icon={faSync} />Refresh</Button>
              <Link to="/form/new"><Button><FontAwesomeIcon icon={faPlus}/>New Client</Button></Link>
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
                <td>Details</td>
                <td>Controls</td>
              </tr>
            </thead>
            <tbody>

                  {clients?clients.map((item,index)=>{
                  return(
                  <TableItem item={item} user={props.user} key={index} setConfirmationId={setConfirmationId}/>
                  )
                  }):<tr></tr>}

            </tbody>
          </Table>
        </LoadingBar>
      </div>
    </React.Fragment>
    )
  }

function TableItem(props) {
  return (
    <tr>
      <td className="petition-details">
        <div className="table-image-container">
          <Image src={props.item.logo_uri} thumbnail/>
        </div>
      </td>
      <td>
        <div className="flex-column">
          <h3 className="petition-title">{props.item.client_name}</h3>
          <Badge className="status-badge" variant={props.item.approved?'success':'danger'}>{props.item.approved?'Approved':'Pending'}</Badge>
          <p>{props.item.client_description}</p>
        </div>
      </td>
      <td>
        <div className="petition-actions">
        {props.item.requester===props.user.sub?
          <React.Fragment>
          <Link to={"/form/edit/"+props.item.id}><Button variant="light"><FontAwesomeIcon icon={faEdit}/>Edit</Button></Link>
          <Button variant="danger" onClick={()=>props.setConfirmationId(props.item.id)}><FontAwesomeIcon icon={faTrash} />Delete</Button>
          </React.Fragment>
        :null
        }
        {props.user.admin?<Link to={"/form/review/"+props.item.id}><Button variant="info"><FontAwesomeIcon icon={faEdit}/>Review</Button></Link>:null}


        </div>
      </td>
    </tr>
  )
}


function Confirmation(props){

  const handleClose = () => props.setConfirmationId();
  return (
    <Modal show={props.confirmationId?true:false} onHide={handleClose}>
        <Modal.Header closeButton>
          <Modal.Title>
              Are you sure sure you would like to delete this client?
          </Modal.Title>
        </Modal.Header>
        <Modal.Footer>
          <Button variant="danger" onClick={handleClose}>
            Cancel
          </Button>
          <Button variant="primary" onClick={()=>{props.deleteClient(props.confirmationId); handleClose();}}>
            OK
          </Button>

        </Modal.Footer>
    </Modal>
  )
}


export default ClientList;
