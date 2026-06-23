import React, { createContext, useContext } from 'react';

/**
 * Default configuration - used when form_field_config.json is missing or invalid.
 * This ensures backwards compatibility with the original field ordering.
 */
const DEFAULT_CONFIG = {
  tabs: [
    { key: 'general', titleKey: 'form_tab_general', order: 1, visibleIf: null },
    { key: 'protocol', titleKey: 'form_tab_protocol', order: 2, visibleIf: null }
  ],
  fields_by_tab: {
    general: [
      'service_name',
      'integration_environment',
      'logo_uri',
      'website_url',
      'service_description',
      'country',
      'policy_uri',
      'contacts'
    ],
    protocol: [
      'protocol',
      'application_type',
      'grant_types',
      'token_endpoint_auth_method',
      'client_secret',
      'token_endpoint_auth_signing_alg',
      'jwks',
      'jwks_uri',
      'allow_introspection',
      'scope',
      'redirect_uris',
      'post_logout_redirect_uris',
      'code_challenge_method',
      'refresh_token_validity_seconds',
      'device_code_validity_seconds',
      'access_token_validation_model',
      'access_token_validity_seconds',
      'id_token_timeout_seconds',
      'entity_id',
      'metadata_url',
      'requested_attributes'
    ]
  },
  field_order: {
    general: [
      { field: 'service_name', order: 1, required: true },
      { field: 'integration_environment', order: 2, required: true },
      { field: 'logo_uri', order: 3, required: false },
      { field: 'website_url', order: 4, required: false },
      { field: 'service_description', order: 5, required: true },
      { field: 'country', order: 6, required: false },
      { field: 'policy_uri', order: 7, required: false },
      { field: 'contacts', order: 8, required: true }
    ],
    protocol: {
      oidc: [
        { field: 'protocol', order: 1, required: true },
        { field: 'application_type', order: 2, required: true },
        { field: 'grant_types', order: 3, required: false },
        { field: 'token_endpoint_auth_method', order: 4, required: true },
        { field: 'client_secret', order: 5, required: false },
        { field: 'token_endpoint_auth_signing_alg', order: 6, required: false },
        { field: 'jwks', order: 7, required: false },
        { field: 'jwks_uri', order: 8, required: false },
        { field: 'allow_introspection', order: 9, required: false },
        { field: 'scope', order: 10, required: false },
        { field: 'redirect_uris', order: 11, required: false },
        { field: 'post_logout_redirect_uris', order: 12, required: false },
        { field: 'code_challenge_method', order: 13, required: true },
        { field: 'refresh_token_validity_seconds', order: 14, required: false },
        { field: 'device_code_validity_seconds', order: 15, required: false },
        { field: 'access_token_validation_model', order: 16, required: true },
        { field: 'access_token_validity_seconds', order: 17, required: true },
        { field: 'id_token_timeout_seconds', order: 18, required: true }
      ],
      saml: [
        { field: 'protocol', order: 1, required: true },
        { field: 'entity_id', order: 2, required: true },
        { field: 'metadata_url', order: 3, required: true },
        { field: 'requested_attributes', order: 4, required: false }
      ]
    }
  }
};

let formFieldConfig;
try {
  // eslint-disable-next-line no-unused-vars
  const loadedConfig = require('../form_field_config.json');
  formFieldConfig = loadedConfig;
} catch {
  // Config file missing or invalid - use defaults for backwards compatibility
  formFieldConfig = DEFAULT_CONFIG;
}

const TabConfigContext = createContext(null);

/**
 * Configuration-driven tab and field management.
 * Enables custom ordering and field mapping via form_field_config.json.
 * Falls back to default order if config is missing (backwards compatible).
 */
