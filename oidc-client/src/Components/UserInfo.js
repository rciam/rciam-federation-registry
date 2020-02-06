import React from 'react';
import {Link} from "react-router-dom";
import {LoadingBar} from "./LoadingBar"
const UserInfo = (props)=>{
  return(
    <React.Fragment>
      <div className="links">
        <Link to="/home">Home</Link>
        <span className="link-seperator">/</span>
         View User Profile
      </div>
      <LoadingBar loading={props.user?false:true}>
      <dl className="dl-horizontal">
        <dt>
          <span className="text-info">Claim name:</span>
        </dt>
        <dd>
          <span className="text-info">Claim value:</span>
        </dd>
        <dt>
          <span className="dl-text-info">sub</span>
        </dt>
        <dd>
          <span className="dl-text-info">{props.user?props.user.sub:null}</span>
        </dd>
        <dt>
          <span className="dl-text-info">name</span>
        </dt>
        <dd>
          <span className="dl-text-info">{props.user?props.user.name:null}</span>
        </dd>
        <dt>
          <span className="dl-text-info">given_name</span>
        </dt>
        <dd>
          <span className="dl-text-info">{props.user?props.user.given_name:null}</span>
        </dd>
        <dt>
          <span className="dl-text-info">family_name</span>
        </dt>
        <dd>
          <span className="dl-text-info">{props.user?props.user.family_name:null}</span>
        </dd>
        <dt>
          <span className="dl-text-info">email</span>
        </dt>
        <dd>
          <span className="dl-text-info">{props.user?props.user.email:null}</span>
        </dd>
        <dt>
          <span className="dl-text-info">acr</span>
        </dt>
        <dd>
          <span className="dl-text-info">{props.user?props.user.acr:null}</span>
        </dd>

        <dt>
          <span className="dl-text-info">edu_person_unique_id</span>
        </dt>
        <dd>
          <span className="dl-text-info">{props.user?props.user.sub:null}</span>
        </dd>
        {props.user?
          <React.Fragment>
        {props.user.eduperson_entitlement?props.user.eduperson_entitlement.map((item,index)=>{
          return(
            <React.Fragment key={index} >
              <dt>
                <span className="dl-text-info">eduperson_entitlement.{index}</span>
              </dt>
              <dd>
                <span className="dl-text-info">{item}</span>
              </dd>
            </React.Fragment>
          )
        }):null}
        {props.user.edu_person_entitlements?props.user.edu_person_entitlements.map((item,index)=>{
          return(
            <React.Fragment key={index}>
              <dt>
                <span className="dl-text-info">edu_person_entitlements.{index}</span>
              </dt>
              <dd>
                <span className="dl-text-info">{item}</span>
              </dd>
            </React.Fragment>
          )
        }):null}
          </React.Fragment>
        :
        null}
        <dt>
          <span className="dl-text-info">eduperson_assurance.0</span>
        </dt>
        <dd>
          <span className="dl-text-info">{props.user?props.user.acr:null}</span>
        </dd>
        <dt>
          <span className="dl-text-info">eduperson_unique_id</span>
        </dt>
        <dd>
          <span className="dl-text-info">{props.user?props.user.sub:null}</span>
        </dd>
      </dl>
      </LoadingBar>
    </React.Fragment>
  )
}
export default UserInfo;
