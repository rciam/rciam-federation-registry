import React from 'react';
import {LoadingBar} from "./LoadingBar";
import { useTranslation } from 'react-i18next';
const UserInfo = (props)=>{
  // eslint-disable-next-line
  const { t, i18n } = useTranslation();
  return(
    <React.Fragment>

      <LoadingBar loading={props.user?false:true}>
      <dl className="dl-horizontal">
        <dt>
          <span className="text-info">{t('user_info_claim_name')}</span>
        </dt>
        <dd>
          <span className="text-info">{t('user_info_claim_name')}</span>
        </dd>
        <dt>
          <span className="dl-text-info">{t('user_sub')}</span>
        </dt>
        <dd>
          <span className="dl-text-info">{props.user.sub}</span>
        </dd>
        <dt>
          <span className="dl-text-info">{t('user_info_name')}</span>
        </dt>
        <dd>
          <span className="dl-text-info">{props.user.name}</span>
        </dd>
        <dt>
          <span className="dl-text-info">{t('user_info_given_name')}</span>
        </dt>
        <dd>
          <span className="dl-text-info">{props.user.given_name}</span>
        </dd>
        <dt>
          <span className="dl-text-info">{t('user_info_family_name')}</span>
        </dt>
        <dd>
          <span className="dl-text-info">{props.user.family_name}</span>
        </dd>
        <dt>
          <span className="dl-text-info">{t('user_info_email')}</span>
        </dt>
        <dd>
          <span className="dl-text-info">{props.user.email}</span>
        </dd>
        <dt>
          <span className="dl-text-info">{t('user_info_acr')}</span>
        </dt>
        <dd>
          <span className="dl-text-info">{props.user.acr}</span>
        </dd>

        <dt>
          <span className="dl-text-info">{t('user_info_edu_person_unique_id')}</span>
        </dt>
        <dd>
          <span className="dl-text-info">{props.user.sub}</span>
        </dd>


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


        <dt>
          <span className="dl-text-info">eduperson_assurance.0</span>
        </dt>
        <dd>
          <span className="dl-text-info">{props.user.acr}</span>
        </dd>
        <dt>
          <span className="dl-text-info">eduperson_unique_id</span>
        </dt>
        <dd>
          <span className="dl-text-info">{props.user.sub}</span>
        </dd>
      </dl>
      </LoadingBar>
    </React.Fragment>
  )
}
export default UserInfo;
