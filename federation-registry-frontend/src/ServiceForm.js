import React, { useState, useEffect, useContext, useRef } from 'react';
import mapValues from 'lodash/mapValues';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCheckCircle, faBan, faSortDown, faExclamationTriangle, faPen } from '@fortawesome/free-solid-svg-icons';
import OverlayTrigger from 'react-bootstrap/OverlayTrigger';
import Tooltip from 'react-bootstrap/Tooltip';
import CopyDialog from './Components/CopyDialog.js';
import ButtonGroup from 'react-bootstrap/ButtonGroup';
import Row from 'react-bootstrap/Row';
import { ProcessingRequest } from './Components/LoadingBar';
import Collapse from 'react-bootstrap/Collapse';
import { useParams } from 'react-router-dom';
import { diff } from 'deep-diff';
import { tenantContext } from './context.js';
import Alert from 'react-bootstrap/Alert';
import { SimpleModal, Logout, NotFound, PetitionSubmittedModal } from './Components/Modals.js';
import Form from 'react-bootstrap/Form';
import 'bootstrap/dist/css/bootstrap.min.css';
import { Formik } from 'formik';
import config from './config.json';
import Button from 'react-bootstrap/Button';
import ManageTags from './Components/ManageTags.js';
import * as yup from 'yup';
import { useTranslation } from 'react-i18next';
import parse from 'html-react-parser';
import countryData from 'country-region-data';
import InputRow from './Components/InputRow.js';
import { SimpleInput, SimpleCheckbox } from './Components/Inputs.js';
import MoveDialog from './Components/MoveDialog';
import ServiceFormTabs from './Components/ServiceFormTabs';

const { reg } = require('./regex.js');

var availabilityCheckTimeout;
var urlCheckTimeout;
var urlCheckTimeoutResponse;
var countries;
let integrationEnvironment;
let application_type;
let timeouts = {};

/**
 * ServiceForm - Main service configuration form component.
 * Uses extracted tab components for better separation of concerns.
 */
