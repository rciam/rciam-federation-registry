import React,{useState,useEffect,useContext} from 'react';
import Modal from 'react-bootstrap/Modal';
import {capitalWords} from '../helpers.js'
import {useParams,Link} from "react-router-dom";
import Button from 'react-bootstrap/Button';
import { Translation } from 'react-i18next';
import {tenantContext} from '../context.js';


//import Select from 'react-select';
const MoveDialog = (props) => {
    let {tenant_name} = useParams();
    // eslint-disable-next-line
//  const { t, i18n } = useTranslation();
    // eslint-disable-next-line
    const [tenant,setTenant] = useContext(tenantContext);
    const [moveOptions,setMoveOptions] = useState([]);

    const [moveEnv,setMoveEnv] = useState();

    useEffect(()=>{
        const filteredOptions = tenant.form_config.integration_environment.filter(
            (env) => env !== props.current_environment
        );
        setMoveOptions(filteredOptions);
        setMoveEnv(filteredOptions[0]);
    },[props.current_environment,tenant.form_config.integration_environment])


    return (
        <Translation>
            {t=> {
                return(
                    <Modal show={props.show} onHide={()=>{props.toggleMoveDialog()}}>
                        <Modal.Header >
                            <Modal.Title>Select Environent to Move</Modal.Title>
                        </Modal.Header>

                        <Modal.Body>
                            <p>Select the environment to move the service to:</p>
                            <select name="pets" id="pet-select"  defaultValue={moveOptions[0]} onChange={(e) =>{setMoveEnv(e.target.value);}}>
                                {moveOptions.map((env,index)=>{
                                    return <option key={index} value={env}>{capitalWords(env)}</option>
                                })}
                            </select>
                        </Modal.Body>
                        <Modal.Footer>
                            <Button variant="secondary" onClick={()=>{props.toggleMoveDialog()}}>
                                Cancel
                            </Button>
                            <Link to={{
                                pathname:'/'+tenant_name+"/services/"+props.service_id+"/move",
                                state:{
                                    service_id:props.service_id,
                                    integration_environment:moveEnv,
                                    move_service:true
                                }
                            }}>
                                <React.Fragment>
                                    <Button variant="secondary">

                                        Move Service

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
export default MoveDialog
