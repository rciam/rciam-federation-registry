DROP TABLE IF EXISTS user_edu_person_entitlement,tokens,user_info, service_petition_contacts, service_petition_oidc_grant_types, service_petition_oidc_redirect_uris, service_petition_oidc_scopes,
service_petition_details_oidc,service_petition_details_saml, service_petition_details, service_oidc_scopes,service_contacts,service_oidc_grant_types,service_oidc_redirect_uris,service_details_oidc,
service_details_saml,service_details,service_state,user_roles,role_actions,role_entitlements,groups,invitations,group_subs,tenant_deployer_agents,tenants,deployment_tasks,service_errors;

create table tokens (
  token VARCHAR(1054),
  code VARCHAR(1054) PRIMARY KEY
);

create table tenants (
  name VARCHAR(256) PRIMARY KEY,
  client_id VARCHAR(256),
  client_secret VARCHAR(1054),
  issuer_url VARCHAR(256),
  logo VARCHAR(256),
  description VARCHAR(1054),
  main_title VARCHAR(256),
  color VARCHAR(128)
);

create table user_info (
  id SERIAL PRIMARY KEY,
  sub VARCHAR(256),
  preferred_username VARCHAR(256),
  name VARCHAR(256),
  given_name VARCHAR(256),
  family_name VARCHAR(256),
  email VARCHAR(256),
  tenant VARCHAR(256),
  FOREIGN KEY (tenant) REFERENCES tenants(name)
);

create table user_roles (
  id SERIAL PRIMARY KEY,
  role_name VARCHAR(256),
  tenant VARCHAR(256),
  FOREIGN KEY (tenant) REFERENCES tenants(name)
);

create table role_actions (
  role_id bigint,
  action VARCHAR(256),
  PRIMARY KEY (role_id,action),
  FOREIGN KEY (role_id) REFERENCES user_roles(id)
);

create table role_entitlements (
  role_id bigint,
  entitlement VARCHAR(256),
  PRIMARY KEY (role_id,entitlement),
  FOREIGN KEY (role_id) REFERENCES user_roles(id)
);

create table groups (
  id SERIAL PRIMARY KEY,
  group_name VARCHAR(256)
);

create table invitations (
  id SERIAL PRIMARY KEY,
  code VARCHAR(1054),
  email VARCHAR(256),
  group_id INTEGER,
  sub VARCHAR(256) DEFAULT NULL,
  invited_by VARCHAR(256),
  date timestamp without time zone DEFAULT NULL,
  group_manager BOOLEAN,
  FOREIGN KEY (group_id) REFERENCES groups(id)
);

create table group_subs (
  group_id INTEGER,
  sub VARCHAR(256),
  group_manager BOOLEAN,
  PRIMARY KEY (group_id,sub),
  FOREIGN KEY (group_id) REFERENCES groups(id)
);

create table user_edu_person_entitlement (
  user_id INTEGER,
  edu_person_entitlement VARCHAR(256),
  PRIMARY KEY (user_id,edu_person_entitlement),
  FOREIGN KEY (user_id) REFERENCES user_info(id)
);

create table service_details (
  id SERIAL PRIMARY KEY,
  external_id INTEGER DEFAULT NULL,
  tenant VARCHAR(256),
  service_name  VARCHAR(256),
  group_id INTEGER,
  service_description VARCHAR(1024),
  logo_uri VARCHAR(2048),
  policy_uri VARCHAR(2048),
  integration_environment VARCHAR(256),
  requester VARCHAR(256),
  protocol VARCHAR(256),
  deleted BOOLEAN DEFAULT FALSE,
  FOREIGN KEY (tenant) REFERENCES tenants(name)
);

create table service_details_oidc (
  id INTEGER PRIMARY KEY,
  client_id VARCHAR(256),
  allow_introspection BOOLEAN,
  code_challenge_method VARCHAR(256),
  device_code_validity_seconds bigint,
  access_token_validity_seconds bigint,
  refresh_token_validity_seconds bigint,
  client_secret VARCHAR(2048),
  reuse_refresh_tokens BOOLEAN,
  clear_access_tokens_on_refresh BOOLEAN,
  id_token_timeout_seconds bigint,
  FOREIGN KEY (id) REFERENCES service_details(id) ON DELETE CASCADE
);

create table service_state (
  id bigint PRIMARY KEY,
  state VARCHAR(256),
  deployment_type VARCHAR(256) DEFAULT NULL,
  FOREIGN KEY (id) REFERENCES service_details(id) ON DELETE CASCADE
);

create table service_errors (
  service_id bigint,
  date timestamp without time zone DEFAULT NULL,
  error_code bigint,
  error_description VARCHAR(2048),
  archived BOOLEAN DEFAULT FALSE,
  PRIMARY KEY (service_id,date),
  FOREIGN KEY (service_id) REFERENCES service_details(id) ON DELETE CASCADE
);

