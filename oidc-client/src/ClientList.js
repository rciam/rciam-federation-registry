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


 const ClientList= ()=> {

   const [clients,setClients] = useState();

   useEffect(()=>{
     getClients();
     // eslint-disable-next-line react-hooks/exhaustive-deps
   },[]);

  const getClients = ()=> {
    fetch(config.host+'clients/user', {
      method: 'POST', // *GET, POST, PUT, DELETE, etc.
      credentials: 'include', // include, *same-origin, omit
      headers: {
        'Content-Type': 'application/json'
      }
    }).then(response=>response.json()).then(response=> {
      console.log(response);
      if(response.success){
        setClients(response.connections);
      }
    });
  }

    return(
      <React.Fragment>
        <div className="links">
          <Link to="/home">Home</Link>
          <span className="link-seperator">/</span>
          Manage Clients
        </div>
        <div >
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
                <td></td>
                <td><FontAwesomeIcon icon={faEdit}/></td>
              </tr>
            </thead>
            <tbody>
            {clients?clients.map((item,index)=>{
              return(
                <TableItem item={item} key={index}/>
              )
            }):<tr></tr>}
            </tbody>
          </Table>
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
          <h3>{props.item.client_name}</h3>
          <p>{props.item.client_description}</p>
        </div>
      </td>
      <td>
        <div className="petition-actions">
        <Link to={"/form/edit/"+props.item.id}><Button variant="light"><FontAwesomeIcon icon={faEdit}/>Edit</Button></Link>
        <Button variant="danger"><FontAwesomeIcon icon={faTrash} />Delete</Button>
        </div>
      </td>
    </tr>
  )
}

export default ClientList;