const ServiceForm = (props) => {
  const { t, i18n } = useTranslation();
  let { tenant_name } = useParams();
  let { service_id } = useParams();
  let { petition_id } = useParams();

  const [notFound, setNotFound] = useState(false);
  const [restrictReview, setRestrictReview] = useState(false);
  const [tenant, setTenant] = useContext(tenantContext);
  const [logout, setLogout] = useState(false);
  const [submitDisabled, setSubmitDisabled] = useState(false);
  const [availabilityCheck, setAvailabilityCheck] = useState(true);
  const formRef = useRef();
  const [disabled, setDisabled] = useState(false);
  const [disabledOrganizationFields, setDisabledOrganizationFields] = useState([]);
  const [hasSubmitted, setHasSubmitted] = useState(false);
  const [metadataWarning, setMetadataWarning] = useState();
  const [metadataLoaded, setMetadataLoaded] = useState({
    supported_attributes: [],
    unsupported_attributes: [],
    entity_id: null,
    metadata_url: null
  });
  const [metadataAsyncError, setMetadataAyncError] = useState('');
  const [metadataChecked, setMetadataChecked] = useState();
  const [metadataLoading, setMetadataLoading] = useState(false);
  const [checkingAvailability, setCheckingAvailability] = useState(false);
  const [checkedId, setCheckedId] = useState();
  const [checkedEnvironment, setCheckedEnvironment] = useState();
  const [asyncResponse, setAsyncResponse] = useState(false);
  const [formValues, setFormValues] = useState();
  const [showCopyDialog, setShowCopyDialog] = useState(false);
  const [showMoveDialog, setShowMoveDialog] = useState(false);
  const [showInitErrors, setShowInitErrors] = useState(false);
  const [logoWarning, setLogoWarning] = useState(false);
  const [serviceTags, setServiceTags] = useState([]);
  const [manageTags, setManageTags] = useState(false);
  const [timeoutId] = useState(hex(4));
  const [modalData, setModalData] = useState({});

  const serviceMoveEnabled = tenant?.config?.merge_environments_on_deploy ?? false;

  useEffect(() => {
    if (props.user.actions.includes('manage_tags') && service_id) {
      getTags();
    }

    countries = [];
    if (service_id || petition_id) {
      setShowInitErrors(true);
    }

    if (
      !tenant.form_config.integration_environment.includes(props.initialValues.integration_environment)
    ) {
      props.initialValues.integration_environment =
        tenant.form_config.integration_environment[0];
    }

    if (props.move_service && props.integration_environment) {
      props.initialValues.integration_environment = props.integration_environment;
    }

    countryData.forEach((item) => {
      countries.push(item.countryShortCode.toLowerCase());
    });

    if (props.disabled || props.review) {
      setDisabled(true);
    }

    let extra_fields = tenant.form_config.extra_fields;
    Object.keys(extra_fields).forEach((name) => {
      if (!Object.keys(props.initialValues).includes(name)) {
        props.initialValues[name] = extra_fields[name].default;
      }
    });

    if (props.review) {
      if (
        tenant.restricted_environments.includes(props.initialValues.integration_environment) &&
        !props.user.actions.includes('review_restricted')
      ) {
        setRestrictReview(true);
      }
    }

    if (props.initialValues.organization_name) {
      setDisabledOrganizationFields(['organization_url']);
    }

    setFormValues(props.initialValues);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [props.initialValues]);

  yup.addMethod(yup.array, 'unique', function (message, mapper = (a) => a) {
    return this.test('unique', message, function (list) {
      if (list) {
        return list.length === new Set(list.map(mapper)).size;
      } else {
        return true;
      }
    });
  });

  function imageExists(url) {
    if (url) {
      var img = new Image();
      img.onload = function () {
        setLogoWarning(false);
      };
      img.onerror = function () {
        setLogoWarning(true);
      };
      img.src = url;
    } else {
      setLogoWarning(false);
    }
  }

  const dynamicValidation = async (values, props) => {
    let error = {};
    lazy_schema
      .validate(values, { abortEarly: false })
      .catch(function (err) {
        if (err.inner) {
          err.inner.forEach((item) => {
            error[item.path] = item.message;
          });
        }
      });
    return error;
  };

  const getMetadata = async (value, resolve, setRequestedAttributes) => {
    setMetadataLoading(true);
    setMetadataAyncError();
    setMetadataChecked(value);
    let loadMetadata =
      !(
        metadataChecked !== value &&
        value !== metadataLoaded.metadata_url &&
        value !== props.initialValues.metadataUrl
      ) || setRequestedAttributes;

    clearTimeout(timeouts[timeoutId]);
    timeouts[timeoutId] = setTimeout(() => {
      fetch(
        config.host[tenant_name] +
          'util/metadata_info?metadata_url=' +
          encodeURIComponent(value),
        {
          method: 'GET',
          credentials: 'include',
          headers: {
            'Content-Type': 'application/json'
          }
        }
      )
        .then(async (response) => {
          if (response.status === 200 || response.status === 304) {
            let metadata = await response.json();
            if (
              tenant.form_config.more_info.requested_attributes &&
              !tenant.form_config.more_info.requested_attributes.disabled
            ) {
              loadMetadata && setMetadataLoaded(metadata);
              if (
                metadata.supported_attributes.length === 0 &&
                !metadata.entity_id
              ) {
                if (!resolve) {
                  setRequestedAttributes(tenant.form_config.requested_attributes);
                }
                setMetadataWarning(
                  'Could not find an Entity Id or any Requested Attributes from this Metadata Url.'
                );
              } else if (metadata.supported_attributes.length === 0) {
                if (!resolve) {
                  setRequestedAttributes(
                    tenant.form_config.defaultValues.requested_attributes
                  );
                }
                setMetadataWarning(
                  'Could not find any Requested Attributes from this Metadata Url.'
                );
              } else if (!metadata.entity_id) {
                setMetadataWarning(
                  'Could not find an Entity Id from this Metadata Url.'
                );
              }
            } else {
              if (!resolve) {
                setRequestedAttributes(
                  tenant.form_config.defaultValues.requested_attributes
                );
              }
              metadata.supported_attributes = [];
              loadMetadata && setMetadataLoaded(metadata);
            }
          } else {
            if (!resolve) {
              setRequestedAttributes(
                tenant.form_config.defaultValues.requested_attributes
              );
            }
            setMetadataAyncError(response.statusText);
          }
          setMetadataLoading(false);
        })
        .catch(() => {
          setMetadataLoading(false);
          setMetadataAyncError('Could not get response from Metadata url');
          if (resolve) {
            resolve(true);
          }
        });
    }, 2000);
  };

  const lazy_schema = yup.lazy((obj) =>
    yup.object(
      mapValues(obj, (v, k) => {
        if (
          Object.keys(tenant.form_config.extra_fields).includes(k) &&
          tenant.form_config.extra_fields[k].type === 'boolean'
        ) {
          return yup.boolean().required(t('yup_required')).when('integration_environment', {
            is: (integration_environment) => {
              return tenant.form_config.extra_fields[k].required.includes(
                integration_environment
              );
            },
            then: yup.boolean().oneOf([true], tenant.form_config.extra_fields[k].error)
          });
        } else if (
          Object.keys(tenant.form_config.extra_fields).includes(k) &&
          k === 'aup_uri'
        ) {
          return yup
            .string()
            .nullable()
            .test('testAvailable', t('yup_url'), function (value) {
              if (!value) {
                return true;
              } else {
                return value.match(reg.regSimpleUrl);
              }
            })
            .when('integration_environment', {
              is: (integration_environment) =>
                tenant.form_config.extra_fields[k].required.includes(
                  integration_environment
                ),
              then: yup.string().nullable().required(t('yup_required'))
            });
        }
      })
    )
  );

  const schema = yup.object({
    service_name: yup
      .string()
      .nullable()
      .min(4, t('yup_char_min') + ' (' + 2 + ')')
      .max(256, t('yup_char_max') + ' (' + 256 + ')')
      .required(t('yup_required')),
    policy_uri: yup
      .string()
      .nullable()
      .when('integration_environment', {
        is: (integrationEnvironment) =>
          tenant.form_config.more_info.policy_uri?.required?.includes(
            integrationEnvironment
          ),
        then: yup
          .string()
          .nullable()
          .required(t('yup_required'))
          .matches(reg.regSimpleUrl, t('yup_url')),
        otherwise: yup.string().nullable().matches(reg.regSimpleUrl, t('yup_url'))
      }),
    website_url: yup.string().nullable().matches(reg.regSimpleUrl, t('yup_url')),
    client_id: yup
      .string()
      .nullable()
      .when('protocol', {
        is: 'oidc',
        then: yup
          .string()
          .nullable()
          .min(4, t('yup_char_min') + ' (' + 2 + ')')
          .max(128, t('yup_char_max') + ' (' + 128 + ')')
          .matches(
            reg.regClientId,
            "Client Id can contain only numbers, letters and the special characters \"$-_.+!*'(),\""
          )
          .test('testAvailable', t('yup_client_id_available'), function (value) {
            if (props.initialValues.client_id === value && !props.copy) {
              return true;
            } else {
              return new Promise((resolve, reject) => {
                clearTimeout(availabilityCheckTimeout);
                if (!value) {
                  resolve(true);
                } else {
                  if (
                    value === checkedId &&
                    formRef.current.values.integration_environment ===
                      checkedEnvironment
                  ) {
                    resolve(availabilityCheck);
                  } else {
                    setCheckingAvailability(true);
                    availabilityCheckTimeout = setTimeout(() => {
                      fetch(
                        config.host[tenant_name] +
                          'tenants/' +
                          tenant_name +
                          '/check-availability?value=' +
                          value +
                          '&protocol=oidc&environment=' +
                          this.parent.integration_environment +
                          (petition_id ? '&petition_id=' + petition_id : '') +
                          (service_id ? '&service_id=' + service_id : ''),
                        {
                          method: 'GET',
                          credentials: 'include',
                          headers: {
                            'Content-Type': 'application/json'
                          }
                        }
                      )
                        .then((response) => {
                          if (response.status === 200 || response.status === 304) {
                            return response.json();
                          } else {
                            return false;
                          }
                        })
                        .then((response) => {
                          setCheckedId(value);
                          setCheckingAvailability(false);
                          setCheckedEnvironment(this.parent.integration_environment);
                          if (response) {
                            setCheckedId(value);
                            setAvailabilityCheck(response.available);
                            resolve(response.available);
                          } else {
                            resolve(false);
                          }
                        })
                        .catch(() => {
                          resolve(true);
                        });
                    }, 1000);
                  }
                }
              });
            }
          })
      }),
    redirect_uris: yup
      .array()
      .nullable()
      .when('protocol', {
        is: 'oidc',
        then: yup
          .array()
          .nullable()
          .when('integration_environment', (integration_environment) => {
            integrationEnvironment = integration_environment;
          })
          .when('application_type', (application_type_value) => {
            application_type = application_type_value;
          })
          .of(
            yup
              .string()
              .required("Uri can't be an empty string")
              .test('test_redirect_uri', 'Invalid Redirect Uri', function (value) {
                if (value) {
                  let url;
                  if (tenant?.config?.test_env.includes(integrationEnvironment)) {
                    let isLocalIp =
                      reg.regIpv4Local.test(value) || reg.regIpv6Local.test(value);
                    if (isLocalIp) {
                      return true;
                    }
                  }
                  try {
                    url = new URL(value);
                  } catch (err) {
                    return this.createError({ message: 'Invalid uri' });
                  }
                  if (value.includes('#')) {
                    return this.createError({
                      message: "Uri can't contain fragments"
                    });
                  }
                  if (application_type === 'WEB') {
                    if (!tenant?.config?.test_env.includes(integrationEnvironment)) {
                      if (
                        url.protocol !== 'https:' &&
                        !(url.protocol === 'http:' && url.hostname === 'localhost')
                      ) {
                        return this.createError({
                          message:
                            'Uri must be a secure url starting with https://'
                        });
                      }
                    } else {
                      if (
                        url &&
                        !(url.protocol === 'http:' || url.protocol === 'https:')
                      ) {
                        return this.createError({
                          message: 'Uri must be a url starting with http(s):// '
                        });
                      }
                    }
                  } else {
                    if (url.protocol === 'javascript:') {
                      return this.createError({
                        message: "Uri can't be of schema 'javascript:'"
                      });
                    } else if (url.protocol === 'data:') {
                      return this.createError({
                        message: "Uri can't be of schema 'data:'"
                      });
                    }
                  }
                  if (value.includes('*')) {
                    return this.createError({
                      message: "Uri can't contain wildcard character '*'"
                    });
                  }
                  if (value.includes(' ')) {
                    return this.createError({
                      message: "Uri can't contain spaces"
                    });
                  }
                  return true;
                }
              })
          )
          .unique(t('yup_redirect_uri_unique'))
          .when('grant_types', {
            is: (grant_types) =>
              grant_types?.includes('implicit') ||
              grant_types?.includes('authorization_code'),
            then: yup
              .array()
              .min(1, t('yup_required'))
              .nullable()
              .required(t('yup_required'))
          })
      }),
    post_logout_redirect_uris: yup
      .array()
      .nullable()
      .when('protocol', {
        is: 'oidc',
        then: yup
          .array()
          .nullable()
          .when('integration_environment', (integration_environment) => {
            integrationEnvironment = integration_environment;
          })
          .when('application_type', (application_type_value) => {
            application_type = application_type_value;
          })
          .of(
            yup
              .string()
              .required("Uri can't be an empty string")
              .test('test_redirect_uri', 'Invalid Post Logout Redirect Uri', function (
                value
              ) {
                if (value) {
                  let url;
                  if (tenant?.config?.test_env.includes(integrationEnvironment)) {
                    let isLocalIp =
                      reg.regIpv4Local.test(value) || reg.regIpv6Local.test(value);
                    if (isLocalIp) {
                      return true;
                    }
                  }
                  try {
                    url = new URL(value);
                  } catch (err) {
                    return this.createError({ message: 'Invalid uri' });
                  }
                  if (value.includes('#')) {
                    return this.createError({
                      message: "Uri can't contain fragments"
                    });
                  }
                  if (application_type === 'WEB') {
                    if (!tenant?.config?.test_env.includes(integrationEnvironment)) {
                      if (
                        url.protocol !== 'https:' &&
                        !(url.protocol === 'http:' && url.hostname === 'localhost')
                      ) {
                        return this.createError({
                          message:
                            'Uri must be a secure url starting with https://'
                        });
                      }
                    } else {
                      if (
                        url &&
                        !(url.protocol === 'http:' || url.protocol === 'https:')
                      ) {
                        return this.createError({
                          message: 'Uri must be a url starting with http(s):// '
                        });
                      }
                    }
                  } else {
                    if (url.protocol === 'javascript:') {
                      return this.createError({
                        message: "Uri can't be of schema 'javascript:'"
                      });
                    } else if (url.protocol === 'data:') {
                      return this.createError({
                        message: "Uri can't be of schema 'data:'"
                      });
                    }
                  }
                  if (value.includes('*')) {
                    return this.createError({
                      message: "Uri can't contain wildcard character '*'"
                    });
                  }
                  if (value.includes(' ')) {
                    return this.createError({
                      message: "Uri can't contain spaces"
                    });
                  }
                  return true;
                }
              })
          )
          .unique(t('yup_redirect_uri_unique'))
      }),
    logo_uri: yup
      .string()
      .nullable()
      .matches(reg.regUrl, 'Logo must be be a secure url starting with https://')
      .test('testImage', t('yup_image_url'), function (imageUrl) {
        imageExists(imageUrl);
        if (imageUrl && imageUrl.length > 6000) {
          return this.createError({
            message: 'Logo exceeds maximum character limit (6000)'
          });
        }
        return true;
      }),
    country: yup
      .string()
      .nullable()
      .when('integration_environment', {
        is: (integration_environment) =>
          tenant?.form_config?.more_info?.country?.required.includes(
            integration_environment
          ),
        then: yup
          .string()
          .test('testCountry', 'Select one of the available options', function (
            value
          ) {
            return countries.includes(value);
          })
          .required(t('yup_required')),
        otherwise: yup.string().nullable()
      }),
    service_description: yup
      .string()
      .nullable()
      .required(t('yup_required'))
      .max(1000, 'Exceeded maximum characters (1000)'),
    requested_attributes: yup
      .array()
      .nullable()
      .of(
        yup.object().shape({
          name: yup
            .string()
            .nullable()
            .required(t('yup_required'))
            .min(1, t('yup_required'))
            .max(512, 'Exceeded maximum characters (512)'),
          friendly_name: yup
            .string()
            .test('testAttributeName', 'invalid_name', function (friendly_name) {
              return tenant.form_config.requested_attributes.some(
                (e) => e.friendly_name === friendly_name
              );
            })
        })
      ),
    contacts: yup
      .array()
      .min(1, t('yup_required'))
      .nullable()
      .of(
        yup.object().shape({
          email: yup.string().email(t('yup_email')).required(t('yup_contact_empty')),
          type: yup.string().required(t('yup_required'))
        })
      )
      .test('testContacts', function (contacts) {
        let errors = '';
        if (!contacts) return true;
        tenant.form_config.contact_requirements.forEach((requirement) => {
          let type_array = requirement.type.split(' ');
          let requirement_met = false;
          contacts.forEach((contact) => {
            if (type_array.includes(contact.type)) {
              requirement_met = true;
            }
          });
          if (!requirement_met) {
            errors =
              errors.length > 0 ? errors + '\n' : errors;
            errors += requirement.error;
          }
        });
        if (errors.length > 0) {
          return this.createError({ message: errors });
        } else {
          return true;
        }
      })
      .test('testContacts', t('yup_contact_unique'), function (value) {
        const array = [];
        value.map((s) => array.push(s.email + s.type));
        const unique = array.filter((v, i, a) => a.indexOf(v) === i);
        if (unique.length === array.length) {
          return true;
        } else {
          return false;
        }
      })
      .required(t('yup_required')),
    scope: yup
      .array()
      .nullable()
      .when(['protocol', 'grant_types'], {
        is: (protocol, grant_types) => protocol === 'oidc' && grant_types?.length > 0,
        then: yup
          .array()
          .min(1, t('yup_select_option'))
          .nullable()
          .of(
            yup
              .string()
              .required('Scope value cannot be empty')
              .min(1, t('yup_scope'))
              .max(256, t('yup_char_max') + ' (' + 256 + ')')
              .matches(reg.regScope, t('yup_scope_reg'))
          )
          .unique(t('yup_scope_unique'))
          .required(t('yup_required'))
      }),
    grant_types: yup
      .array()
      .nullable()
      .when('protocol', {
        is: 'oidc',
        then: yup
          .array()
          .nullable()
          .of(
            yup.string().test('testGrantTypes', 'error-grant-types', function (
              value
            ) {
              return tenant.form_config.grant_types.includes(value);
            })
          )
      }),
    id_token_timeout_seconds: yup
      .number()
      .nullable()
      .when('protocol', {
        is: 'oidc',
        then: yup
          .number()
          .nullable()
          .min(1, 'Must be a positive value greater that 0')
          .max(tenant.form_config.id_token_timeout_seconds, t('yup_exceeds_max'))
          .required('This is a required field')
      }),
    access_token_validation_model: yup
      .string()
      .nullable()
      .when('protocol', {
        is: 'oidc',
        then: yup
          .string()
          .nullable()
          .oneOf(['OFFLINE_VERIFIABLE', 'ONLINE_VALIDATION_REQUIRED'])
          .required('This is a required field')
      }),
    access_token_validity_seconds: yup
      .number()
      .nullable()
      .when('protocol', {
        is: 'oidc',
        then: yup
          .number()
          .nullable()
          .min(
            tenant.form_config.more_info?.access_token_validity_seconds?.min ?? 1,
            t('yup_below_min')
          )
          .test(
            'access-token-max-by-validation-model',
            t('yup_exceeds_max'),
            function (value) {
              if (
                value === null ||
                value === undefined ||
                value === ''
              ) {
                return true;
              }

              const validationModel =
                this.parent.access_token_validation_model ||
                'OFFLINE_VERIFIABLE';

              const max =
                tenant.form_config.more_info?.access_token_validity_seconds
                  ?.max?.[validationModel] ??
                tenant.form_config.more_info?.access_token_validity_seconds?.max
                  ?.OFFLINE_VERIFIABLE ??
                tenant.form_config.access_token_validity_seconds ??
                21600;

              return Number(value) <= Number(max);
            }
          )
          .required('This is a required field')
      }),
    refresh_token_validity_seconds: yup
      .number()
      .nullable()
      .when(['scope', 'protocol'], {
        is: (scope, protocol) =>
          protocol === 'oidc' && scope?.includes('offline_access'),
        then: yup
          .number()
          .nullable()
          .min(
            tenant.form_config.more_info?.refresh_token_validity_seconds?.min ?? 1,
            t('yup_below_min')
          )
          .max(
            tenant.form_config.more_info?.refresh_token_validity_seconds?.max ??
              tenant.form_config.refresh_token_validity_seconds ??
              34560000,
            t('yup_exceeds_max')
          )
          .required(
            'This field is required when the offline_access is selected'
          )
      }),
    device_code_validity_seconds: yup
      .number()
      .nullable()
      .when(['protocol', 'grant_types'], {
        is: (protocol, grant_types) =>
          protocol === 'oidc' &&
          grant_types?.includes('urn:ietf:params:oauth:grant-type:device_code'),
        then: yup
          .number()
          .nullable()
          .min(0)
          .max(tenant.form_config.device_code_validity_seconds, t('yup_exceeds_max'))
          .required(
            'This is a required field when the device code grant type is selected'
          )
      }),
    code_challenge_method: yup
      .string()
      .nullable()
      .when('protocol', {
        is: 'oidc',
        then: yup
          .string()
          .nullable()
          .test('test_code_challenge_method', 'Invalid Value', function (value) {
            if (!value) {
              return true;
            } else {
              return tenant.form_config.code_challenge_method.includes(value);
            }
          })
      })
      .when(['token_endpoint_auth_method', 'grant_types'], {
        is: (token_endpoint_auth_method, grant_types) =>
          token_endpoint_auth_method === 'none' &&
          grant_types.includes('authorization_code'),
        then: yup
          .string()
          .nullable()
          .test(
            'extra_validation',
            'PKCE must be enabled when no authentication is selected for the authorization code grant type.',
            function (value) {
              return value;
            }
          )
      }),
    allow_introspection: yup
      .boolean()
      .nullable()
      .when('protocol', {
        is: 'oidc',
        then: yup.boolean().required()
      }),
    generate_client_secret: yup
      .boolean()
      .nullable()
      .when('protocol', {
        is: 'oidc',
        then: yup.boolean().required()
      }),
    reuse_refresh_token: yup
      .boolean()
      .nullable()
      .when('protocol', {
        is: 'oidc',
        then: yup.boolean().nullable().required()
      }),
    protocol: yup
      .string()
      .test('testProtocol', t('yup_protocol'), function (value) {
        return ['saml', 'oidc'].includes(value);
      })
      .required(t('yup_protocol')),
    integration_environment: yup
      .string()
      .test('testIntegrationEnv', 'Invalid Value', function (value) {
        return tenant.form_config.integration_environment.includes(value);
      })
      .required(t('yup_select_option')),
    clear_access_tokens_on_refresh: yup
      .boolean()
      .nullable()
      .when('protocol', {
        is: 'oidc',
        then: yup.boolean().nullable().required()
      }),
    client_secret: yup
      .string()
      .nullable()
      .when('protocol', {
        is: 'oidc',
        then: yup
          .string()
          .nullable()
          .when(['generate_client_secret', 'token_endpoint_auth_method'], {
            is: (generate_client_secret, token_endpoint_auth_method) =>
              generate_client_secret === false &&
              !(
                token_endpoint_auth_method === 'private_key_jwt' ||
                token_endpoint_auth_method === 'none'
              ),
            then: yup
              .string()
              .nullable()
              .required(t('yup_required'))
              .min(4, t('yup_char_min') + ' (' + 4 + ')')
              .max(256, t('yup_char_max') + ' (' + 256 + ')')
          })
          .nullable()
      }),
    metadata_url: yup
      .string()
      .nullable()
      .when('protocol', {
        is: 'saml',
        then: yup
          .string()
          .nullable()
          .required(t('yup_required'))
          .matches(reg.regSimpleUrl, 'Enter a valid Url')
          .test('testXml', 'Invalid Metadata', function (value) {
            if (
              value &&
              value.match(reg.regSimpleUrl) &&
              metadataChecked !== value &&
              value !== metadataLoaded.metadata_url
            ) {
              clearTimeout(timeouts[timeoutId]);
              new Promise((resolve, reject) => {
                getMetadata(value, resolve);
              });
            } else {
              setMetadataLoading(false);
            }
            if (metadataAsyncError) {
              return this.createError({ message: metadataAsyncError });
            }
            return true;
          })
      }),
    token_endpoint_auth_signing_alg: yup
      .string()
      .nullable()
      .when(['protocol', 'token_endpoint_auth_method'], {
        is: (protocol, token_endpoint_auth_method) =>
          protocol === 'oidc' &&
          (token_endpoint_auth_method === 'private_key_jwt' ||
            token_endpoint_auth_method === 'client_secret_jwt'),
        then: yup
          .string()
          .required(t('yup_select_option'))
          .test(
            'testTokenEndpointSigningAlgorithm',
            'Invalid Value',
            function (value) {
              return tenant.form_config.token_endpoint_auth_signing_alg.includes(
                value
              );
            }
          )
      }),
    application_type: yup
      .string()
      .nullable()
      .when('protocol', {
        is: 'oidc',
        then: yup
          .string()
          .nullable()
          .required(t('yup_select_option'))
          .test('testApplicationType', 'Invalid Value', function (value) {
            return tenant.form_config.application_type.includes(value);
          })
      }),
    token_endpoint_auth_method: yup
      .string()
      .nullable()
      .when('protocol', {
        is: 'oidc',
        then: yup
          .string()
          .nullable()
          .required(t('yup_select_option'))
          .test('testTokenEndpointAuthMethod', 'Invalid Value', function (value) {
            return tenant.form_config.token_endpoint_auth_method.includes(value);
          })
      }),
    jwks_uri: yup
      .string()
      .nullable()
      .when(['protocol', 'token_endpoint_auth_method'], {
        is: (protocol, token_endpoint_auth_method) =>
          protocol === 'oidc' &&
          token_endpoint_auth_method === 'private_key_jwt',
        then: yup
          .string()
          .nullable()
          .test('test', 'Required Field', function (value) {
            if (this.parent.jwks || value) {
              return true;
            } else {
              return false;
            }
          })
          .test('testTokenEndpointAuthMethod', 'Invalid Value', function (value) {
            if (
              this.parent.jwks ||
              (value && reg.regSimpleUrl.test(value))
            ) {
              return true;
            } else {
              return false;
            }
          })
      }),
    jwks: yup
      .object()
      .typeError('test')
      .nullable()
      .when(['protocol', 'jwks_uri', 'token_endpoint_auth_method'], {
        is: (protocol, jwks_uri, token_endpoint_auth_method) =>
          protocol === 'oidc' &&
          !jwks_uri &&
          token_endpoint_auth_method === 'private_key_jwt',
        then: yup
          .object()
          .nullable()
          .test('test', 'Required Field', function (value) {
            if (this.parent.jwks_uri || value) {
              return true;
            } else {
              return false;
            }
          })
          .test('testJwks', 'Invalid Schema', function (value) {
            if (!value) {
              return true;
            } else if (
              value.keys &&
              typeof value.keys === 'object' &&
              Object.keys(value).length === 1
            ) {
              return true;
            } else {
              return false;
            }
          })
      }),
    organization_name: yup
      .string()
      .nullable()
      .when(['integration_environment'], {
        is: (integration_environment) =>
          tenant.form_config.extra_fields.organization.required.includes(
            integration_environment
          ),
        then: yup.string().nullable().required('This is a required field')
      }),
    organization_url: yup
      .string()
      .nullable()
      .nullable()
      .when(['integration_environment'], {
        is: (integration_environment) =>
          tenant.form_config.extra_fields.organization.required.includes(
            integration_environment
          ),
        then: yup
          .string()
          .nullable()
          .matches(reg.regSimpleUrl, t('yup_secure_url'))
          .required('This is a required field')
      }),
    entity_id: yup
      .string()
      .matches(reg.regUrl, t('yup_secure_url'))
      .nullable()
      .when('protocol', {
        is: 'saml',
        then: yup
          .string()
          .nullable()
          .required('This is a required field')
          .min(4, t('yup_char_min') + ' (' + 4 + ')')
          .test('testAvailable', t('yup_entity_id'), function (value) {
            if (props.initialValues.entity_id === value && !props.copy) {
              return true;
            } else {
              return new Promise((resolve, reject) => {
                clearTimeout(availabilityCheckTimeout);
                if (!value || !reg.regUrl.test(value)) {
                  resolve(true);
                } else {
                  setCheckingAvailability(true);
                  if (
                    value === checkedId &&
                    formRef.current.values.integration_environment ===
                      checkedEnvironment
                  ) {
                    setCheckingAvailability(false);
                    resolve(availabilityCheck);
                  } else {
                    availabilityCheckTimeout = setTimeout(() => {
                      fetch(
                        config.host[tenant_name] +
                          'tenants/' +
                          tenant_name +
                          '/check-availability?value=' +
                          value +
                          '&protocol=saml&environment=' +
                          this.parent.integration_environment +
                          (petition_id ? '&petition_id=' + petition_id : '') +
                          (service_id ? '&service_id=' + service_id : ''),
                        {
                          method: 'GET',
                          credentials: 'include',
                          headers: {
                            'Content-Type': 'application/json'
                          }
                        }
                      )
                        .then((response) => {
                          if (response.status === 200) {
                            return response.json();
                          } else {
                            return false;
                          }
                        })
                        .then((response) => {
                          setCheckedId(value);
                          setCheckedEnvironment(
                            this.parent.integration_environment
                          );
                          setCheckingAvailability(false);
                          if (response) {
                            setCheckedId(value);
                            setAvailabilityCheck(response.available);
                            resolve(response.available);
                          } else {
                            resolve(false);
                          }
                        })
                        .catch(() => {
                          resolve(true);
                        });
                    }, 1000);
                  }
                }
              });
            }
          })
      })
  });

  const toggleCopyDialog = () => {
    setShowCopyDialog(!showCopyDialog);
  };

  const toggleMoveDialog = () => {
    setShowMoveDialog(!showMoveDialog);
  };

  const canReview = (integration_environment) => {
    return (
      (props.user.actions.includes('review_restricted') &&
        tenant?.config?.restricted_env.includes(integration_environment)) ||
      (tenant?.config?.test_env.includes(integration_environment) &&
        props.user.actions.includes('review_own_petition')) ||
      (props.user.actions.includes('review_petition') &&
        !tenant?.config?.restricted_env.includes(integration_environment))
    );
  };

  const createNewPetition = (petition) => {
    if (service_id) {
      petition.type = 'edit';
      petition.service_id = service_id;
    } else {
      petition.type = 'create';
      petition.service_id = null;
    }
    if (diff(petition, props.initialValues) || props.copy) {
      setAsyncResponse(true);
      fetch(config.host[tenant_name] + 'tenants/' + tenant_name + '/petitions', {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(petition)
      })
        .then(async (response) => {
          setAsyncResponse(false);
          let responseData = await response.json();
          if (response.status === 200) {
            let reviewEnabled = canReview(petition.integration_environment);
            setModalData({
              title: t('new_petition_title'),
              message: reviewEnabled
                ? t('petition_success_review_msg')
                : t('petition_success_msg'),
              service_id: service_id,
              tenant: tenant_name,
              petition_id: responseData.id,
              reviewEnabled
            });
          } else if (response.status === 401) {
            setLogout(true);
          } else {
            setModalData({
              title: t('new_petition_title'),
              message: t('petition_error_msg') + response.status,
              tenant: tenant_name,
              reviewEnabled: false
            });
          }
        })
        .catch(() => {
          setAsyncResponse(false);
        });
    } else {
      setAsyncResponse(false);
      setModalData({
        title: t('petition_no_change_title'),
        message: t('petition_no_change_msg'),
        tenant: tenant_name,
        reviewEnabled: false
      });
    }
  };

  const editPetition = (petition) => {
    petition.type = props.type;
    petition.service_id = service_id;
    if (props.type === 'delete') {
      petition.type = 'edit';
    }
    if (diff(petition, props.initialValues)) {
      setAsyncResponse(true);
      fetch(
        config.host[tenant_name] +
          'tenants/' +
          tenant_name +
          '/petitions/' +
          petition_id,
        {
          method: 'PUT',
          credentials: 'include',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(petition)
        }
      )
        .then(async (response) => {
          setAsyncResponse(false);
          let reviewEnabled = canReview(petition.integration_environment);
          if (response.status === 200) {
            setModalData({
              title: t('edit_petition_title'),
              message: reviewEnabled
                ? t('petition_success_review_msg')
                : t('petition_success_msg'),
              service_id: service_id,
              tenant: tenant_name,
              petition_id: petition_id,
              reviewEnabled
            });
          } else if (response.status === 401) {
            setLogout(true);
          } else if (response.status === 404) {
            setNotFound(true);
          } else {
            setModalData({
              title: t('new_petition_title'),
              message: t('petition_error_msg') + response.status,
              tenant: tenant_name,
              reviewEnabled: false
            });
          }
        })
        .catch(() => {
          setAsyncResponse(false);
        });
    } else {
      setModalData({
        title: t('petition_no_change_title'),
        message: t('petition_no_change_msg'),
        tenant: tenant_name,
        reviewEnabled: false
      });
    }
  };

  const deletePetition = () => {
    setAsyncResponse(true);
    fetch(config.host[tenant_name] + 'tenants/' + tenant_name + '/petitions/' + petition_id, {
      method: 'DELETE',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json'
      }
    })
      .then((response) => {
        setAsyncResponse(false);
        if (response.status === 200) {
          setModalData({
            title: t('request_submit_title'),
            message: t('request_cancel_success_msg'),
            tenant: tenant_name,
            reviewEnabled: false
          });
        } else if (response.status === 401) {
          setLogout(true);
        } else if (response.status === 404) {
          setNotFound(true);
        } else {
          setModalData({
            title: t('request_submit_title'),
            message: t('request_cancel_fail_msg') + response.status,
            tenant: tenant_name,
            reviewEnabled: false
          });
        }
      })
      .catch(() => {
        setAsyncResponse(false);
      });
  };

  const addOrganization = async (data) => {
    if (!data.organization_id) {
      return await fetch(
        config.host[tenant_name] + 'tenants/' + tenant_name + '/organizations',
        {
          method: 'POST',
          credentials: 'include',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            organization_name: data.organization_name,
            organization_url: data.organization_url,
            ror_id: data.ror_id
          })
        }
      )
        .then((response) => {
          if (response.status === 200 || response.status === 409) {
            return response.json();
          } else if (response.status === 401) {
            setLogout(true);
          } else {
            return false;
          }
        })
        .then((response) => {
          if (response) {
            return response.organization_id;
          } else {
            return response;
          }
        });
    } else {
      return data.organization_id;
    }
  };

  const getTags = () => {
    fetch(config.host[tenant_name] + 'tenants/' + tenant_name + '/tags/services/' + service_id, {
      method: 'GET',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json'
      }
    })
      .then((response) => {
        if (response.status === 200) {
          return response.json();
        } else if (response.status === 401) {
          setLogout(true);
        } else {
          return false;
        }
      })
      .then((response) => {
        if (response) {
          setServiceTags(response);
        } else {
          setServiceTags([]);
        }
      });
  };

  const reviewPetition = (comment, type) => {
    setAsyncResponse(true);
    fetch(
      config.host[tenant_name] +
        'tenants/' +
        tenant_name +
        '/petitions/' +
        petition_id +
        '/review',
      {
        method: 'PUT',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ comment: comment, type: type })
      }
    )
      .then((response) => {
        setAsyncResponse(false);
        if (response.status === 200) {
          setModalData({
            title: t('review_' + props.type + '_title'),
            tenant: tenant_name,
            message: t('review_success'),
            reviewEnabled: false
          });
        } else if (response.status === 401) {
          setLogout(true);
          return false;
        } else if (response.status === 404) {
          setNotFound(true);
          return false;
        } else {
          setModalData({
            title: t('review_' + props.type + '_title'),
            message: t('review_error') + response.status,
            tenant: tenant_name,
            reviewEnabled: false
          });
        }
      })
      .catch(() => {
        setAsyncResponse(false);
      });
  };

  const postApi = async (data) => {
    data = generateValues(data);
    let organization_id;
    let createOrganization;
    if (
      !tenant.form_config.extra_fields.organization.hide.includes(
        data.integration_environment
      ) &&
      data.organization_name &&
      data.organization_url
    ) {
      createOrganization = true;
      organization_id = await addOrganization(data);
      data.organization_id = organization_id;
    }
    if (organization_id || !createOrganization) {
      if (!props.type) {
        createNewPetition(data);
      } else {
        data.type = props.type;
        editPetition(data);
      }
    } else {
      setNotFound(true);
    }
  };

  const getInitialTouched = (initVal) => {
    let touchedActive = {};
    if (!(service_id || petition_id)) {
      return {};
    } else {
      for (const property in initVal) {
        touchedActive[property] = true;
      }
      for (const property in tenant.form_config.extra_fields) {
        if (!initVal.hasOwnProperty[property]) {
          touchedActive[property] = true;
        }
      }
      return touchedActive;
    }
  };

  const protocolOptions = (protocols) => {
    let options = [];
    protocols.forEach((protocol) => {
      options.push(protocol.toUpperCase() + ' Service');
    });
    return options;
  };

  const generateValues = (values) => {
    let result = { ...values };
    if (result.metadata_url && result.metadata_url !== '') {
      result.metadataUrl = result.metadata_url;
    }
    if (result.website_url && result.website_url !== '') {
      result.website = result.website_url;
    }
    if (result.policy_uri && result.policy_uri !== '') {
      result.policyUri = result.policy_uri;
    }
    if (result.organization_url && result.organization_url !== '') {
      result.organizationUrl = result.organization_url;
    }
    if (result.entity_id && result.entity_id !== '') {
      result.entityID = result.entity_id;
    }
    if (result.logo_uri && result.logo_uri !== '') {
      result.logoURI = result.logo_uri;
    }
    return result;
  };

  return (
    <React.Fragment>
      <Logout logout={logout} />
      <ManageTags
        manageTags={manageTags}
        setManageTags={setManageTags}
        tags={serviceTags}
        service_id={service_id}
        getServices={() => {
          getTags();
        }}
      />
      <NotFound notFound={notFound} />
      {formValues ? (
        <Formik
          initialValues={formValues}
          validateOnMount={service_id || petition_id || props.copy}
          initialTouched={getInitialTouched(formValues)}
          enableReinitialize={true}
          validationSchema={schema}
          innerRef={formRef}
          validate={dynamicValidation}
          onSubmit={(values, { setSubmitting }) => {
            setSubmitting(true);
            setHasSubmitted(true);
            setSubmitDisabled(true);
            if (
              !(
                values.token_endpoint_auth_method === 'client_secret_jwt' ||
                values.token_endpoint_auth_method === 'private_key_jwt'
              )
            ) {
              values.token_endpoint_auth_signing_alg = null;
            }
            if (values.token_endpoint_auth_method !== 'private_key_jwt') {
              values.jwks = null;
              values.jwks_uri = null;
            }
            if (
              values.token_endpoint_auth_method === 'private_key_jwt' ||
              values.token_endpoint_auth_method === 'none'
            ) {
              values.client_secret = '';
            }
            if (values.jwks_uri) {
              values.jwks = null;
            }
            if (values.jwks) {
              values.jwks = JSON.parse(values.jwks);
              values.jwks_uri = null;
            }
            postApi(values);
          }}
        >
          {({
            handleSubmit,
            handleChange,
            handleBlur,
            values,
            setFieldValue,
            setFieldTouched,
            setTouched,
            touched,
            isValid,
            validateField,
            validateForm,
            setValues,
            setErrors,
            submitCount,
            errors,
            isSubmitting
          }) => (
            <div className="tab-panel">
              {showCopyDialog ? (
                <CopyDialog
                  service_id={service_id}
                  show={showCopyDialog}
                  toggleCopyDialog={toggleCopyDialog}
                  current_environment={props.initialValues.integration_environment}
                />
              ) : null}
              {serviceMoveEnabled && showMoveDialog ? (
                <MoveDialog
                  service_id={service_id}
                  show={showMoveDialog}
                  toggleMoveDialog={toggleMoveDialog}
                  current_environment={props.initialValues.integration_environment}
                />
              ) : null}
              <ProcessingRequest active={asyncResponse} />
              {props.user.actions.includes('manage_tags') && service_id ? (
                <div className="service-form-tags-container">
                  <hr />
                  <h5>Tags</h5>
                  <OverlayTrigger
                    placement="top"
                    overlay={
                      <Tooltip id={`tooltip-top`}>
                        Manage Service Tags
                      </Tooltip>
                    }
                  >
                    <div
                      className="service-form-tags-edit"
                      onClick={() => {
                        setManageTags(true);
                      }}
                    >
                      <FontAwesomeIcon icon={faPen} />
                    </div>
                  </OverlayTrigger>
                  <Form.Text className="text-mute">
                    {' '}
                    Tags can be used to filter service search results{' '}
                  </Form.Text>
                  <div className="service-form-tags-button-container">
                    {serviceTags.length > 0 ? (
                      serviceTags.map((tag, index) => {
                        return (
                          <Button
                            key={index}
                            className="tag-button-service-form"
                            disabled
                            variant="outline-dark"
                          >
                            {tag}
                          </Button>
                        );
                      })
                    ) : (
                      <span className="text-muted">
                        No active tags for this service
                      </span>
                    )}
                  </div>
                  <hr />
                </div>
              ) : null}
              {showInitErrors && !Object.keys(errors).length === 0 ? (
                <Alert variant="warning" className="invitation_alert">
                  The following Service Configuration contains some invalid
                  values or is missing a required field. To fix this issue submit
                  a valid reconfiguration request
                </Alert>
              ) : null}
              <Form noValidate onSubmit={handleSubmit}>
                {props.disabled ? null : (
                  <div className="form-controls-container">
                    {props.review ? (
                      <ReviewComponent
                        errors={errors}
                        asyncErrors={metadataAsyncError}
                        disabled={metadataLoading}
                        values={values}
                        changes={props.changes}
                        reviewPetition={reviewPetition}
                        type={props.type}
                        restrictReview={restrictReview}
                      />
                    ) : (
                      <React.Fragment>
                        <div className="form-submit-cancel-container">
                          <Button
                            className="submit-button"
                            type="submit"
                            disabled={
                              submitDisabled ||
                              metadataLoading ||
                              checkingAvailability
                            }
                            variant="primary"
                          >
                            <FontAwesomeIcon icon={faCheckCircle} />
                            {t('button_submit')}
                          </Button>
                          {petition_id ? (
                            <Button
                              variant="danger"
                              onClick={() => deletePetition()}
                            >
                              <FontAwesomeIcon icon={faBan} />
                              {t('button_cancel_request')}
                            </Button>
                          ) : null}
                        </div>
                      </React.Fragment>
                    )}
                  </div>
                )}

                {/* Refactored: Tabs rendered via ServiceFormTabs component */}
                <ServiceFormTabs
                  disabled={disabled}
                  changes={props.changes}
                  extraFields={tenant.form_config.extra_fields || {}}
                />

                {props.disabled ? null : (
                  <div className="form-controls-container">
                    {props.review ? (
                      <ReviewComponent
                        errors={errors}
                        disabled={metadataLoading}
                        asyncErrors={metadataAsyncError}
                        values={values}
                        changes={props.changes}
                        type={props.type}
                        reviewPetition={reviewPetition}
                        restrictReview={restrictReview}
                      />
                    ) : (
                      <React.Fragment>
                        <div className="form-submit-cancel-container">
                          <Button
                            className="submit-button"
                            type="submit"
                            disabled={
                              submitDisabled ||
                              metadataLoading ||
                              checkingAvailability
                            }
                            variant="primary"
                          >
                            <FontAwesomeIcon icon={faCheckCircle} />
                            Submit
                          </Button>
                          {props.type === 'delete' ||
                          props.type === 'edit' ? (
                            <Button
                              variant="danger"
                              onClick={() => deletePetition()}
                            >
                              <FontAwesomeIcon icon={faBan} />
                              Cancel Request
                            </Button>
                          ) : null}
                        </div>
                      </React.Fragment>
                    )}
                  </div>
                )}
                <PetitionSubmittedModal
                  modalData={modalData}
                  setModalData={setModalData}
                />
                <SimpleModal
                  isSubmitting={isSubmitting}
                  isValid={!Object.keys(errors).length}
                />
              </Form>
            </div>
          )}
        </Formik>
      ) : null}
    </React.Fragment>
  );
};

