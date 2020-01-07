import React,{useEffect,useState} from 'react';
import initialValues from './initialValues';
import * as config from './config.json';
import { useReactOidc } from '@axa-fr/react-oidc-context';
import {useParams} from "react-router-dom";
import FormTabs from "./FormTabs.js";
import ClientList from "./ClientList.js";

const EditClient = (props) => {
  const [initData,setInitData] = useState();
  const { oidcUser } = useReactOidc();

  let { id } = useParams();
  useEffect(()=>{
    console.log(initialValues);
    getInitialValues();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  },[]);
  const getInitialValues = () => {
    fetch(config.localhost+'getclient/'+id, {
      method: 'GET', // *GET, POST, PUT, DELETE, etc.
      credentials: 'same-origin', // include, *same-origin, omit
      headers: {
        'Authorization': 'Bearer ' + oidcUser.access_token,
        'Content-Type': 'application/json'
      }
    }).then(response=>response.json()).then(response=> {
      if(response.success){
          setInitData(response.connection);
      }
      setInitData(initialValues);
      console.log(response);

    });
  }
  return (
    <React.Fragment>
      {initData?<FormTabs initialValues={initData}/>:<ClientList/>}
    </React.Fragment>
  )
}

const NewClient = ()=>{
  return <FormTabs initialValues={initialValues}/>
}

export {
   EditClient,
   NewClient
}