create table service_details_saml (
  id bigint PRIMARY KEY,
  entity_id VARCHAR(256),
  metadata_url VARCHAR(256),
  FOREIGN KEY (id) REFERENCES service_details(id) ON DELETE CASCADE
);

create table service_contacts (
  id SERIAL PRIMARY KEY,
  owner_id bigint,
  value VARCHAR(256),
  type VARCHAR(256),
  FOREIGN KEY (owner_id) REFERENCES service_details(id) ON DELETE CASCADE
);

create table service_oidc_grant_types (
  id SERIAL PRIMARY KEY,
  owner_id bigint,
  value VARCHAR(256),
  FOREIGN KEY (owner_id) REFERENCES service_details(id) ON DELETE CASCADE
);

create table service_oidc_redirect_uris (
  id SERIAL PRIMARY KEY,
  owner_id bigint,
  value VARCHAR(256),
  FOREIGN KEY (owner_id) REFERENCES service_details(id) ON DELETE CASCADE
);

create table service_oidc_scopes (
  id SERIAL PRIMARY KEY,
  owner_id bigint,
  value VARCHAR(256),
  FOREIGN KEY (owner_id) REFERENCES service_details(id) ON DELETE CASCADE
);

create table service_petition_details (
  id SERIAL PRIMARY KEY,
  service_id INTEGER DEFAULT NULL,
  tenant VARCHAR(256),
  service_description VARCHAR(1024),
  service_name  VARCHAR(256),
  logo_uri VARCHAR(2048),
  policy_uri VARCHAR(2048),
  integration_environment VARCHAR(256),
  type VARCHAR(256) DEFAULT 'create',
  status VARCHAR(256) DEFAULT 'pending',
  comment VARCHAR(2024) DEFAULT NULL,
  protocol VARCHAR(256),
  requester VARCHAR(256),
  reviewer VARCHAR(256) DEFAULT NULL,
  group_id INTEGER DEFAULT NULL,
  reviewed_at timestamp without time zone DEFAULT NULL,
  FOREIGN KEY (tenant) REFERENCES tenants(name),
  FOREIGN KEY (service_id) REFERENCES service_details(id) ON DELETE SET NULL
);

create table service_petition_details_oidc (
  id bigint PRIMARY KEY,
  client_id VARCHAR(256),
  allow_introspection BOOLEAN,
  code_challenge_method VARCHAR(256),
  device_code_validity_seconds bigint,
  access_token_validity_seconds bigint,
  refresh_token_validity_seconds bigint,
  reuse_refresh_tokens BOOLEAN,
  clear_access_tokens_on_refresh BOOLEAN,
  id_token_timeout_seconds bigint,
  client_secret VARCHAR(2048),
  FOREIGN KEY (id) REFERENCES service_petition_details(id) ON DELETE CASCADE
);

create table service_petition_details_saml (
  id bigint PRIMARY KEY,
  entity_id VARCHAR(256),
  metadata_url VARCHAR(256),
  FOREIGN KEY (id) REFERENCES service_petition_details(id) ON DELETE CASCADE
);

create table service_petition_contacts (
  id SERIAL PRIMARY KEY,
  owner_id bigint,
  value VARCHAR(256),
  type VARCHAR(256),
  FOREIGN KEY (owner_id) REFERENCES service_petition_details(id) ON DELETE CASCADE
);

create table service_petition_oidc_grant_types (
  id SERIAL PRIMARY KEY,
  owner_id bigint,
  value VARCHAR(256),
  FOREIGN KEY (owner_id) REFERENCES service_petition_details(id) ON DELETE CASCADE
);

create table service_petition_oidc_redirect_uris (
  id SERIAL PRIMARY KEY,
  owner_id bigint,
  value VARCHAR(256),
  FOREIGN KEY (owner_id) REFERENCES service_petition_details(id) ON DELETE CASCADE
);

create table service_petition_oidc_scopes (
  id SERIAL PRIMARY KEY,
  owner_id bigint,
  value VARCHAR(256),
  FOREIGN KEY (owner_id) REFERENCES service_petition_details(id) ON DELETE CASCADE
);

create table tenant_deployer_agents (
  id SERIAL PRIMARY KEY,
  tenant VARCHAR(256),
  type VARCHAR(256),
  entity_type VARCHAR(256),
  hostname VARCHAR(256),
  entity_protocol VARCHAR(256),
  FOREIGN KEY (tenant) REFERENCES tenants(name)
);

create  table deployment_tasks (
  agent_id INTEGER,
  service_id INTEGER,
  error BOOLEAN DEFAULT FALSE,
  PRIMARY KEY (agent_id,service_id),
  FOREIGN KEY (agent_id) REFERENCES tenant_deployer_agents(id),
  FOREIGN KEY (service_id) REFERENCES service_details(id)
);
