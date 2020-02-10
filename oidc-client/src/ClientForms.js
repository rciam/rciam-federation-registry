import React,{useEffect,useState} from 'react';
import initialValues from './initialValues';
import * as config from './config.json';
import {useParams} from "react-router-dom";
import FormTabs from "./FormTabs.js";
import {LoadingBar} from './Components/LoadingBar';


const EditClient = (props) => {
  const [initData,setInitData] = useState();
  const [review,setReview] = useState(false);
  let { id } = useParams();
  useEffect(()=>{
    if(props.review){
      setReview(true);
    }
    getInitialValues();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  },[]);

  const getInitialValues = () => {
    fetch(config.host+'getclient/'+id, {
      method: 'GET', // *GET, POST, PUT, DELETE, etc.
      credentials: 'include', // include, *same-origin, omit
      headers: {
        'Content-Type': 'application/json'
      }
    }).then(response=>response.json()).then(response=> {
      if(response.success){
          setInitData(response.connection);
      }
      else{
        setInitData(initialValues)
      }
    });
  }
  return (
    <React.Fragment>
      {initData?<FormTabs initialValues={initData} editId={id} review={review} />:<LoadingBar loading={true}/>}
    </React.Fragment>
  )
}

const NewClient = ()=>{
  return (
    <React.Fragment>
      <FormTabs initialValues={initialValues} editId={null} />
    </React.Fragment>
  )
}

export {
   EditClient,
   NewClient
}
