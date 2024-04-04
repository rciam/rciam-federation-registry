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
          <span className="text-info">{t('user_info_claim_name')}:</span>
        </dt>
        <dd>
          <span className="text-info">{t('user_info_claim_value')}</span>
        </dd>
        {Object.entries(props.user).map(([key, value]) => {
          // Skip rendering for 'actions' and 'role' properties
          if (key === 'actions' || key === 'role') {
            return null;
          }

          // Check if the value is an array
          if (Array.isArray(value)) {
            return value.map((item, index) => (
              <React.Fragment key={index}>
                <dt>
                  <span className="dl-text-info">{`${key}.${index}`}:</span>
                </dt>
                <dd>
                  <span className="dl-text-info">{item}</span>
                </dd>
              </React.Fragment>
            ));
          }

          // Handle other types of values
          return (
            <React.Fragment key={key}>
              <dt>
                <span className="dl-text-info">{t(key)}:</span>
              </dt>
              <dd>
                {typeof value === 'boolean' ? (
                  <span className={`dl-text-${value ? 'success' : 'error'}`}>{value.toString()}</span>
                ) : (
                  <span className="dl-text-info">{value}</span>
                )}
              </dd>
            </React.Fragment>
          );
        })}
      </dl>
      </LoadingBar>
    </React.Fragment>
  )
}
export default UserInfo;