const ReviewComponent = (props) => {
  const [type, setType] = useState();
  const [expand, setExpand] = useState(false);
  const [error, setError] = useState(false);
  const [comment, setComment] = useState();
  const [invalidPetition, setInvalidPetition] = useState(false);
  const { t, i18n } = useTranslation();

  useEffect(() => {
    let invalid = false;
    for (const attribute in props.errors) {
      if (Array.isArray(props.errors[attribute])) {
        for (let i = 0; i < props.errors[attribute].length; i++) {
          if (
            props.errors[attribute][i] &&
            !props.changes[attribute].D.includes(props.values[attribute][i])
          ) {
            invalid = true;
          }
        }
      } else {
        invalid = true;
      }
    }
    setInvalidPetition(invalid || !!props.asyncErrors);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [props.errors]);

  const handleReview = () => {
    if (expand) {
      if (type) {
        if ((type === 'changes' && comment) || type !== 'changes') {
          props.reviewPetition(comment, type);
        } else {
          setError(t('review_comment_required_msg'));
        }
      } else {
        setError(t('review_select_option_msg'));
      }
    } else {
      setError(false);
      setExpand(true);
    }
  };

  return (
    <React.Fragment>
      <Row className="review-button-row">
        <ButtonGroup>
          <Button
            className="review-button"
            disabled={expand && props.disabled}
            variant="success"
            onClick={() => handleReview()}
          >
            {expand ? t('review_submit') : <React.Fragment>{t('review')}
              <FontAwesomeIcon icon={faSortDown} />
            </React.Fragment>}
          </Button>
          {expand ? (
            <Button
              variant="success"
              className="review-button-expand"
              onClick={() => setExpand(!expand)}
            >
              <FontAwesomeIcon icon={faSortDown} />
            </Button>
          ) : null}
        </ButtonGroup>
      </Row>
      {expand ? (
        <Collapse in={expand}>
          <div>
            <div className="review-collapse-container">
              <Form.Group>
                <Form.Label>Review Type</Form.Label>
                <Form.Control
                  as="select"
                  value={type ? type : ''}
                  onChange={(e) => setType(e.target.value)}
                  isInvalid={error && !invalidPetition}
                  disabled={props.disabled}
                >
                  <option value="">Select an option</option>
                  <option value="changes">Changes</option>
                  <option value="approved">Approved</option>
                  <option value="rejected">Rejected</option>
                </Form.Control>
                <Form.Text className="text-muted">
                  Select the type of review you want to submit
                </Form.Text>
              </Form.Group>
              {type === 'changes' ? (
                <Form.Group>
                  <Form.Label>Comment</Form.Label>
                  <Form.Control
                    as="textarea"
                    rows={3}
                    value={comment ? comment : ''}
                    onChange={(e) => setComment(e.target.value)}
                    isInvalid={error && invalidPetition}
                    disabled={props.disabled}
                  />
                  <Form.Text className="text-muted">
                    Describe the changes that need to be made
                  </Form.Text>
                </Form.Group>
              ) : null}
              {error ? <Alert variant="danger">{error}</Alert> : null}
              <Button
                variant="success"
                onClick={() => handleReview()}
                disabled={props.disabled || (type === 'changes' && !comment)}
              >
                Submit Review
              </Button>
            </div>
          </div>
        </Collapse>
      ) : null}
    </React.Fragment>
  );
};

const UrlWarning = (props) => {
  const [active, setActive] = useState(!!props.overwriteWarning);

  useEffect(() => {
    if (!props.overwriteWarning) {
      setActive(false);
      clearTimeout(urlCheckTimeout);
      if (props.touched && props.url && reg.regSimpleUrl.test(props.url)) {
        const exists = async (url) => {
          const result = await fetch(url, {
            method: 'HEAD',
            mode: 'no-cors'
          });
          return result.ok;
        };
        urlCheckTimeout = setTimeout(() => {
          urlCheckTimeoutResponse = setTimeout(() => {
            setActive(true);
            clearTimeout(urlCheckTimeout);
          }, 3000);
          exists(props.url).then((result) => {
            clearTimeout(urlCheckTimeoutResponse);
            setActive(false);
          }).catch((err) => {
            clearTimeout(urlCheckTimeoutResponse);
            setActive(true);
          });
        }, 1000);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [props.url, props.touched]);

  return (
    <React.Fragment>
      {(active && !props.disableCheck) || props.overwriteWarning ? (
        <div className="pkce-tooltip">
          <FontAwesomeIcon icon={faExclamationTriangle} />
          {props.overwriteWarning
            ? props.overwriteWarning
            : 'The provided url does not seem to exist'}
        </div>
      ) : null}
    </React.Fragment>
  );
};

const generateInput = (props) => {
  return (
    <React.Fragment>
      {props.field_data.type === 'boolean' ? (
        <InputRow
          moreInfo={props.tenant.form_config.more_info[props.field_data.name]}
          title={props.field_data.title}
          key={props.field_data.name}
          required={props.field_data.required.includes(
            props.values.integration_environment
          )}
          error={props.errors[props.field_data.name]
            ? props.errors[props.field_data.name]
            : null}
          touched={props.touched[props.field_data.name]}
        >
          <SimpleCheckbox
            name={props.field_data.name}
            label={
              <React.Fragment>
                {parse(props.field_data.desc)}
              </React.Fragment>
            }
            moreinfo={props.tenant.form_config.more_info[props.field_data.name]}
            onChange={props.handleChange}
            disabled={
              props.disabled ||
              (props.field_data.tag === 'once' &&
                props.initialValues[props.field_data.name])
            }
            value={props.values[props.field_data.name]}
            onBlur={props.handleBlur}
            changed={props.changes ? props.changes[props.field_data.name] : null}
          />
        </InputRow>
      ) : props.field_data.type === 'string' ? (
        <InputRow
          description={props.field_data.desc}
          moreInfo={props.tenant.form_config.more_info[props.field_data.name]}
          title={props.field_data.title}
          key={props.field_data.name}
          required={props.field_data.required.includes(
            props.values.integration_environment
          )}
          error={props.errors[props.field_data.name]
            ? props.errors[props.field_data.name]
            : null}
          touched={props.touched[props.field_data.name]}
        >
          <SimpleInput
            name={props.field_data.name}
            placeholder={props.field_data.placeholder}
            onChange={props.handleChange}
            value={props.values[props.field_data.name]}
            isInvalid={props.hasSubmitted
              ? !!props.errors[props.field_data.name]
              : !!props.errors[props.field_data.name] &&
                props.touched[props.field_data.name]}
            onBlur={props.handleBlur}
            disabled={props.disabled}
            changed={props.changes ? props.changes[props.field_data.name] : null}
          />
          {props.field_data.tag === 'url' ? (
            <UrlWarning
              url={props.values[props.field_data.name]}
              touched={props.hasSubmitted || props.touched[props.field_data.name]}
            />
          ) : null}
        </InputRow>
      ) : null}
    </React.Fragment>
  );
};

function capitalWords(array) {
  let return_array = array.map((item) => {
    var splitStr = item.toLowerCase().split(' ');
    for (var i = 0; i < splitStr.length; i++) {
      splitStr[i] =
        splitStr[i].charAt(0).toUpperCase() + splitStr[i].substring(1);
    }
    return splitStr.join(' ');
  });
  return return_array;
}

function hex(n) {
  const validChars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789_-';
  let array = new Uint8Array(n || 87);
  window.crypto.getRandomValues(array);
  array = array.map((x) => validChars.charCodeAt(x % validChars.length));
  const randomState = String.fromCharCode.apply(null, array);
  return randomState;
}

export default ServiceForm;
