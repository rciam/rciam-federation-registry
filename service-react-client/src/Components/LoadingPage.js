import React from 'react';
import {Redirect} from "react-router-dom";
import Spinner from 'react-bootstrap/Spinner';



export const LoadingPage = (props) => {
  return (
    <div className="loading-page">
      {props.loading?<Spinner animation="border" variant="primary" />:<Redirect to={"/"+props.tenant_name+'/home'}/>}
    </div>
  )
}
