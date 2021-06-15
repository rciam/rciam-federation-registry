import React,{useState,useEffect,useContext} from 'react';
import Modal from 'react-bootstrap/Modal';
import {capitalWords} from '../helpers.js'
import {useParams,Link} from "react-router-dom";
import Button from 'react-bootstrap/Button';
import { Translation } from 'react-i18next';
import {removeA} from '../helpers.js';
import {tenantContext} from '../context.js';


//import Select from 'react-select';
const CopyDialog = (props) => {
  let {tenant_name} = useParams();
  // eslint-disable-next-line
//  const { t, i18n } = useTranslation();
  // eslint-disable-next-line
  const [tenant,setTenant] = useContext(tenantContext);
  const [copyOptions,setCopyOptions] = useState([]);

  const [copyEnv,setCopyEnv] = useState();

  useEffect(()=>{
    let availableEnvs = [...tenant.form_config.integration_environment];
    let options = removeA(availableEnvs,props.current_environment)
    setCopyOptions(options);
    setCopyEnv(options[0]);
  },[props.current_environment,tenant.form_config.integration_environment])


  return (
    <Translation>
      {t=> {
        return(
          <Modal show={props.show} onHide={()=>{props.toggleCopyDialog()}}>
            <Modal.Header >
              <Modal.Title>Select Environent to Copy</Modal.Title>
            </Modal.Header>

            <Modal.Body>
              <p>Select the environment to register a copy of this service:</p>
              <select name="pets" id="pet-select"  defaultValue={copyOptions[0]} onChange={(e) =>{setCopyEnv(e.target.value);}}>
                {copyOptions.map((env,index)=>{
                  return <option key={index} value={env}>{capitalWords(env)}</option>
                })}
              </select>
            </Modal.Body>
            <Modal.Footer>
            <Button variant="secondary" onClick={()=>{props.toggleCopyDialog()}}>
              Cancel
            </Button>
            <Link to={{
              pathname:'/'+tenant_name+"/form/copy",
              state:{
                service_id:props.service_id,
                integration_environment:copyEnv
              }
            }}>
              <React.Fragment>
                <Button variant="secondary">

                Copy Service

                </Button>
              </React.Fragment>
            </Link>
            </Modal.Footer>
          </Modal>
        )
      }}
    </Translation>
  )


}
export default CopyDialog
