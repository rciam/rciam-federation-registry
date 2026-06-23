import React, { useContext, useState, useEffect } from 'react';
import { useFormikContext } from 'formik';
import InputRow from './InputRow';
import {
  SimpleInput,
  LogoInput,
  TextAria,
  CountrySelect,
  Contacts,
  OrganizationField,
  SimpleCheckbox,
  SelectEnvironment
} from './Inputs';
import { useTranslation } from 'react-i18next';
import parse from 'html-react-parser';
import { tenantContext } from '../context';
import { UrlWarning } from './UrlWarning';
import { useTabConfig } from './TabConfigProvider';

/**
 * General tab component - renders all general form fields.
 * Field order is configurable via form_field_config.json.
 */
const GeneralTab = ({ disabled, changes, extraFields = {} }) => {
  const { t } = useTranslation();
  const [tenant] = useContext(tenantContext);
  const { values, errors, touched, handleChange, handleBlur, setFieldValue } = useFormikContext();
  const { getFieldsForTab, getFieldConfig, isFieldVisible } = useTabConfig();
  const [logoWarning, setLogoWarning] = useState(false);

  // Get ordered fields for general tab
  const orderedFieldNames = getFieldsForTab('general');

  /**
   * Check if logo URL exists
   */
  const checkLogoExists = (url) => {
    if (url) {
      const img = new Image();
      img.onload = () => setLogoWarning(false);
      img.onerror = () => setLogoWarning(true);
      img.src = url;
    } else {
      setLogoWarning(false);
    }
  };

  useEffect(() => {
    checkLogoExists(values.logo_uri);
  }, [values.logo_uri]);

  /**
   * Render a standard input field
   */
  const renderSimpleInput = (fieldName, placeholder, required = false) => {
    const config = getFieldConfig('general', fieldName);
    if (!isFieldVisible(config?.condition, values)) return null;

    return (
      <InputRow
        key={fieldName}
        title={t(`form_${fieldName}`) || fieldName}
        moreInfo={tenant.form_config.more_info?.[fieldName] || {}}
        required={required || config?.required}
        error={errors[fieldName]}
        touched={touched[fieldName]}
      >
        <SimpleInput
          name={fieldName}
          placeholder={placeholder}
          onChange={handleChange}
          onBlur={handleBlur}
          value={values[fieldName] || ''}
          isInvalid={!!errors[fieldName]}
          disabled={disabled}
          changed={changes?.[fieldName] ? true : null}
        />
        {fieldName === 'website_url' && <UrlWarning url={values.website_url} touched={touched.website_url} />}
        {fieldName === 'policy_uri' && <UrlWarning url={values.policy_uri} touched={touched.policy_uri} />}
      </InputRow>
    );
  };

  /**
   * Render extra field based on its type
   */
  const renderExtraField = (name, fieldData) => {
    const config = getFieldConfig('general', name);
    const required = fieldData.required?.includes(values.integration_environment);

    if (!isFieldVisible(config?.condition, values)) return null;

    if (fieldData.type === 'boolean') {
      return (
        <InputRow
          key={name}
          title={fieldData.title}
          moreInfo={tenant.form_config.more_info?.[name] || {}}
          required={required}
          error={errors[name]}
          touched={touched[name]}
        >
          <SimpleCheckbox
            name={name}
            label={parse(fieldData.desc)}
            moreinfo={tenant.form_config.more_info?.[name]}
            onChange={handleChange}
            onBlur={handleBlur}
            disabled={disabled || (fieldData.tag === 'once' && values[name])}
            value={values[name]}
            changed={changes?.[name] ? true : null}
          />
        </InputRow>
      );
    }

    if (fieldData.type === 'string') {
      return (
        <InputRow
          key={name}
          title={fieldData.title}
          description={fieldData.desc}
          moreInfo={tenant.form_config.more_info?.[name] || {}}
          required={required}
          error={errors[name]}
          touched={touched[name]}
        >
          <SimpleInput
            name={name}
            placeholder={fieldData.placeholder}
            onChange={handleChange}
            onBlur={handleBlur}
            value={values[name]}
            isInvalid={!!errors[name]}
            disabled={disabled}
            changed={changes?.[name] ? true : null}
          />
          {fieldData.tag === 'url' && <UrlWarning url={values[name]} touched={touched[name]} />}
        </InputRow>
      );
    }

    return null;
  };

  /**
   * Get organization visibility based on config
   */
  const showOrganization = () => {
    const orgConfig = tenant.form_config.extra_fields?.organization;
    return orgConfig && !orgConfig.hide?.includes(values.integration_environment);
  };

  /**
   * Get organization required status
   */
  const isOrgRequired = () => {
    return tenant.form_config.extra_fields?.organization?.required?.includes(values.integration_environment);
  };

  // Split extra fields by tag
  const regularExtraFields = Object.entries(extraFields)
    .filter(([_, data]) => data.tab === 'general' && data.tag !== 'once');

  const onceExtraFields = Object.entries(extraFields)
    .filter(([_, data]) => data.tab === 'general' && data.tag === 'once');

  return (
    <div className="general-tab-content">
      {/* Render fields in configured order */}
      {orderedFieldNames.map((fieldName) => {
        const config = getFieldConfig('general', fieldName);
        if (!isFieldVisible(config?.condition, values)) return null;

        switch (fieldName) {
          case 'service_name':
            return (
              <InputRow
                key={fieldName}
                title={t('form_service_name')}
                moreInfo={tenant.form_config.more_info?.service_name || {}}
                required={true}
                description={t('form_service_name_desc')}
                error={errors.service_name}
                touched={touched.service_name}
              >
                <SimpleInput
                  name="service_name"
                  placeholder={t('form_type_prompt')}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  value={values.service_name || ''}
                  isInvalid={!!errors.service_name}
                  disabled={disabled}
                  changed={changes?.service_name ? true : null}
                />
              </InputRow>
            );

          case 'integration_environment':
            return (
              <InputRow
                key={fieldName}
                title={t('form_integration_environment')}
                moreInfo={tenant.form_config.more_info?.integration_environment || {}}
                required={true}
                extraClass="select-col"
                error={errors.integration_environment}
                touched={touched.integration_environment}
              >
                <SelectEnvironment
                  onBlur={handleBlur}
                  optionsTitle={tenant.form_config.integration_environment.map(capitalWords)}
                  options={tenant.form_config.integration_environment}
                  name="integration_environment"
                  values={values}
                  isInvalid={!!errors.integration_environment}
                  onChange={handleChange}
                  disabled={disabled || tenant.form_config.integration_environment.length === 1}
                  changed={changes?.integration_environment ? true : null}
                />
              </InputRow>
            );

          case 'logo_uri':
            return (
              <InputRow key={fieldName} title={t('form_logo')} moreInfo={{}}>
                <LogoInput
                  value={values.logo_uri || ''}
                  name="logo_uri"
                  description={t('form_logo_desc')}
                  moreInfo={tenant.form_config.more_info?.logo_uri || {}}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  error={errors.logo_uri}
                  touched={touched.logo_uri}
                  isInvalid={!!errors.logo_uri}
                  disabled={disabled}
                  warning={logoWarning}
                  changed={changes?.logo_uri ? true : null}
                />
              </InputRow>
            );

          case 'website_url':
            return renderSimpleInput('website_url', t('form_url_placeholder'), false);

          case 'service_description':
            return (
              <InputRow
                key={fieldName}
                title={t('form_description')}
                moreInfo={tenant.form_config.more_info?.service_description || {}}
                required={true}
                description={t('form_description_desc')}
                error={errors.service_description}
                touched={touched.service_description}
              >
                <TextAria
                  name="service_description"
                  placeholder={t('form_type_prompt')}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  value={values.service_description || ''}
                  isInvalid={!!errors.service_description}
                  disabled={disabled}
                  changed={changes?.service_description ? true : null}
                />
              </InputRow>
            );

          case 'country':
            return (
              <InputRow
                key={fieldName}
                title={t('form_country') || 'Select country'}
                moreInfo={tenant.form_config.more_info?.country || {}}
                required={tenant.form_config.more_info?.country?.required?.includes(values.integration_environment)}
                extraClass="select-col"
                error={errors.country}
                touched={touched.country}
              >
                <CountrySelect
                  onBlur={handleBlur}
                  placeholder="Select country"
                  name="country"
                  values={values}
                  isInvalid={!!errors.country}
                  onChange={handleChange}
                  disabled={disabled}
                  changed={changes?.country ? true : null}
                />
              </InputRow>
            );

          case 'organization_name':
            if (!showOrganization()) return null;
            return (
              <InputRow
                key={fieldName}
                title="Organisation"
                moreInfo={tenant.form_config.more_info?.organization_name || {}}
                required={isOrgRequired()}
                description="Search for your organisation"
                error={errors.organization_name}
                touched={touched.organization_name}
              >
                <OrganizationField
                  name="organization_name"
                  placeholder="Type the name of your organization"
                  onChange={handleChange}
                  values={values}
                  isInvalid={!!errors.organization_name}
                  setFieldTouched={(field, val) => setFieldValue(field, val)}
                  disabled={disabled}
                  setFieldValue={setFieldValue}
                  changed={changes?.organization_name ? true : null}
                />
              </InputRow>
            );

          case 'organization_url':
            if (!showOrganization()) return null;
            return (
              <InputRow
                key={fieldName}
                title="Organisation Website URL"
                moreInfo={tenant.form_config.more_info?.organization_url || {}}
                required={isOrgRequired()}
                description="Link to the organization's website"
                error={errors.organization_url}
                touched={touched.organization_url}
              >
                <SimpleInput
                  name="organization_url"
                  placeholder={t('form_type_prompt')}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  value={values.organization_url || ''}
                  isInvalid={!!errors.organization_url}
                  disabled={disabled}
                  changed={changes?.organization_url ? true : null}
                />
              </InputRow>
            );

          case 'policy_uri':
            return renderSimpleInput('policy_uri', t('form_url_placeholder'), false);

          case 'contacts':
            return (
              <InputRow
                key={fieldName}
                title={t('form_contacts')}
                moreInfo={tenant.form_config.more_info?.contacts || {}}
                required={true}
                description={t('form_contacts_desc')}
                error={typeof errors.contacts === 'string' ? errors.contacts : null}
                touched={touched.contacts}
              >
                <Contacts
                  name="contacts"
                  values={values.contacts}
                  placeholder={t('form_type_prompt')}
                  empty={typeof errors.contacts === 'string'}
                  error={errors.contacts}
                  touched={touched.contacts}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  setFieldTouched={(field, val) => setFieldValue(field, val)}
                  disabled={disabled}
                  changed={changes?.contacts ? true : null}
                />
              </InputRow>
            );

          default:
            return null;
        }
      })}

      {/* Render extra fields */}
      {regularExtraFields.map(([name, fieldData]) => renderExtraField(name, fieldData))}
      {onceExtraFields.map(([name, fieldData]) => renderExtraField(name, fieldData))}
    </div>
  );
};

/**
 * Capitalize words in a string or array
 */
const capitalWords = (item) => {
  if (typeof item === 'string') {
    return item
      .toLowerCase()
      .split(' ')
      .map((word) => word.charAt(0).toUpperCase() + word.substring(1))
      .join(' ');
  }
  return item;
};

export default GeneralTab;
