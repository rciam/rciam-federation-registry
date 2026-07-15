import React, { useContext, useState } from 'react';
import { useFormikContext } from 'formik';
import InputRow from './InputRow';
import { Select } from './Inputs';
import { useTranslation } from 'react-i18next';
import { tenantContext } from '../context';
import OidcFields from './OidcFields';
import SamlFields from './SamlFields';

/**
 * Protocol tab component - wrapper for protocol-specific fields.
 * Renders OIDC or SAML fields based on selected protocol.
 * Field order is configurable via form_field_config.json.
 */
const ProtocolTab = ({ disabled, changes }) => {
  const { t } = useTranslation();
  const [tenant] = useContext(tenantContext);
  const { values, errors, touched, handleChange, handleBlur } = useFormikContext();

  // Metadata state lifted up for sharing between components
  const [metadataLoaded, setMetadataLoaded] = useState({
    supported_attributes: [],
    unsupported_attributes: [],
    entity_id: null,
    metadata_url: null
  });
  const [metadataAsyncError, setMetadataAyncError] = useState('');
  const [metadataWarning, setMetadataWarning] = useState();

  const metadataState = {
    metadataLoaded,
    setMetadataLoaded,
    metadataAsyncError,
    setMetadataAyncError,
    metadataWarning,
    setMetadataWarning
  };

  /**
   * Get protocol options with capitalized titles
   */
  const getProtocolOptions = (protocols) => {
    return protocols.map((p) => p.toUpperCase() + ' Service');
  };

  return (
    <div className="protocol-tab-content">
      {/* Protocol Selection */}
      <InputRow
        title={t('form_protocol')}
        required={true}
        extraClass="select-col"
        error={errors.protocol}
        touched={touched.protocol}
      >
        <Select
          onBlur={handleBlur}
          optionsTitle={['Select one option', ...getProtocolOptions(tenant.form_config.protocol)]}
          options={['', ...tenant.form_config.protocol]}
          name="protocol"
          values={values}
          isInvalid={!!errors.protocol}
          onChange={handleChange}
          disabled={disabled}
          changed={changes?.protocol ? true : null}
        />
      </InputRow>

      {/* OIDC Fields */}
      {values.protocol === 'oidc' && <OidcFields disabled={disabled} changes={changes} />}

      {/* SAML Fields */}
      {values.protocol === 'saml' && <SamlFields disabled={disabled} changes={changes} metadataState={metadataState} />}
    </div>
  );
};

export default ProtocolTab;
