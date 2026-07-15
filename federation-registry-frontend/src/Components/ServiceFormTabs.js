import React, { useState } from 'react';
import Tabs from 'react-bootstrap/Tabs';
import Tab from 'react-bootstrap/Tab';
import { useTranslation } from 'react-i18next';
import { TabConfigProvider, useTabConfig } from './TabConfigProvider';
import GeneralTab from './GeneralTab';
import ProtocolTab from './ProtocolTab';

/**
 * Default tab configuration.
 * Override by passing custom tabs prop to ServiceFormTabs.
 */
const defaultTabs = [
  {
    key: 'general',
    titleKey: 'form_tab_general',
    order: 1,
    visibleIf: null
  },
  {
    key: 'protocol',
    titleKey: 'form_tab_protocol',
    order: 2,
    visibleIf: null
  }
];

/**
 * Internal tab component renderer.
 * Uses a map to associate tab keys with their components.
 */
const tabComponents = {
  general: GeneralTab,
  protocol: ProtocolTab
};

/**
 * Inner tabs component that uses the context.
 */
const ServiceFormTabsInner = ({ disabled, changes, extraFields }) => {
  const { t } = useTranslation();
  const { getSortedTabs, isTabVisible } = useTabConfig();
  const [activeKey, setActiveKey] = useState('general');

  const sortedTabs = getSortedTabs();

  return (
    <Tabs
      activeKey={activeKey}
      onSelect={(key) => setActiveKey(key)}
      className="form-tabs"
      id="service-form-tabs"
    >
      {sortedTabs.map((tab) => {
        // Check visibility condition
        if (!isTabVisible(tab.visibleIf)) {
          return null;
        }

        const Component = tabComponents[tab.key];
        const title = t(tab.titleKey);

        if (!Component) {
          return null;
        }

        return (
          <Tab eventKey={tab.key} title={title} key={tab.key}>
            <Component
              disabled={disabled}
              changes={changes}
              extraFields={extraFields}
            />
          </Tab>
        );
      })}
    </Tabs>
  );
};

/**
 * Main service form tabs component.
 * Wraps tabs in a config provider for extensibility.
 *
 * @param {Object} props
 * @param {boolean} props.disabled - Whether the form is disabled
 * @param {Object} props.changes - Changes object for tracking modifications
 * @param {Object} props.extraFields - Extra fields from tenant config
 * @param {Array} props.tabs - Optional custom tabs configuration
 * @param {Object} props.fields - Optional custom fields_by_tab configuration
 */
const ServiceFormTabs = ({ disabled, changes, extraFields, tabs, fields }) => {
  const tabsConfig = tabs || defaultTabs;

  return (
    <TabConfigProvider tabs={tabsConfig} fields={fields}>
      <div className="form-tabs-container">
        <ServiceFormTabsInner
          disabled={disabled}
          changes={changes}
          extraFields={extraFields}
        />
      </div>
    </TabConfigProvider>
  );
};

export default ServiceFormTabs;

/**
 * Example: Customizing field order in form_field_config.json:
 *
 * "field_order": {
 *   "general": [
 *     { "field": "service_name", "order": 1, "required": true },
 *     { "field": "contacts", "order": 2, "required": true },
 *     { "field": "logo_uri", "order": 3, "required": false },
 *     ...
 *   ],
 *   "protocol": {
 *     "oidc": [
 *       { "field": "application_type", "order": 1, "required": true },
 *       { "field": "grant_types", "order": 2, "required": false },
 *       ...
 *     ],
 *     "saml": [
 *       { "field": "entity_id", "order": 1, "required": true },
 *       { "field": "metadata_url", "order": 2, "required": true },
 *       ...
 *     ]
 *   }
 * }
 *
 * Example: Conditional field visibility:
 *
 * {
 *   "field": "client_secret",
 *   "order": 5,
 *   "condition": "token_endpoint_auth_method !== 'private_key_jwt' && token_endpoint_auth_method !== 'none'"
 * }
 *
 * Example: Programmatic reordering:
 *
 * const { reorderFields } = useTabConfig();
 * const reordered = reorderFields('general', ['contacts', 'service_name', 'logo_uri']);
 */
