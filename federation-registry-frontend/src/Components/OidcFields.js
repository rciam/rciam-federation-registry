import React, { useContext } from 'react';
import { useFormikContext } from 'formik';
import InputRow from './InputRow';
import {
  SimpleRadio,
  AuthMethRadioList,
  ClientSecret,
  Select,
  PublicKey,
  ListInputArray,
  ListInput,
  TimeInput,
  RefreshToken,
  DeviceCode,
  AccessTokenValidationModel,
  SimpleCheckbox
} from './Inputs';
import { useTranslation } from 'react-i18next';
import { tenantContext } from '../context';
import { formatDuration } from '../helpers';
import { faExclamationTriangle } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';

/**
 * OIDC-specific form fields component.
 * Field order is configurable via form_field_config.json.
 */
const OidcFields = ({ disabled, changes }) => {
  const { t } = useTranslation();
  const [tenant] = useContext(tenantContext);
  const { values, errors, touched, handleChange, handleBlur, setFieldValue } = useFormikContext();

  // Define OIDC-specific fields with their display order
  const oidcFieldOrder = [
    { name: 'application_type', order: 1 },
    { name: 'grant_types', order: 2 },
    { name: 'token_endpoint_auth_method', order: 3 },
    { name: 'client_secret', order: 4 },
    { name: 'token_endpoint_auth_signing_alg', order: 5 },
    { name: 'jwks', order: 6 },
    { name: 'jwks_uri', order: 7 },
    { name: 'allow_introspection', order: 8 },
    { name: 'scope', order: 9 },
    { name: 'redirect_uris', order: 10 },
    { name: 'post_logout_redirect_uris', order: 11 },
    { name: 'code_challenge_method', order: 12 },
    { name: 'refresh_token_validity_seconds', order: 13 },
    { name: 'device_code_validity_seconds', order: 14 },
    { name: 'access_token_validation_model', order: 15 },
    { name: 'access_token_validity_seconds', order: 16 },
    { name: 'id_token_timeout_seconds', order: 17 }
  ];

  return (
    <div className="oidc-fields-content">
      {oidcFieldOrder.map(({ name: fieldName }) => {
        // Conditional rendering based on field-specific logic
        switch (fieldName) {

          case 'application_type':
            return (
              <InputRow
                key={fieldName}
                title={t('form_application_type') || 'Application Type'}
                moreInfo={tenant.form_config.more_info?.application_type || {}}
                required={true}
                error={errors.application_type}
                touched={touched.application_type}
              >
                <SimpleRadio
                  name="application_type"
                  onChange={handleChange}
                  onBlur={handleBlur}
                  values={values}
                  radio_items={['WEB', 'NATIVE']}
                  radio_items_titles={['Web', 'Native']}
                  value={values.application_type}
                  isInvalid={!!errors.application_type}
                  disabled={disabled}
                  changed={changes?.application_type ? true : null}
                />
              </InputRow>
            );

          case 'grant_types':
            return (
              <InputRow
                key={fieldName}
                title={t('form_grant_types')}
                moreInfo={tenant.form_config.more_info?.grant_types || {}}
                error={errors.grant_types}
                touched={touched.grant_types}
              >
                <ListInputArray
                  name="grant_types"
                  values={values.grant_types}
                  listItems={tenant.form_config.grant_types}
                  disabled={disabled}
                  deprecated_options={tenant.form_config.grant_types_deprecated}
                  changed={changes?.grant_types ? true : null}
                />
              </InputRow>
            );

          case 'token_endpoint_auth_method':
            return (
              <InputRow
                key={fieldName}
                title={t('form_token_endpoint_auth_method') || 'Token Endpoint Authorization Method'}
                moreInfo={tenant.form_config.more_info?.token_endpoint_auth_method || {}}
                required={true}
                error={errors.token_endpoint_auth_method || errors.code_challenge_method}
                touched={touched.token_endpoint_auth_method}
              >
                <AuthMethRadioList
                  name="token_endpoint_auth_method"
                  values={values}
                  onChange={handleChange}
                  radio_items={tenant.form_config.token_endpoint_auth_method}
                  radio_items_titles={tenant.form_config.token_endpoint_auth_method_title}
                  disabled={disabled}
                  changed={changes?.token_endpoint_auth_method ? true : null}
                />
              </InputRow>
            );

          case 'client_secret':
            if (!['private_key_jwt', 'none'].includes(values.token_endpoint_auth_method)) {
              return (
                <InputRow
                  key={fieldName}
                  title={t('form_client_secret')}
                  moreInfo={tenant.form_config.more_info?.client_secret || {}}
                  required={true}
                  error={errors.client_secret}
                  touched={touched.client_secret}
                >
                  <ClientSecret
                    name="client_secret"
                    client_secret={values.client_secret}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    generate_client_secret={values.generate_client_secret}
                    isInvalid={!!errors.client_secret}
                    disabled={disabled}
                    changed={changes?.client_secret ? true : null}
                  />
                </InputRow>
              );
            }
            return null;

          case 'token_endpoint_auth_signing_alg':
            if (['private_key_jwt', 'client_secret_jwt'].includes(values.token_endpoint_auth_method)) {
              return (
                <InputRow
                  key={fieldName}
                  title={t('form_token_endpoint_auth_signing_alg') || 'Token Endpoint Signing Algorithm'}
                  moreInfo={tenant.form_config.more_info?.token_endpoint_auth_signing_alg || {}}
                  required={true}
                  extraClass="select-col"
                  error={errors.token_endpoint_auth_signing_alg}
                  touched={touched.token_endpoint_auth_signing_alg}
                >
                  <Select
                    onBlur={handleBlur}
                    optionsTitle={tenant.form_config.token_endpoint_auth_signing_alg_title}
                    options={tenant.form_config.token_endpoint_auth_signing_alg}
                    default="RS256"
                    name="token_endpoint_auth_signing_alg"
                    values={values}
                    isInvalid={!!errors.token_endpoint_auth_signing_alg}
                    onChange={handleChange}
                    disabled={disabled}
                    changed={changes?.token_endpoint_auth_signing_alg ? true : null}
                  />
                </InputRow>
              );
            }
            return null;

          case 'jwks':
            if (values.token_endpoint_auth_method === 'private_key_jwt') {
              return (
                <InputRow
                  key={fieldName}
                  title={t('form_jwks') || 'Public Key Set'}
                  moreInfo={tenant.form_config.more_info?.jwks || {}}
                  required={true}
                  description="URL for the client's JSON Web Key set (must be reachable by the server)"
                  extraClass="select-col"
                  error={errors.jwks || errors.jwks_uri}
                  touched={touched.jwks || touched.jwks_uri}
                >
                  <PublicKey
                    onBlur={handleBlur}
                    values={values}
                    setvalue={(field, value, validate) => setFieldValue(field, value, validate)}
                    isInvalid={!!(errors.jwks_uri || errors.jwks)}
                    datatype="json"
                    onChange={handleChange}
                    disabled={disabled}
                    changed={changes?.jwks || changes?.jwks_uri ? true : false}
                  />
                </InputRow>
              );
            }
            return null;

          case 'allow_introspection':
            return (
              <InputRow key={fieldName} title={t('form_allow_introspection')} moreInfo={tenant.form_config.more_info?.allow_introspection || {}}>
                <div className="simple_checkbox_container">
                  <SimpleCheckbox
                    name="allow_introspection"
                    label={t('form_allow_introspection_desc')}
                    onChange={handleChange}
                    moreinfo={tenant.form_config.more_info?.allow_introspection}
                    disabled={disabled || tenant.form_config.dynamic_fields?.includes('allow_introspection')}
                    value={values.allow_introspection}
                    changed={changes?.allow_introspection ? true : null}
                  />
                </div>
              </InputRow>
            );

          case 'scope':
            return (
              <InputRow
                key={fieldName}
                title={t('form_scope')}
                moreInfo={tenant.form_config.more_info?.scope || {}}
                required={values?.grant_types?.length > 0}
                description={t('form_scope_desc')}
                error={typeof errors.scope === 'string' ? errors.scope : null}
                touched={touched.scope}
              >
                <ListInputArray
                  name="scope"
                  values={values.scope}
                  placeholder={t('form_type_prompt')}
                  defaultValues={tenant.form_config.scope}
                  error={errors.scope}
                  touched={touched.scope}
                  disabled={disabled}
                  onBlur={handleBlur}
                  changed={changes?.scope ? true : null}
                />
              </InputRow>
            );

          case 'redirect_uris':
            return (
              <InputRow
                key={fieldName}
                title={t('form_redirect_uris')}
                moreInfo={tenant.form_config.more_info?.redirect_uris || {}}
                required={values?.grant_types?.includes('implicit') || values?.grant_types?.includes('authorization_code')}
                description={t('form_redirect_uris_desc')}
                error={typeof errors.redirect_uris === 'string' ? errors.redirect_uris : null}
                touched={touched.redirect_uris}
              >
                <ListInput
                  name="redirect_uris"
                  values={values.redirect_uris}
                  placeholder={t('form_type_prompt')}
                  empty={typeof errors.redirect_uris === 'string'}
                  error={errors.redirect_uris}
                  touched={touched.redirect_uris}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  integrationEnvironment={values.integration_environment}
                  setFieldTouched={(field, val) => setFieldValue(field, val)}
                  disabled={disabled}
                  changed={changes?.redirect_uris ? true : null}
                />
              </InputRow>
            );

          case 'post_logout_redirect_uris':
            if (!tenant.form_config.disabled_fields?.includes('post_logout_redirect_uris')) {
              return (
                <InputRow
                  key={fieldName}
                  title={t('form_post_logout_redirect_uris')}
                  moreInfo={tenant.form_config.more_info?.post_logout_redirect_uris || {}}
                  description={t('form_redirect_uris_desc')}
                  error={typeof errors.post_logout_redirect_uris === 'string' ? errors.post_logout_redirect_uris : null}
                  touched={touched.post_logout_redirect_uris}
                >
                  <ListInput
                    name="post_logout_redirect_uris"
                    values={values.post_logout_redirect_uris}
                    placeholder={t('form_type_prompt')}
                    empty={typeof errors.post_logout_redirect_uris === 'string'}
                    error={errors.post_logout_redirect_uris}
                    touched={touched.post_logout_redirect_uris}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    integrationEnvironment={values.integration_environment}
                    setFieldTouched={(field, val) => setFieldValue(field, val)}
                    disabled={disabled}
                    changed={changes?.post_logout_redirect_uris ? true : null}
                  />
                </InputRow>
              );
            }
            return null;

          case 'code_challenge_method':
            return (
              <InputRow
                key={fieldName}
                title={t('form_code_challenge_method')}
                moreInfo={tenant.form_config.more_info?.code_challenge_method || {}}
                required={true}
                extraClass="select-col"
                error={errors.code_challenge_method}
                touched={touched.code_challenge_method}
              >
                <Select
                  onBlur={handleBlur}
                  optionsTitle={[
                    `PKCE will not be used for this service ${values.grant_types?.includes('authorization_code') ? '(disabled)' : ''}`,
                    'Plain code challenge (deprecated)',
                    'SHA-256 hash algorithm (recommended)'
                  ]}
                  options={['', 'plain', 'S256']}
                  name="code_challenge_method"
                  values={values}
                  isInvalid={!!errors.code_challenge_method}
                  onChange={handleChange}
                  setFieldValue={(val) => setFieldValue('code_challenge_method', val)}
                  recommended="S256"
                  default={values.code_challenge_method || ''}
                  disabled={disabled}
                  changed={changes?.code_challenge_method ? true : null}
                />
                <div className="pkce-tooltip">
                  <FontAwesomeIcon icon={faExclamationTriangle} />
                  Enabling PKCE is highly recommended to avoid code injection and code replay attacks.
                </div>
              </InputRow>
            );

          case 'refresh_token_validity_seconds':
            return (
              <InputRow
                key={fieldName}
                title={t('form_refresh_token_validity_seconds')}
                moreInfo={tenant.form_config.more_info?.refresh_token_validity_seconds || {}}
                required={values.scope?.includes('offline_access')}
                extraClass="time-input"
                error={errors.refresh_token_validity_seconds}
                touched={touched.refresh_token_validity_seconds}
                description={`${t('form_refresh_token_validity_seconds_desc')} ${t('min_value_is')} ${formatDuration(
                  tenant.form_config.more_info?.refresh_token_validity_seconds?.min ?? 1
                )}. ${t('max_value_is')} ${formatDuration(
                  tenant.form_config.more_info?.refresh_token_validity_seconds?.max ??
                  tenant.form_config.refresh_token_validity_seconds ??
                  34560000
                )}.`}
              >
                <RefreshToken
                  values={values}
                  onBlur={handleBlur}
                  isInvalid={!!errors.refresh_token_validity_seconds}
                  onChange={handleChange}
                  disabled={disabled}
                  errors={errors}
                  setFieldValue={setFieldValue}
                  changed={changes}
                />
              </InputRow>
            );

          case 'device_code_validity_seconds':
            return (
              <InputRow
                key={fieldName}
                title={t('form_device_code_validity_seconds')}
                moreInfo={tenant.form_config.more_info?.device_code_validity_seconds || {}}
                required={values?.grant_types?.includes('urn:ietf:params:oauth:grant-type:device_code')}
                extraClass="time-input"
                error={errors.device_code_validity_seconds}
                touched={touched.device_code_validity_seconds}
              >
                <DeviceCode
                  onBlur={handleBlur}
                  values={values}
                  setFieldValue={setFieldValue}
                  errors={errors}
                  isInvalid={!!errors.device_code_validity_seconds}
                  onChange={handleChange}
                  disabled={disabled}
                  changed={changes}
                />
              </InputRow>
            );

          case 'access_token_validation_model':
            return (
              <InputRow
                key={fieldName}
                title={t('form_access_token_validation_model')}
                moreInfo={tenant.form_config.more_info?.access_token_validation_model || {}}
                required={true}
                error={errors.access_token_validation_model}
                touched={touched.access_token_validation_model}
              >
                <AccessTokenValidationModel
                  name="access_token_validation_model"
                  values={values}
                  setFieldValue={setFieldValue}
                  disabled={disabled}
                  changed={changes?.access_token_validation_model ? true : null}
                  limits={tenant.form_config.more_info.access_token_validity_seconds.max}
                />
              </InputRow>
            );

          case 'access_token_validity_seconds':
            return (
              <InputRow
                key={fieldName}
                title={t('form_access_token_validity_seconds')}
                moreInfo={tenant.form_config.more_info?.access_token_validity_seconds || {}}
                required={true}
                extraClass="time-input"
                error={errors.access_token_validity_seconds}
                touched={touched.access_token_validity_seconds}
                description={`${t('form_access_token_validity_seconds_desc')} ${t('min_value_is')} ${formatDuration(
                  tenant.form_config.more_info?.access_token_validity_seconds?.min ?? 1
                )}. ${t('max_value_is')} ${formatDuration(
                  tenant.form_config.more_info?.access_token_validity_seconds?.max?.[
                    values.access_token_validation_model || 'OFFLINE_VERIFIABLE'
                  ] ??
                  tenant.form_config.more_info?.access_token_validity_seconds?.max?.OFFLINE_VERIFIABLE ??
                  tenant.form_config.access_token_validity_seconds ??
                  21600
                )}.`}
              >
                <TimeInput
                  name="access_token_validity_seconds"
                  value={values.access_token_validity_seconds}
                  isInvalid={!!errors.access_token_validity_seconds}
                  onBlur={handleBlur}
                  onChange={handleChange}
                  disabled={disabled}
                  changed={changes?.access_token_validity_seconds ? true : null}
                />
              </InputRow>
            );

          case 'id_token_timeout_seconds':
            return (
              <InputRow
                key={fieldName}
                title={t('form_id_token_timeout_seconds')}
                moreInfo={tenant.form_config.more_info?.id_token_timeout_seconds || {}}
                required={true}
                extraClass="time-input"
                error={errors.id_token_timeout_seconds}
                touched={touched.id_token_timeout_seconds}
                description={t('form_id_token_timeout_seconds_desc')}
              >
                <TimeInput
                  name="id_token_timeout_seconds"
                  value={values.id_token_timeout_seconds}
                  isInvalid={!!errors.id_token_timeout_seconds}
                  onBlur={handleBlur}
                  onChange={handleChange}
                  disabled={disabled}
                  changed={changes?.id_token_timeout_seconds ? true : null}
                />
              </InputRow>
            );

          default:
            return null;
        }
      })}
    </div>
  );
};

export default OidcFields;
