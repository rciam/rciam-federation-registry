import React, { useContext, useState, useEffect } from 'react';
import { useFormikContext } from 'formik';
import InputRow from './InputRow';
import { SimpleInput, MetadataInput } from './Inputs';
import { SamlAttributesInput } from './SamlAttributes';
import { useTranslation } from 'react-i18next';
import { tenantContext } from '../context';
import { reg } from '../regex';
import { ConfirmationModal } from './Modals';
import { UrlWarning } from './UrlWarning';

var metadataCheckTimeout;

/**
 * SAML-specific form fields component.
 * Field order is configurable via form_field_config.json.
 */
const SamlFields = ({ disabled, changes, metadataState }) => {
  const { t } = useTranslation();
  const [tenant] = useContext(tenantContext);
  const { values, errors, touched, handleChange, setFieldValue } = useFormikContext();

  const [checkingAvailability, setCheckingAvailability] = useState(false);
  const [checkedId, setCheckedId] = useState();
  const [checkedEnvironment, setCheckedEnvironment] = useState();

  const { metadataLoaded, setMetadataLoaded, metadataAsyncError, setMetadataAyncError, metadataWarning, setMetadataWarning } = metadataState;

  // Define SAML-specific fields with their display order
  const samlFieldOrder = [
    { name: 'entity_id', order: 1 },
    { name: 'metadata_url', order: 2 },
    { name: 'requested_attributes', order: 3 }
  ];

  /**
   * Fetch and process metadata from URL
   */
  const getMetadata = (url, resolve, setRequestedAttributes) => {
    fetch(
      `${process.env.REACT_APP_API_HOST || ''}util/metadata_info?metadata_url=${encodeURIComponent(url)}`,
      {
        method: 'GET',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' }
      }
    )
      .then(async (response) => {
        if (response.status === 200 || response.status === 304) {
          const metadata = await response.json();
          const loadMetadata = !metadataLoaded.metadata_url || url !== metadataLoaded.metadata_url;

          if (loadMetadata) {
            setMetadataLoaded(metadata);
          }

          if (tenant.form_config.more_info.requested_attributes && !tenant.form_config.more_info.requested_attributes.disabled) {
            if (metadata.supported_attributes.length === 0 && !metadata.entity_id) {
              setRequestedAttributes(tenant.form_config.requested_attributes);
              setMetadataWarning('Could not find an Entity Id or any Requested Attributes from this Metadata Url.');
            } else if (metadata.supported_attributes.length === 0) {
              setRequestedAttributes(tenant.form_config.defaultValues.requested_attributes);
              setMetadataWarning('Could not find any Requested Attributes from this Metadata Url.');
            } else if (!metadata.entity_id) {
              setMetadataWarning('Could not find an Entity Id from this Metadata Url.');
            }
          } else {
            setRequestedAttributes(tenant.form_config.defaultValues.requested_attributes);
            metadata.supported_attributes = [];
          }
        } else {
          setMetadataAyncError(response.statusText);
          if (resolve) resolve(true);
        }
      })
      .catch(() => {
        setMetadataAyncError('Could not get response from Metadata url');
        if (resolve) resolve(true);
      });
  };

  /**
   * Check entity ID availability
   */
  const checkEntityAvailability = (value) => {
    clearTimeout(metadataCheckTimeout);

    if (!value || !reg.regUrl.test(value)) {
      setCheckingAvailability(false);
      return;
    }

    if (value === checkedId && values.integration_environment === checkedEnvironment) {
      setCheckingAvailability(false);
      return;
    }

    setCheckingAvailability(true);

    metadataCheckTimeout = setTimeout(() => {
      fetch(
        `${process.env.REACT_APP_API_HOST || ''}tenants/${tenant.tenant_name}/check-availability?value=${encodeURIComponent(value)}&protocol=saml&environment=${values.integration_environment}`,
        {
          method: 'GET',
          credentials: 'include',
          headers: { 'Content-Type': 'application/json' }
        }
      )
        .then((response) => {
          if (response.status === 200) {
            return response.json();
          }
          return false;
        })
        .then((response) => {
          setCheckedId(value);
          setCheckedEnvironment(values.integration_environment);
          setCheckingAvailability(false);

          // Availability check result handled above
        })
        .catch(() => {
          setCheckingAvailability(false);
        });
    }, 1000);
  };

  useEffect(() => {
    checkEntityAvailability(values.entity_id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [values.entity_id, values.integration_environment]);

  return (
    <div className="saml-fields-content">
      {/* Confirmation Modal for metadata loading */}
      {metadataLoaded.supported_attributes.length > 0 ||
      (metadataLoaded.entity_id && (!values.entity_id || values.entity_id !== metadataLoaded.entity_id)) ? (
        <ConfirmationModal
          active={true}
          close={() => {
            if (metadataLoaded.supported_attributes.length > 0) {
              setMetadataLoaded({ ...metadataLoaded, supported_attributes: [] });
            } else if (metadataLoaded.entity_id) {
              setMetadataLoaded({ ...metadataLoaded, entity_id: '' });
            }
          }}
          action={() => {
            if (metadataLoaded.supported_attributes.length > 0) {
              setFieldValue('requested_attributes', metadataLoaded.supported_attributes);
              setMetadataLoaded({ ...metadataLoaded, supported_attributes: [] });
            } else {
              setFieldValue('entity_id', metadataLoaded.entity_id);
              setMetadataLoaded({ ...metadataLoaded, entity_id: '' });
            }
          }}
          title={
            metadataLoaded.supported_attributes.length > 0
              ? 'Do you wish to load the requested attributes contained in the Metadata Url?'
              : metadataLoaded.entity_id && !values.entity_id
              ? 'Do you wish to use the Entity Id contained in the Metadata Url?'
              : metadataLoaded.entity_id && metadataLoaded.entity_id !== values.entity_id
              ? 'The Metadata Url contains a different Entity Id from the provided, do you wish to replace it?'
              : ''
          }
          message={
            metadataLoaded.supported_attributes.length > 0
              ? `${metadataLoaded.supported_attributes.length}${
                  metadataLoaded.unsupported_attributes.length > 0
                    ? ` out of ${metadataLoaded.supported_attributes.length + metadataLoaded.unsupported_attributes.length}`
                    : ''
                } attributes found are supported and can be added in the service configuration.`
              : metadataLoaded.entity_id && (!values.entity_id || metadataLoaded.entity_id !== values.entity_id)
              ? `Entity Id: ${metadataLoaded.entity_id}`
              : ''
          }
          accept="Yes"
          decline="No"
        />
      ) : null}

      {/* Render fields in configured order */}
      {samlFieldOrder.map(({ name: fieldName }) => {
        switch (fieldName) {
          case 'entity_id':
            return (
              <InputRow
                key={fieldName}
                title={t('form_entity_id')}
                moreInfo={tenant.form_config.more_info?.entity_id || {}}
                required={true}
                description={t('form_entity_id_desc')}
                error={checkingAvailability ? null : errors.entity_id}
                touched={touched.entity_id}
              >
                <SimpleInput
                  name="entity_id"
                  placeholder={t('form_type_prompt')}
                  onChange={(e) => {
                    setFieldValue('entity_id', e.target.value);
                    handleChange(e);
                  }}
                  value={values.entity_id}
                  isInvalid={!!errors.entity_id && touched.entity_id && !checkingAvailability}
                  disabled={disabled}
                  changed={changes?.entity_id ? true : null}
                  isloading={values.entity_id && values.entity_id !== checkedId && checkingAvailability ? 1 : 0}
                />
              </InputRow>
            );

          case 'metadata_url':
            return (
              <InputRow
                key={fieldName}
                title={t('form_metadata_url')}
                moreInfo={tenant.form_config.more_info?.metadata_url || {}}
                required={true}
                description={t('form_metadata_url_desc')}
                error={metadataAsyncError || errors.metadata_url}
                touched={touched.metadata_url}
              >
                <MetadataInput
                  name="metadata_url"
                  placeholder="Type something"
                  onChange={(e) => {
                    setMetadataAyncError('');
                    setMetadataWarning();
                    handleChange(e);
                  }}
                  value={values.metadata_url}
                  isInvalid={!!metadataAsyncError || !!errors.metadata_url}
                  onBlur={() => {}}
                  disabled={disabled}
                  getmetadata={(metadata_url) => {
                    getMetadata(metadata_url, null, (attributes) => {
                      setFieldValue('requested_attributes', attributes, false);
                    });
                  }}
                  changed={changes?.metadata_url ? true : null}
                />
                <UrlWarning url={values.metadata_url} overwriteWarning={metadataWarning} disableCheck={1} touched={!!values.metadata_url} />
              </InputRow>
            );

          case 'requested_attributes':
            if (tenant.form_config.more_info.requested_attributes?.disabled) return null;
            return (
              <InputRow
                key={fieldName}
                title={tenant.form_config.more_info.requested_attributes.label || 'Attributes'}
                moreInfo={tenant.form_config.more_info.requested_attributes || {}}
                required={false}
                description={tenant.form_config.more_info.requested_attributes.description}
                error={errors.requested_attributes}
                touched={touched.requested_attributes}
              >
                <SamlAttributesInput
                  name="requested_attributes"
                  values={values.requested_attributes || []}
                  placeholder={t('form_type_prompt')}
                  defaultValues={tenant.form_config.requested_attributes}
                  errors={errors.requested_attributes}
                  touched={touched.requested_attributes}
                  setMetadataLoaded={setMetadataLoaded}
                  disabled={disabled}
                  setFieldValue={setFieldValue}
                  onBlur={() => {}}
                  changed={changes?.requested_attributes ? true : null}
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

export default SamlFields;