export const TabConfigProvider = ({ tabs, fields, children }) => {
  // Use provided config or fall back to defaults
  const configTabs = tabs || formFieldConfig.tabs;
  const configFields = fields || formFieldConfig.fields_by_tab;
  const configFieldOrder = formFieldConfig.field_order || {};

  /**
   * Get tabs sorted by their order property.
   * @returns {Array} Sorted tab configurations
   */
  const getSortedTabs = () => {
    return [...configTabs].sort((a, b) => (a.order ?? 999) - (b.order ?? 999));
  };

  /**
   * Get fields for a specific tab, sorted by order.
   * @param {string} tabKey - The tab identifier
   * @returns {Array} Array of field configurations sorted by order
   */
  const getFieldsForTab = (tabKey) => {
    const fields = configFields[tabKey] || [];
    const orderConfig = configFieldOrder[tabKey] || [];

    // Create a map of field -> order
    const orderMap = {};
    if (Array.isArray(orderConfig)) {
      orderConfig.forEach((item) => {
        orderMap[item.field] = item.order ?? 999;
      });
    }

    // Sort fields by their order
    return [...fields].sort((a, b) => {
      const orderA = orderMap[a] ?? 999;
      const orderB = orderMap[b] ?? 999;
      return orderA - orderB;
    });
  };

  /**
   * Get field configuration (order, required, condition) for a specific field.
   * @param {string} tabKey - The tab identifier
   * @param {string} fieldName - The field name
   * @returns {Object|null} Field configuration or null
   */
  const getFieldConfig = (tabKey, fieldName) => {
    const orderConfig = configFieldOrder[tabKey];
    if (!orderConfig) return null;

    // Handle protocol-specific configs (oidc/saml)
    if (typeof orderConfig === 'object' && !Array.isArray(orderConfig)) {
      for (const protocol of Object.keys(orderConfig)) {
        const found = orderConfig[protocol].find((f) => f.field === fieldName);
        if (found) return found;
      }
      return null;
    }

    return orderConfig.find((f) => f.field === fieldName) || null;
  };

  /**
   * Check if a field should be visible based on its condition.
   * @param {string|null} condition - Condition expression or null for always visible
   * @param {Object} context - Context variables for condition evaluation
   * @returns {boolean}
   */
  const isFieldVisible = (condition, context = {}) => {
    if (!condition) return true;
    try {
      const fn = new Function(...Object.keys(context), `return ${condition}`);
      return fn(...Object.values(context));
    } catch {
      return false;
    }
  };

  /**
   * Check if a tab should be visible based on condition.
   * @param {string|null} visibleIf - Condition expression or null for always visible
   * @param {Object} context - Context variables for condition evaluation
   * @returns {boolean}
   */
  const isTabVisible = (visibleIf, context = {}) => {
    if (!visibleIf) return true;
    return isFieldVisible(visibleIf, context);
  };

  /**
   * Reorder tabs based on custom order array.
   * @param {Array<string>} tabKeys - Array of tab keys in desired order
   * @returns {Array} Reordered tabs
   */
  const reorderTabs = (tabKeys) => {
    const tabMap = {};
    configTabs.forEach((tab) => {
      tabMap[tab.key] = tab;
    });

    const result = [];
    tabKeys.forEach((key) => {
      if (tabMap[key]) {
        result.push(tabMap[key]);
      }
    });

    // Add any remaining tabs not in the custom order
    configTabs.forEach((tab) => {
      if (!tabKeys.includes(tab.key)) {
        result.push(tab);
      }
    });

    return result;
  };

  /**
   * Reorder fields within a tab based on custom order array.
   * @param {string} tabKey - The tab identifier
   * @param {Array<string>} fieldNames - Array of field names in desired order
   * @returns {Array} Reordered fields
   */
  const reorderFields = (tabKey, fieldNames) => {
    const fields = getFieldsForTab(tabKey);
    const fieldSet = new Set(fields);

    const result = [];
    fieldNames.forEach((name) => {
      if (fieldSet.has(name)) {
        result.push(name);
      }
    });

    fields.forEach((field) => {
      if (!fieldNames.includes(field)) {
        result.push(field);
      }
    });

    return result;
  };

  return (
    <TabConfigContext.Provider
      value={{
        getSortedTabs,
        getFieldsForTab,
        getFieldConfig,
        isTabVisible,
        isFieldVisible,
        reorderTabs,
        reorderFields,
        rawConfig: formFieldConfig
      }}
    >
      {children}
    </TabConfigContext.Provider>
  );
};

export const useTabConfig = () => {
  const context = useContext(TabConfigContext);
  if (!context) {
    throw new Error('useTabConfig must be used within TabConfigProvider');
  }
  return context;
};
