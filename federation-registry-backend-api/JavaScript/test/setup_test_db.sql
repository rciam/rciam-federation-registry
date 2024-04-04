DROP TABLE IF EXISTS user_edu_person_entitlement,tokens,user_info, service_petition_contacts, service_petition_oidc_grant_types,service_boolean,service_petition_boolean,service_saml_attributes,service_petition_saml_attributes, service_petition_oidc_redirect_uris,service_petition_oidc_post_logout_redirect_uris, service_petition_oidc_scopes,
service_petition_details_oidc,service_petition_details_saml, service_petition_details, service_oidc_scopes,service_contacts,service_oidc_grant_types,service_oidc_redirect_uris,service_oidc_post_logout_redirect_uris,service_details_oidc,
service_details_saml,service_details,service_state,user_roles,role_actions,role_entitlements,groups,invitations,group_subs,tenant_deployer_agents,banner_alerts,deployment_tasks,service_errors,organizations,service_tags,tenants;

create table tokens (
  token VARCHAR(2048),
  id_token VARCHAR(2048),
  code VARCHAR(1054) PRIMARY KEY
);


create table tenants (
  name VARCHAR(256) PRIMARY KEY,
  client_id VARCHAR(256),
  client_secret VARCHAR(1054),
  issuer_url VARCHAR(256),
  base_url VARCHAR(256) DEFAULT NULL
);


create table user_info (
  id SERIAL PRIMARY KEY,
  sub VARCHAR(256),
  preferred_username VARCHAR(256),
  name VARCHAR(256),
  given_name VARCHAR(256),
  family_name VARCHAR(256),
  email VARCHAR(256),
  role_id bigint,
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
  tenant VARCHAR(256),
  FOREIGN KEY (tenant) REFERENCES tenants(name),
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
  user_id bigint,
  edu_person_entitlement VARCHAR(256),
  PRIMARY KEY (user_id,edu_person_entitlement),
  FOREIGN KEY (user_id) REFERENCES user_info(id)
);


create table organizations (
  organization_id SERIAL PRIMARY KEY,
  name VARCHAR(256),
  url VARCHAR(256),
  active BOOLEAN DEFAULT NULL,
  ror_id VARCHAR(256) DEFAULT NULL
);


create table service_details (
  id SERIAL PRIMARY KEY,
  external_id INTEGER DEFAULT NULL,
  tenant VARCHAR(256),
  website_url VARCHAR(256) DEFAULT NULL,
  service_name  VARCHAR(256),
  group_id INTEGER,
  service_description VARCHAR(1024),
  logo_uri VARCHAR(2048),
  policy_uri VARCHAR(2048),
  integration_environment VARCHAR(256),
  country VARCHAR(256),
  requester VARCHAR(256),
  protocol VARCHAR(256),
  aup_uri VARCHAR(256) DEFAULT NULL,
  deleted BOOLEAN DEFAULT FALSE,
  organization_id INTEGER,
  FOREIGN KEY (organization_id) REFERENCES organizations(organization_id),
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
  reuse_refresh_token BOOLEAN,
  clear_access_tokens_on_refresh BOOLEAN,
  id_token_timeout_seconds bigint,
  token_endpoint_auth_method VARCHAR(256),
  token_endpoint_auth_signing_alg VARCHAR(256),
  jwks VARCHAR(2048),
  jwks_uri VARCHAR(256),
  application_type VARCHAR(256),
  FOREIGN KEY (id) REFERENCES service_details(id) ON DELETE CASCADE
);


create table service_state (
  id bigint PRIMARY KEY,
  state VARCHAR(256),
  deployment_type VARCHAR(256) DEFAULT NULL,
  outdated BOOLEAN DEFAULT FALSE,
  last_edited timestamp without time zone DEFAULT NULL,
  created_at timestamp without time zone DEFAULT NULL,
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

create table service_oidc_post_logout_redirect_uris (
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

create table service_saml_attributes (
  owner_id bigint,
  name VARCHAR(512),
  friendly_name VARCHAR(512),
  required BOOLEAN DEFAULT TRUE,
  name_format VARCHAR(512) DEFAULT 'urn:oasis:names:tc:SAML:2.0:attrname-format:uri',
  FOREIGN KEY (owner_id) REFERENCES service_details(id) ON DELETE CASCADE
);



create table service_petition_details (
  id SERIAL PRIMARY KEY,
  service_id INTEGER DEFAULT NULL,
  tenant VARCHAR(256),
  website_url VARCHAR(256) DEFAULT NULL,
  service_description VARCHAR(1024),
  service_name  VARCHAR(256),
  logo_uri VARCHAR(2048),
  policy_uri VARCHAR(2048),
  country VARCHAR(256),
  integration_environment VARCHAR(256),
  type VARCHAR(256) DEFAULT 'create',
  status VARCHAR(256) DEFAULT 'pending',
  comment VARCHAR(2024) DEFAULT NULL,
  protocol VARCHAR(256),
  requester VARCHAR(256),
  reviewer VARCHAR(256) DEFAULT NULL,
  aup_uri VARCHAR(256) DEFAULT NULL,
  group_id INTEGER DEFAULT NULL,
  last_edited timestamp without time zone DEFAULT NULL,
  reviewed_at timestamp without time zone DEFAULT NULL,
  organization_id INTEGER,
  FOREIGN KEY (organization_id) REFERENCES organizations(organization_id),
  FOREIGN KEY (tenant) REFERENCES tenants(name),
  FOREIGN KEY (service_id) REFERENCES service_details(id) ON DELETE SET NULL
);


create table service_boolean (
  id SERIAL PRIMARY KEY,
  service_id bigint,
  name VARCHAR(256),
  value BOOLEAN DEFAULT FALSE,
  FOREIGN KEY (service_id) REFERENCES service_details(id) ON DELETE CASCADE
);


create table service_petition_boolean (
  id SERIAL PRIMARY KEY,
  petition_id bigint,
  name VARCHAR(256),
  value BOOLEAN DEFAULT FALSE,
  FOREIGN KEY (petition_id) REFERENCES service_petition_details(id) ON DELETE CASCADE
);


create table service_petition_details_oidc (
  id bigint PRIMARY KEY,
  client_id VARCHAR(256),
  allow_introspection BOOLEAN,
  code_challenge_method VARCHAR(256),
  token_endpoint_auth_method VARCHAR(256),
  token_endpoint_auth_signing_alg VARCHAR(256),
  jwks VARCHAR(2048),
  jwks_uri VARCHAR(256),
  device_code_validity_seconds bigint,
  access_token_validity_seconds bigint,
  refresh_token_validity_seconds bigint,
  reuse_refresh_token BOOLEAN,
  clear_access_tokens_on_refresh BOOLEAN,
  id_token_timeout_seconds bigint,
  client_secret VARCHAR(2048),
  application_type VARCHAR(256),
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

create table service_petition_saml_attributes (
  owner_id bigint,
  name VARCHAR(512),
  friendly_name VARCHAR(512),
  required BOOLEAN DEFAULT TRUE,
  name_format VARCHAR(512) DEFAULT 'urn:oasis:names:tc:SAML:2.0:attrname-format:uri',
  FOREIGN KEY (owner_id) REFERENCES service_petition_details(id) ON DELETE CASCADE
);

create table service_petition_oidc_redirect_uris (
  id SERIAL PRIMARY KEY,
  owner_id bigint,
  value VARCHAR(256),
  FOREIGN KEY (owner_id) REFERENCES service_petition_details(id) ON DELETE CASCADE
);

create table service_petition_oidc_post_logout_redirect_uris (
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
  integration_environment VARCHAR(256),
  type VARCHAR(256),
  entity_type VARCHAR(256),
  hostname VARCHAR(256),
  entity_protocol VARCHAR(256),
  deployer_name VARCHAR(256),
  FOREIGN KEY (tenant) REFERENCES tenants(name)
);


create table banner_alerts (
    id SERIAL PRIMARY KEY,
    tenant VARCHAR(256),
    alert_message VARCHAR(1054),
    type VARCHAR(256),
    active BOOLEAN DEFAULT false,
    priority INTEGER DEFAULT 0,
    FOREIGN KEY (tenant) REFERENCES tenants(name) ON DELETE CASCADE
);


create  table deployment_tasks (
  agent_id INTEGER,
  service_id INTEGER,
  deployer_name VARCHAR(256),
  error BOOLEAN DEFAULT FALSE,
  PRIMARY KEY (agent_id,service_id),
  FOREIGN KEY (agent_id) REFERENCES tenant_deployer_agents(id),
  FOREIGN KEY (service_id) REFERENCES service_details(id)
);



create table service_tags (
  service_id INTEGER,
  tag VARCHAR(256),
  tenant VARCHAR(256),
  FOREIGN KEY (tenant) REFERENCES tenants(name) ON DELETE CASCADE,
  PRIMARY KEY (tag,service_id)
);

INSERT INTO organizations(name,url)
VALUES ('Andreas Foundation','https://andreaskozadinos.com');



INSERT INTO tenants (name,client_id,client_secret,issuer_url,base_url)
VALUES ('tenant_1','test','test','test','http://localhost:3000/tenant_1');
INSERT INTO tenants (name,client_id,client_secret,issuer_url,base_url)
VALUES ('tenant_2','test','test','test','http://localhost:3000/tenant_2');


INSERT INTO service_details (service_description,service_name,logo_uri,policy_uri,integration_environment,requester,protocol,group_id,tenant,external_id,country,website_url,organization_id)
VALUES ('Lorem ipsum dolor sit amet, consectetur adipiscing elit. Aenean in ex in tellus congue commodo. Suspendisse condimentum purus ante, in ornare leo egestas ut.','Client 1','https://cdn.vox-cdn.com/thumbor/0n6dqQfk9MuOBSiM39Pog2Bw39Y=/1400x1400/filters:format(jpeg)/cdn.vox-cdn.com/uploads/chorus_asset/file/19341372/microsoftedgenewlogo.jpg','https://policy_uri.com','demo','4359841657275796f20734f26d7b60c515f17cd36bad58d29ed87d000d621974@tenant_1.eu','oidc',1,'tenant_1',1,'gr','https://my_service_website.com',1);
INSERT INTO service_details (service_description,service_name,logo_uri,policy_uri,integration_environment,requester,protocol,group_id,tenant,external_id,country,website_url,organization_id)
VALUES ('Lorem ipsum dolor sit amet, consectetur adipiscing elit. Aenean in ex in tellus congue commodo. Suspendisse condimentum purus ante, in ornare leo egestas ut.','Client 2','https://i.pinimg.com/originals/33/b8/69/33b869f90619e81763dbf1fccc896d8d.jpg','https://policy_uri.com','production','4359841657275796f20734f26d7b60c515f17cd36bad58d29ed87d000d621974@tenant_1.eu','oidc',2,'tenant_1',2,'gr','https://my_service_website.com',1);
INSERT INTO service_details (service_description,service_name,logo_uri,policy_uri,integration_environment,requester,protocol,group_id,tenant,external_id,country,website_url,organization_id)
VALUES ('Lorem ipsum dolor sit amet, consectetur adipiscing elit. Aenean in ex in tellus congue commodo. Suspendisse condimentum purus ante, in ornare leo egestas ut.','Client 3','https://encrypted-tbn0.gstatic.com/images?q=tbn%3AANd9GcROY_lTxPGm6_XjUncdBfqkSbRoFoEf4BLBlQ&usqp=CAU','https://policy_uri.com','demo','4359841657275796f20734f26d7b60c515f17cd36bad58d29ed87d000d621974@tenant_1.eu','oidc',3,'tenant_1',3,'gr','https://my_service_website.com',1);
INSERT INTO service_details (service_description,service_name,logo_uri,policy_uri,integration_environment,requester,protocol,group_id,tenant,external_id,country,website_url,organization_id)
VALUES ('Lorem ipsum dolor sit amet, consectetur adipiscing elit. Aenean in ex in tellus congue commodo. Suspendisse condimentum purus ante, in ornare leo egestas ut.','Client 4','https://brandmark.io/logo-rank/random/pepsi.png','https://policy_uri.com','development','4359841657275796f20734f26d7b60c515f17cd36bad58d29ed87d000d621974@tenant_1.eu','oidc',4,'tenant_1',4,'gr','https://my_service_website.com',1);
INSERT INTO service_details (service_description,service_name,logo_uri,policy_uri,integration_environment,requester,protocol,group_id,tenant,external_id,country,website_url,organization_id)
VALUES ('Lorem ipsum dolor sit amet, consectetur adipiscing elit. Aenean in ex in tellus congue commodo. Suspendisse condimentum purus ante, in ornare leo egestas ut.','Client 5','https://brandmark.io/logo-rank/random/pepsi.png','https://policy_uri.com','development','7a6ae5617ea76389401e3c3839127fd2a019572066d40c5d0176bd242651f934@tenant_1.eu','oidc',5,'tenant_1',5,'gr','https://my_service_website.com',1);
INSERT INTO service_details (service_description,service_name,logo_uri,policy_uri,integration_environment,requester,protocol,group_id,tenant,external_id,country,website_url,organization_id)
VALUES ('Lorem ipsum dolor sit amet, consectetur adipiscing elit. Aenean in ex in tellus congue commodo. Suspendisse condimentum purus ante, in ornare leo egestas ut.','Saml 6','https://cdn.auth0.com/blog/duo-saml-exploit/saml.png','https://policy_uri.com','development','4359841657275796f20734f26d7b60c515f17cd36bad58d29ed87d000d621974@tenant_1.eu','saml',6,'tenant_1',6,'gr','https://my_service_website.com',1);
INSERT INTO service_details (service_description,service_name,logo_uri,policy_uri,integration_environment,requester,protocol,group_id,tenant,external_id,country,website_url,organization_id)
VALUES ('Lorem ipsum dolor sit amet, consectetur adipiscing elit. Aenean in ex in tellus congue commodo. Suspendisse condimentum purus ante, in ornare leo egestas ut.','tenant_2 OIDC Service 1','https://nat.sakimura.org/wp-content/uploads/2012/02/openid-icon-250x250.png','https://policy_uri.com','development','4e38406c89591bb08e070accbce62140cfc8beb40314c03aa82cf3683ac270b5@aai.tenant_2-portal.eu','oidc',8,'tenant_2',1,'gr','https://my_service_website.com',1);
INSERT INTO service_details (service_description,service_name,logo_uri,policy_uri,integration_environment,requester,protocol,group_id,tenant,external_id,country,website_url,organization_id)
VALUES ('Lorem ipsum dolor sit amet, consectetur adipiscing elit. Aenean in ex in tellus congue commodo. Suspendisse condimentum purus ante, in ornare leo egestas ut.','tenant_2 OIDC Service 2','https://nat.sakimura.org/wp-content/uploads/2012/02/openid-icon-250x250.png','https://policy_uri.com','development','4e38406c89591bb08e070accbce62140cfc8beb40314c03aa82cf3683ac270b5@aai.tenant_2-portal.eu','oidc',9,'tenant_2',2,'gr','https://my_service_website.com',1);
INSERT INTO service_details (service_description,service_name,logo_uri,policy_uri,integration_environment,requester,protocol,group_id,tenant,external_id,country,website_url,organization_id)
VALUES ('Lorem ipsum dolor sit amet, consectetur adipiscing elit. Aenean in ex in tellus congue commodo. Suspendisse condimentum purus ante, in ornare leo egestas ut.','tenant_2 SAML Service 1','https://cdn.auth0.com/blog/duo-saml-exploit/saml.png','https://policy_uri.com','demo','4e38406c89591bb08e070accbce62140cfc8beb40314c03aa82cf3683ac270b5@aai.tenant_2-portal.eu','saml',10,'tenant_2',3,'gr','https://my_service_website.com',1);
INSERT INTO service_details (service_description,service_name,logo_uri,policy_uri,integration_environment,requester,protocol,group_id,tenant,external_id,country,website_url,organization_id)
VALUES ('Lorem ipsum dolor sit amet, consectetur adipiscing elit. Aenean in ex in tellus congue commodo. Suspendisse condimentum purus ante, in ornare leo egestas ut.','tenant_1 saml Service 2','https://cdn.auth0.com/blog/duo-saml-exploit/saml.png','https://policy_uri.com','demo','4359841657275796f20734f26d7b60c515f17cd36bad58d29ed87d000d621974@tenant_1.eu','saml',11,'tenant_1',3,'gr','https://my_service_website.com',1);



INSERT INTO service_state (id,state,last_edited)
VALUES (1,'deployed','2021-01-01 10:23:54');
INSERT INTO service_state (id,state,last_edited)
VALUES (2,'deployed','2021-01-02 10:23:54');
INSERT INTO service_state (id,state,last_edited)
VALUES (3,'deployed','2021-01-03 10:23:54');
INSERT INTO service_state (id,state,last_edited)
VALUES (4,'deployed','2021-01-05 10:23:54');
INSERT INTO service_state (id,state,last_edited)
VALUES (5,'deployed','2021-01-06 10:23:54');
INSERT INTO service_state (id,state,last_edited)
VALUES (6,'deployed','2021-01-06 10:23:54');
INSERT INTO service_state (id,state,last_edited)
VALUES (7,'deployed','2021-01-06 10:23:54');
INSERT INTO service_state (id,state,last_edited)
VALUES (8,'deployed','2021-01-06 10:23:54');
INSERT INTO service_state (id,state,last_edited)
VALUES (9,'deployed','2021-01-06 10:23:54');
INSERT INTO service_state (id,state,deployment_type,last_edited)
VALUES (10,'error','create','2021-02-04 10:23:54');


INSERT INTO service_details_oidc (id,client_id,allow_introspection,client_secret,reuse_refresh_token,clear_access_tokens_on_refresh,id_token_timeout_seconds,access_token_validity_seconds,refresh_token_validity_seconds,code_challenge_method,device_code_validity_seconds,token_endpoint_auth_method,token_endpoint_auth_signing_alg,application_type)
VALUES (1,'client1',true,'secret',true,true,600,3600,28800,'plain',10000,'client_secret_basic','','WEB');
INSERT INTO service_details_oidc (id,client_id,allow_introspection,client_secret,reuse_refresh_token,clear_access_tokens_on_refresh,id_token_timeout_seconds,access_token_validity_seconds,refresh_token_validity_seconds,code_challenge_method,device_code_validity_seconds,token_endpoint_auth_method,token_endpoint_auth_signing_alg,application_type)
VALUES (2,'client2',true,'secret',true,true,600,3600,28800,'plain',10000,'client_secret_basic','','WEB');
INSERT INTO service_details_oidc (id,client_id,allow_introspection,client_secret,reuse_refresh_token,clear_access_tokens_on_refresh,id_token_timeout_seconds,access_token_validity_seconds,refresh_token_validity_seconds,code_challenge_method,device_code_validity_seconds,token_endpoint_auth_method,token_endpoint_auth_signing_alg,application_type)
VALUES (3,'client3',true,'secret',true,true,600,3600,28800,'plain',10000,'client_secret_basic','','WEB');
INSERT INTO service_details_oidc (id,client_id,allow_introspection,client_secret,reuse_refresh_token,clear_access_tokens_on_refresh,id_token_timeout_seconds,access_token_validity_seconds,refresh_token_validity_seconds,code_challenge_method,device_code_validity_seconds,token_endpoint_auth_method,token_endpoint_auth_signing_alg,application_type)
VALUES (4,'client4',true,'secret',true,true,600,3600,28800,'plain',10000,'client_secret_basic','','WEB');
INSERT INTO service_details_oidc (id,client_id,allow_introspection,client_secret,reuse_refresh_token,clear_access_tokens_on_refresh,id_token_timeout_seconds,access_token_validity_seconds,refresh_token_validity_seconds,code_challenge_method,device_code_validity_seconds,token_endpoint_auth_method,token_endpoint_auth_signing_alg,application_type)
VALUES (5,'client5',true,'secret',true,true,600,3600,28800,'plain',10000,'client_secret_basic','','WEB');
INSERT INTO service_details_oidc (id,client_id,allow_introspection,client_secret,reuse_refresh_token,clear_access_tokens_on_refresh,id_token_timeout_seconds,access_token_validity_seconds,refresh_token_validity_seconds,code_challenge_method,device_code_validity_seconds,token_endpoint_auth_method,token_endpoint_auth_signing_alg,application_type)
VALUES (7,'client1',true,'secret',true,true,600,3600,28800,'plain',10000,'client_secret_basic','','WEB');
INSERT INTO service_details_oidc (id,client_id,allow_introspection,client_secret,reuse_refresh_token,clear_access_tokens_on_refresh,id_token_timeout_seconds,access_token_validity_seconds,refresh_token_validity_seconds,code_challenge_method,device_code_validity_seconds,token_endpoint_auth_method,token_endpoint_auth_signing_alg,application_type)
VALUES (8,'client2',true,'secret',true,true,600,3600,28800,'plain',10000,'client_secret_basic','','WEB');


INSERT INTO service_details_saml (id,entity_id,metadata_url)
VALUES (6,'https://saml-id-1.com','https://metadataurl.com');
INSERT INTO service_details_saml (id,entity_id,metadata_url)
VALUES (9,'https://saml-id-2.com','https://metadataurl.com');
INSERT INTO service_details_saml (id,entity_id,metadata_url)
VALUES (10,'https://saml-id-2.com','https://metadataurl.com');


INSERT INTO service_contacts(owner_id,value,type)
VALUES ('1','mymail@gmail.com','admin');
INSERT INTO service_contacts(owner_id,value,type)
VALUES ('1','mysnail@gmail.com','admin');
INSERT INTO service_contacts(owner_id,value,type)
VALUES ('1','mygrail@gmail.com','admin');
INSERT INTO service_contacts(owner_id,value,type)
VALUES ('1','myfail@gmail.com','admin');
INSERT INTO service_contacts(owner_id,value,type)
VALUES ('2','mymail@gmail.com','admin');
INSERT INTO service_contacts(owner_id,value,type)
VALUES ('2','mysnail@gmail.com','admin');
INSERT INTO service_contacts(owner_id,value,type)
VALUES ('2','mygrail@gmail.com','admin');
INSERT INTO service_contacts(owner_id,value,type)
VALUES ('2','myfail@gmail.com','admin');
INSERT INTO service_contacts(owner_id,value,type)
VALUES ('3','mymail@gmail.com','admin');
INSERT INTO service_contacts(owner_id,value,type)
VALUES ('3','mysnail@gmail.com','admin');
INSERT INTO service_contacts(owner_id,value,type)
VALUES ('3','mygrail@gmail.com','admin');
INSERT INTO service_contacts(owner_id,value,type)
VALUES ('3','myfail@gmail.com','admin');
INSERT INTO service_contacts(owner_id,value,type)
VALUES ('4','mymail@gmail.com','admin');
INSERT INTO service_contacts(owner_id,value,type)
VALUES ('4','mysnail@gmail.com','admin');
INSERT INTO service_contacts(owner_id,value,type)
VALUES ('4','mygrail@gmail.com','admin');
INSERT INTO service_contacts(owner_id,value,type)
VALUES ('4','myfail@gmail.com','admin');
INSERT INTO service_contacts(owner_id,value,type)
VALUES ('5','mymail@gmail.com','admin');
INSERT INTO service_contacts(owner_id,value,type)
VALUES ('5','mysnail@gmail.com','admin');
INSERT INTO service_contacts(owner_id,value,type)
VALUES ('5','mygrail@gmail.com','admin');
INSERT INTO service_contacts(owner_id,value,type)
VALUES ('5','myfail@gmail.com','admin');
INSERT INTO service_contacts(owner_id,value,type)
VALUES ('6','mygrail@gmail.com','admin');
INSERT INTO service_contacts(owner_id,value,type)
VALUES ('6','myfail@gmail.com','admin');
INSERT INTO service_contacts(owner_id,value,type)
VALUES ('7','mygrail@gmail.com','admin');
INSERT INTO service_contacts(owner_id,value,type)
VALUES ('7','myfail@gmail.com','admin');
INSERT INTO service_contacts(owner_id,value,type)
VALUES ('8','mymail@gmail.com','admin');
INSERT INTO service_contacts(owner_id,value,type)
VALUES ('8','mysnail@gmail.com','admin');
INSERT INTO service_contacts(owner_id,value,type)
VALUES ('8','mygrail@gmail.com','admin');
INSERT INTO service_contacts(owner_id,value,type)
VALUES ('8','myfail@gmail.com','admin');
INSERT INTO service_contacts(owner_id,value,type)
VALUES ('9','mygrail@gmail.com','admin');
INSERT INTO service_contacts(owner_id,value,type)
VALUES ('9','myfail@gmail.com','admin');
INSERT INTO service_contacts(owner_id,value,type)
VALUES ('10','mygrail@gmail.com','admin');
INSERT INTO service_contacts(owner_id,value,type)
VALUES ('10','myfail@gmail.com','admin');


INSERT INTO service_oidc_grant_types(owner_id,value)
VALUES ('1','implicit');
INSERT INTO service_oidc_grant_types(owner_id,value)
VALUES ('1','authorization_code');
INSERT INTO service_oidc_grant_types(owner_id,value)
VALUES ('1','refresh_token');
INSERT INTO service_oidc_grant_types(owner_id,value)
VALUES ('2','implicit');
INSERT INTO service_oidc_grant_types(owner_id,value)
VALUES ('2','authorization_code');
INSERT INTO service_oidc_grant_types(owner_id,value)
VALUES ('2','refresh_token');
INSERT INTO service_oidc_grant_types(owner_id,value)
VALUES ('3','implicit');
INSERT INTO service_oidc_grant_types(owner_id,value)
VALUES ('3','authorization_code');
INSERT INTO service_oidc_grant_types(owner_id,value)
VALUES ('3','refresh_token');
INSERT INTO service_oidc_grant_types(owner_id,value)
VALUES ('4','implicit');
INSERT INTO service_oidc_grant_types(owner_id,value)
VALUES ('4','authorization_code');
INSERT INTO service_oidc_grant_types(owner_id,value)
VALUES ('4','refresh_token');
INSERT INTO service_oidc_grant_types(owner_id,value)
VALUES ('5','implicit');
INSERT INTO service_oidc_grant_types(owner_id,value)
VALUES ('5','authorization_code');
INSERT INTO service_oidc_grant_types(owner_id,value)
VALUES ('5','refresh_token');
INSERT INTO service_oidc_grant_types(owner_id,value)
VALUES ('7','implicit');
INSERT INTO service_oidc_grant_types(owner_id,value)
VALUES ('7','authorization_code');
INSERT INTO service_oidc_grant_types(owner_id,value)
VALUES ('7','refresh_token');
INSERT INTO service_oidc_grant_types(owner_id,value)
VALUES ('8','implicit');
INSERT INTO service_oidc_grant_types(owner_id,value)
VALUES ('8','authorization_code');
INSERT INTO service_oidc_grant_types(owner_id,value)
VALUES ('8','refresh_token');


INSERT INTO service_oidc_redirect_uris(owner_id,value)
VALUES ('1','https://redirecturi1.com');
INSERT INTO service_oidc_redirect_uris(owner_id,value)
VALUES ('1','https://redirecturi2.com');
INSERT INTO service_oidc_redirect_uris(owner_id,value)
VALUES ('2','https://redirecturi1.com');
INSERT INTO service_oidc_redirect_uris(owner_id,value)
VALUES ('2','https://redirecturi2.com');
INSERT INTO service_oidc_redirect_uris(owner_id,value)
VALUES ('3','https://redirecturi1.com');
INSERT INTO service_oidc_redirect_uris(owner_id,value)
VALUES ('3','https://redirecturi2.com');
INSERT INTO service_oidc_redirect_uris(owner_id,value)
VALUES ('4','https://redirecturi.com');
INSERT INTO service_oidc_redirect_uris(owner_id,value)
VALUES ('5','https://redirecturi.com');
INSERT INTO service_oidc_redirect_uris(owner_id,value)
VALUES ('7','https://redirecturi2.com');
INSERT INTO service_oidc_redirect_uris(owner_id,value)
VALUES ('7','https://redirecturi.com');
INSERT INTO service_oidc_redirect_uris(owner_id,value)
VALUES ('8','https://redirecturi.com');


INSERT INTO service_oidc_scopes(owner_id,value)
VALUES ('1','electroscope');
INSERT INTO service_oidc_scopes(owner_id,value)
VALUES ('2','microscope');
INSERT INTO service_oidc_scopes(owner_id,value)
VALUES ('3','stethoscope');
INSERT INTO service_oidc_scopes(owner_id,value)
VALUES ('4','kaleidoscope');
INSERT INTO service_oidc_scopes(owner_id,value)
VALUES ('5','telescope');
INSERT INTO service_oidc_scopes(owner_id,value)
VALUES ('7','kaleidoscope');
INSERT INTO service_oidc_scopes(owner_id,value)
VALUES ('8','telescope');


INSERT INTO service_petition_details (service_description,service_name,logo_uri,policy_uri,integration_environment,requester,status,service_id,reviewed_at,protocol,tenant,country,website_url,organization_id)
VALUES ('Lorem ipsum dolor sit amet, consectetur adipiscing elit. Aenean in ex in tellus congue commodo. Suspendisse condimentum purus ante, in ornare leo egestas ut.','Client 1','https://cdn.vox-cdn.com/thumbor/0n6dqQfk9MuOBSiM39Pog2Bw39Y=/1400x1400/filters:format(jpeg)/cdn.vox-cdn.com/uploads/chorus_asset/file/19341372/microsoftedgenewlogo.jpg','https://policy_uri.com','demo','4359841657275796f20734f26d7b60c515f17cd36bad58d29ed87d000d621974@tenant_1.eu','approved',1,'2004-10-19 10:23:54','oidc','tenant_1','gr','https://my_service_website',1);
INSERT INTO service_petition_details (service_description,service_name,logo_uri,policy_uri,integration_environment,requester,status,service_id,reviewed_at,protocol,tenant,country,website_url,organization_id)
VALUES ('Lorem ipsum dolor sit amet, consectetur adipiscing elit. Aenean in ex in tellus congue commodo. Suspendisse condimentum purus ante, in ornare leo egestas ut.','Client 2','https://i.pinimg.com/originals/33/b8/69/33b869f90619e81763dbf1fccc896d8d.jpg','https://policy_uri.com','production','4359841657275796f20734f26d7b60c515f17cd36bad58d29ed87d000d621974@tenant_1.eu','approved',2,'2004-10-19 10:23:54','oidc','tenant_1','gr','https://my_service_website',1);
INSERT INTO service_petition_details (service_description,service_name,logo_uri,policy_uri,integration_environment,requester,status,service_id,reviewed_at,protocol,tenant,country,website_url,organization_id)
VALUES ('Lorem ipsum dolor sit amet, consectetur adipiscing elit. Aenean in ex in tellus congue commodo. Suspendisse condimentum purus ante, in ornare leo egestas ut.','Client 3','https://encrypted-tbn0.gstatic.com/images?q=tbn%3AANd9GcROY_lTxPGm6_XjUncdBfqkSbRoFoEf4BLBlQ&usqp=CAU','https://policy_uri.com','demo','4359841657275796f20734f26d7b60c515f17cd36bad58d29ed87d000d621974@tenant_1.eu','approved',3,'2004-10-19 10:23:54','oidc','tenant_1','gr','https://my_service_website',1);
INSERT INTO service_petition_details (service_description,service_name,logo_uri,policy_uri,integration_environment,requester,status,service_id,reviewed_at,protocol,tenant,country,website_url,organization_id)
VALUES ('Lorem ipsum dolor sit amet, consectetur adipiscing elit. Aenean in ex in tellus congue commodo. Suspendisse condimentum purus ante, in ornare leo egestas ut.','Client 4','https://brandmark.io/logo-rank/random/pepsi.png','https://policy_uri.com','development','4359841657275796f20734f26d7b60c515f17cd36bad58d29ed87d000d621974@tenant_1.eu','approved',4,'2004-10-19 10:23:54','oidc','tenant_1','gr','https://my_service_website',1);
INSERT INTO service_petition_details (service_description,service_name,logo_uri,policy_uri,integration_environment,requester,status,service_id,reviewed_at,protocol,tenant,country,website_url,organization_id)
VALUES ('Lorem ipsum dolor sit amet, consectetur adipiscing elit. Aenean in ex in tellus congue commodo. Suspendisse condimentum purus ante, in ornare leo egestas ut.','Client 5','https://brandmark.io/logo-rank/random/pepsi.png','https://policy_uri.com','development','7a6ae5617ea76389401e3c3839127fd2a019572066d40c5d0176bd242651f934@tenant_1.eu','approved',5,'2004-10-19 10:23:54','oidc','tenant_1','gr','https://my_service_website',1);
INSERT INTO service_petition_details (service_description,service_name,logo_uri,policy_uri,integration_environment,requester,type,service_id,protocol,tenant,country,last_edited,website_url,organization_id)
VALUES ('Lorem ipsum dolor sit amet, consectetur adipiscing elit. Aenean in ex in tellus congue commodo. Suspendisse condimentum purus ante, in ornare leo egestas ut.','Client 5 new','https://images.fastcompany.net/image/upload/w_596,c_limit,q_auto:best,f_auto/fc/3034007-inline-i-applelogo.jpg','https://policy_uri.com','development','7a6ae5617ea76389401e3c3839127fd2a019572066d40c5d0176bd242651f934@tenant_1.eu','edit',5,'oidc','tenant_1','gr','2021-01-27 10:23:54','https://my_service_website',1);
INSERT INTO service_petition_details (service_description,service_name,logo_uri,policy_uri,integration_environment,requester,type,protocol,group_id,tenant,country,last_edited,website_url,organization_id)
VALUES ('Lorem ipsum dolor sit amet, consectetur adipiscing elit. Aenean in ex in tellus congue commodo. Suspendisse condimentum purus ante, in ornare leo egestas ut.','Client 7','https://www.bookmarks.design/media/image/hatchful.jpg','https://policy_uri.com','development','4359841657275796f20734f26d7b60c515f17cd36bad58d29ed87d000d621974@tenant_1.eu','create','oidc',7,'tenant_1','gr','2021-01-29 10:23:54','https://my_service_website',1);
INSERT INTO service_petition_details (service_description,service_name,logo_uri,policy_uri,integration_environment,requester,type,service_id,protocol,tenant,country,last_edited,website_url,organization_id)
VALUES ('Lorem ipsum dolor sit amet, consectetur adipiscing elit. Aenean in ex in tellus congue commodo. Suspendisse condimentum purus ante, in ornare leo egestas ut.','Client 1','https://cdn.vox-cdn.com/thumbor/0n6dqQfk9MuOBSiM39Pog2Bw39Y=/1400x1400/filters:format(jpeg)/cdn.vox-cdn.com/uploads/chorus_asset/file/19341372/microsoftedgenewlogo.jpg','https://policy_uri.com','demo','4359841657275796f20734f26d7b60c515f17cd36bad58d29ed87d000d621974@tenant_1.eu','delete',1,'oidc','tenant_1','gr','2021-01-28 10:23:54','https://my_service_website',1);
INSERT INTO service_petition_details (service_description,service_name,logo_uri,policy_uri,integration_environment,requester,status,type,service_id,reviewed_at,protocol,tenant,country,website_url,organization_id)
VALUES ('Lorem ipsum dolor sit amet, consectetur adipiscing elit. Aenean in ex in tellus congue commodo. Suspendisse condimentum purus ante, in ornare leo egestas ut.','Saml 6','https://cdn.auth0.com/blog/duo-saml-exploit/saml.png','https://policy_uri.com','development','4359841657275796f20734f26d7b60c515f17cd36bad58d29ed87d000d621974@tenant_1.eu','approved','create',6,'2020-10-4 13:18:11','saml','tenant_1','gr','https://my_service_website',1);


INSERT INTO service_petition_details (service_description,service_name,logo_uri,policy_uri,integration_environment,requester,status,service_id,reviewed_at,protocol,group_id,tenant,country,website_url,organization_id)
VALUES ('Lorem ipsum dolor sit amet, consectetur adipiscing elit. Aenean in ex in tellus congue commodo. Suspendisse condimentum purus ante, in ornare leo egestas ut.','tenant_2 OIDC Service 1','https://nat.sakimura.org/wp-content/uploads/2012/02/openid-icon-250x250.png','https://policy_uri.com','demo','4e38406c89591bb08e070accbce62140cfc8beb40314c03aa82cf3683ac270b5@aai.tenant_2-portal.eu','approved',7,'2004-10-19 10:23:54','oidc',8,'tenant_2','gr','https://my_service_website',1);
INSERT INTO service_petition_details (service_description,service_name,logo_uri,policy_uri,integration_environment,requester,status,service_id,reviewed_at,protocol,group_id,tenant,country,website_url,organization_id)
VALUES ('Lorem ipsum dolor sit amet, consectetur adipiscing elit. Aenean in ex in tellus congue commodo. Suspendisse condimentum purus ante, in ornare leo egestas ut.','tenant_2 OIDC Service 2','https://nat.sakimura.org/wp-content/uploads/2012/02/openid-icon-250x250.png','https://policy_uri.com','production','4e38406c89591bb08e070accbce62140cfc8beb40314c03aa82cf3683ac270b5@aai.tenant_2-portal.eu','approved',8,'2004-10-19 10:23:54','oidc',9,'tenant_2','gr','https://my_service_website',1);
INSERT INTO service_petition_details (service_description,service_name,logo_uri,policy_uri,integration_environment,requester,status,service_id,reviewed_at,protocol,group_id,tenant,country,website_url,organization_id)
VALUES ('Lorem ipsum dolor sit amet, consectetur adipiscing elit. Aenean in ex in tellus congue commodo. Suspendisse condimentum purus ante, in ornare leo egestas ut.','tenant_2 SAML Service 1','https://cdn.auth0.com/blog/duo-saml-exploit/saml.png','https://policy_uri.com','demo','4e38406c89591bb08e070accbce62140cfc8beb40314c03aa82cf3683ac270b5@aai.tenant_2-portal.eu','approved',9,'2004-10-19 10:23:54','saml',10,'tenant_2','gr','https://my_service_website',1);


INSERT INTO service_petition_details_oidc (id,client_id,allow_introspection,client_secret,reuse_refresh_token,clear_access_tokens_on_refresh,id_token_timeout_seconds,access_token_validity_seconds,refresh_token_validity_seconds,code_challenge_method,device_code_validity_seconds,token_endpoint_auth_method,token_endpoint_auth_signing_alg,application_type)
VALUES (1,'client1',true,'secret',true,true,600,3600,28800,'plain',10000,'client_secret_basic','','WEB');
INSERT INTO service_petition_details_oidc (id,client_id,allow_introspection,client_secret,reuse_refresh_token,clear_access_tokens_on_refresh,id_token_timeout_seconds,access_token_validity_seconds,refresh_token_validity_seconds,code_challenge_method,device_code_validity_seconds,token_endpoint_auth_method,token_endpoint_auth_signing_alg,application_type)
VALUES (2,'client2',true,'secret',true,true,600,3600,28800,'plain',10000,'client_secret_basic','','WEB');
INSERT INTO service_petition_details_oidc (id,client_id,allow_introspection,client_secret,reuse_refresh_token,clear_access_tokens_on_refresh,id_token_timeout_seconds,access_token_validity_seconds,refresh_token_validity_seconds,code_challenge_method,device_code_validity_seconds,token_endpoint_auth_method,token_endpoint_auth_signing_alg,application_type)
VALUES (3,'client3',true,'secret',true,true,600,3600,28800,'plain',10000,'client_secret_basic','','WEB');
INSERT INTO service_petition_details_oidc (id,client_id,allow_introspection,client_secret,reuse_refresh_token,clear_access_tokens_on_refresh,id_token_timeout_seconds,access_token_validity_seconds,refresh_token_validity_seconds,code_challenge_method,device_code_validity_seconds,token_endpoint_auth_method,token_endpoint_auth_signing_alg,application_type)
VALUES (4,'client4',true,'secret',true,true,600,36,28800,'plain',10000,'client_secret_basic','','WEB');
INSERT INTO service_petition_details_oidc (id,client_id,allow_introspection,client_secret,reuse_refresh_token,clear_access_tokens_on_refresh,id_token_timeout_seconds,access_token_validity_seconds,refresh_token_validity_seconds,code_challenge_method,device_code_validity_seconds,token_endpoint_auth_method,token_endpoint_auth_signing_alg,application_type)
VALUES (5,'client5',true,'secret',true,true,600,3600,28800,'plain',10000,'client_secret_basic','','WEB');
INSERT INTO service_petition_details_oidc (id,client_id,allow_introspection,client_secret,reuse_refresh_token,clear_access_tokens_on_refresh,id_token_timeout_seconds,access_token_validity_seconds,refresh_token_validity_seconds,code_challenge_method,device_code_validity_seconds,token_endpoint_auth_method,token_endpoint_auth_signing_alg,application_type)
VALUES (6,'client5',true,'secret',true,true,600,3600,28800,'plain',10000,'client_secret_basic','','WEB');
INSERT INTO service_petition_details_oidc (id,client_id,allow_introspection,client_secret,reuse_refresh_token,clear_access_tokens_on_refresh,id_token_timeout_seconds,access_token_validity_seconds,refresh_token_validity_seconds,code_challenge_method,device_code_validity_seconds,token_endpoint_auth_method,token_endpoint_auth_signing_alg,application_type)
VALUES (7,'client7',true,'secret',true,true,600,3600,28800,'plain',10000,'client_secret_basic','','WEB');
INSERT INTO service_petition_details_oidc (id,client_id,allow_introspection,client_secret,reuse_refresh_token,clear_access_tokens_on_refresh,id_token_timeout_seconds,access_token_validity_seconds,refresh_token_validity_seconds,code_challenge_method,device_code_validity_seconds,token_endpoint_auth_method,token_endpoint_auth_signing_alg,application_type)
VALUES (8,'client1',true,'secret',true,true,600,3600,28800,'plain',10000,'client_secret_basic','','WEB');
INSERT INTO service_petition_details_oidc (id,client_id,allow_introspection,client_secret,reuse_refresh_token,clear_access_tokens_on_refresh,id_token_timeout_seconds,access_token_validity_seconds,refresh_token_validity_seconds,code_challenge_method,device_code_validity_seconds,token_endpoint_auth_method,token_endpoint_auth_signing_alg,application_type)
VALUES (10,'client1',true,'secret',true,true,600,3600,28800,'plain',10000,'client_secret_basic','','WEB');
INSERT INTO service_petition_details_oidc (id,client_id,allow_introspection,client_secret,reuse_refresh_token,clear_access_tokens_on_refresh,id_token_timeout_seconds,access_token_validity_seconds,refresh_token_validity_seconds,code_challenge_method,device_code_validity_seconds,token_endpoint_auth_method,token_endpoint_auth_signing_alg,application_type)
VALUES (11,'client2',true,'secret',true,true,600,3600,28800,'plain',10000,'client_secret_basic','','WEB');


INSERT INTO service_petition_details_saml (id,entity_id,metadata_url)
VALUES (9,'https://saml-id-1.com','https://metadataurl.com');
INSERT INTO service_petition_contacts(owner_id,value,type)
VALUES (9,'mygrail@gmail.com','admin');
INSERT INTO service_petition_contacts(owner_id,value,type)
VALUES (12,'myfail@gmail.com','admin');
INSERT INTO service_petition_details_saml (id,entity_id,metadata_url)
VALUES (12,'https://saml-id-1.com','https://metadataurl.com');
INSERT INTO service_petition_contacts(owner_id,value,type)
VALUES (12,'mygrail@gmail.com','admin');
INSERT INTO service_petition_contacts(owner_id,value,type)
VALUES (12,'myfail@gmail.com','admin');


INSERT INTO service_petition_contacts(owner_id,value,type)
VALUES ('1','mymail@gmail.com','admin');
INSERT INTO service_petition_contacts(owner_id,value,type)
VALUES ('1','mysnail@gmail.com','admin');
INSERT INTO service_petition_contacts(owner_id,value,type)
VALUES ('1','mygrail@gmail.com','admin');
INSERT INTO service_petition_contacts(owner_id,value,type)
VALUES ('1','myfail@gmail.com','admin');
INSERT INTO service_petition_contacts(owner_id,value,type)
VALUES ('2','mymail@gmail.com','admin');
INSERT INTO service_petition_contacts(owner_id,value,type)
VALUES ('2','mysnail@gmail.com','admin');
INSERT INTO service_petition_contacts(owner_id,value,type)
VALUES ('2','mygrail@gmail.com','admin');
INSERT INTO service_petition_contacts(owner_id,value,type)
VALUES ('2','myfail@gmail.com','admin');
INSERT INTO service_petition_contacts(owner_id,value,type)
VALUES ('3','mymail@gmail.com','admin');
INSERT INTO service_petition_contacts(owner_id,value,type)
VALUES ('3','mysnail@gmail.com','admin');
INSERT INTO service_petition_contacts(owner_id,value,type)
VALUES ('3','mygrail@gmail.com','admin');
INSERT INTO service_petition_contacts(owner_id,value,type)
VALUES ('3','myfail@gmail.com','admin');
INSERT INTO service_petition_contacts(owner_id,value,type)
VALUES ('4','mymail@gmail.com','admin');
INSERT INTO service_petition_contacts(owner_id,value,type)
VALUES ('4','mysnail@gmail.com','admin');
INSERT INTO service_petition_contacts(owner_id,value,type)
VALUES ('4','mygrail@gmail.com','admin');
INSERT INTO service_petition_contacts(owner_id,value,type)
VALUES ('4','myfail@gmail.com','admin');
INSERT INTO service_petition_contacts(owner_id,value,type)
VALUES ('5','mymail@gmail.com','admin');
INSERT INTO service_petition_contacts(owner_id,value,type)
VALUES ('5','mysnail@gmail.com','admin');
INSERT INTO service_petition_contacts(owner_id,value,type)
VALUES ('5','mygrail@gmail.com','admin');
INSERT INTO service_petition_contacts(owner_id,value,type)
VALUES ('5','myfail@gmail.com','admin');
INSERT INTO service_petition_contacts(owner_id,value,type)
VALUES ('6','mygrail@gmail.com','admin');
INSERT INTO service_petition_contacts(owner_id,value,type)
VALUES ('6','myfail@gmail.com','admin');
INSERT INTO service_petition_contacts(owner_id,value,type)
VALUES ('7','mygrail@gmail.com','admin');
INSERT INTO service_petition_contacts(owner_id,value,type)
VALUES ('7','myfail@gmail.com','admin');
INSERT INTO service_petition_contacts(owner_id,value,type)
VALUES ('8','mymail@gmail.com','admin');
INSERT INTO service_petition_contacts(owner_id,value,type)
VALUES ('8','mysnail@gmail.com','admin');
INSERT INTO service_petition_contacts(owner_id,value,type)
VALUES ('8','mygrail@gmail.com','admin');
INSERT INTO service_petition_contacts(owner_id,value,type)
VALUES ('8','myfail@gmail.com','admin');
INSERT INTO service_petition_contacts(owner_id,value,type)
VALUES ('10','mygrail@gmail.com','admin');
INSERT INTO service_petition_contacts(owner_id,value,type)
VALUES ('10','myfail@gmail.com','admin');
INSERT INTO service_petition_contacts(owner_id,value,type)
VALUES ('11','mymail@gmail.com','admin');
INSERT INTO service_petition_contacts(owner_id,value,type)
VALUES ('11','mysnail@gmail.com','admin');
INSERT INTO service_petition_contacts(owner_id,value,type)
VALUES ('11','mygrail@gmail.com','admin');
INSERT INTO service_petition_contacts(owner_id,value,type)
VALUES ('11','myfail@gmail.com','admin');


INSERT INTO service_petition_oidc_grant_types(owner_id,value)
VALUES ('1','implicit');
INSERT INTO service_petition_oidc_grant_types(owner_id,value)
VALUES ('1','authorization_code');
INSERT INTO service_petition_oidc_grant_types(owner_id,value)
VALUES ('1','refresh_token');
INSERT INTO service_petition_oidc_grant_types(owner_id,value)
VALUES ('2','implicit');
INSERT INTO service_petition_oidc_grant_types(owner_id,value)
VALUES ('2','authorization_code');
INSERT INTO service_petition_oidc_grant_types(owner_id,value)
VALUES ('2','refresh_token');
INSERT INTO service_petition_oidc_grant_types(owner_id,value)
VALUES ('3','implicit');
INSERT INTO service_petition_oidc_grant_types(owner_id,value)
VALUES ('3','authorization_code');
INSERT INTO service_petition_oidc_grant_types(owner_id,value)
VALUES ('3','refresh_token');
INSERT INTO service_petition_oidc_grant_types(owner_id,value)
VALUES ('4','implicit');
INSERT INTO service_petition_oidc_grant_types(owner_id,value)
VALUES ('4','authorization_code');
INSERT INTO service_petition_oidc_grant_types(owner_id,value)
VALUES ('4','refresh_token');
INSERT INTO service_petition_oidc_grant_types(owner_id,value)
VALUES ('5','implicit');
INSERT INTO service_petition_oidc_grant_types(owner_id,value)
VALUES ('5','authorization_code');
INSERT INTO service_petition_oidc_grant_types(owner_id,value)
VALUES ('5','refresh_token');
INSERT INTO service_petition_oidc_grant_types(owner_id,value)
VALUES ('6','implicit');
INSERT INTO service_petition_oidc_grant_types(owner_id,value)
VALUES ('7','authorization_code');
INSERT INTO service_petition_oidc_grant_types(owner_id,value)
VALUES ('7','refresh_token');
INSERT INTO service_petition_oidc_grant_types(owner_id,value)
VALUES ('8','implicit');
INSERT INTO service_petition_oidc_grant_types(owner_id,value)
VALUES ('8','authorization_code');
INSERT INTO service_petition_oidc_grant_types(owner_id,value)
VALUES ('8','refresh_token');
INSERT INTO service_petition_oidc_grant_types(owner_id,value)
VALUES ('10','authorization_code');
INSERT INTO service_petition_oidc_grant_types(owner_id,value)
VALUES ('10','refresh_token');
INSERT INTO service_petition_oidc_grant_types(owner_id,value)
VALUES ('11','implicit');
INSERT INTO service_petition_oidc_grant_types(owner_id,value)
VALUES ('11','authorization_code');
INSERT INTO service_petition_oidc_grant_types(owner_id,value)
VALUES ('11','refresh_token');


INSERT INTO service_petition_oidc_redirect_uris(owner_id,value)
VALUES ('1','https://redirecturi1.com');
INSERT INTO service_petition_oidc_redirect_uris(owner_id,value)
VALUES ('1','https://redirecturi2.com');
INSERT INTO service_petition_oidc_redirect_uris(owner_id,value)
VALUES ('2','https://redirecturi1.com');
INSERT INTO service_petition_oidc_redirect_uris(owner_id,value)
VALUES ('2','https://redirecturi2.com');
INSERT INTO service_petition_oidc_redirect_uris(owner_id,value)
VALUES ('3','https://redirecturi1.com');
INSERT INTO service_petition_oidc_redirect_uris(owner_id,value)
VALUES ('3','https://redirecturi2.com');
INSERT INTO service_petition_oidc_redirect_uris(owner_id,value)
VALUES ('4','https://redirecturi.com');
INSERT INTO service_petition_oidc_redirect_uris(owner_id,value)
VALUES ('5','https://redirecturi.com');
INSERT INTO service_petition_oidc_redirect_uris(owner_id,value)
VALUES ('6','https://redirecturi.com');
INSERT INTO service_petition_oidc_redirect_uris(owner_id,value)
VALUES ('7','https://redirecturi2.com');
INSERT INTO service_petition_oidc_redirect_uris(owner_id,value)
VALUES ('7','https://redirecturi.com');
INSERT INTO service_petition_oidc_redirect_uris(owner_id,value)
VALUES ('8','https://redirecturi1.com');
INSERT INTO service_petition_oidc_redirect_uris(owner_id,value)
VALUES ('8','https://redirecturi2.com');
INSERT INTO service_petition_oidc_redirect_uris(owner_id,value)
VALUES ('10','https://redirecturi2.com');
INSERT INTO service_petition_oidc_redirect_uris(owner_id,value)
VALUES ('10','https://redirecturi.com');
INSERT INTO service_petition_oidc_redirect_uris(owner_id,value)
VALUES ('11','https://redirecturi1.com');
INSERT INTO service_petition_oidc_redirect_uris(owner_id,value)
VALUES ('11','https://redirecturi2.com');


INSERT INTO service_petition_oidc_scopes(owner_id,value)
VALUES ('1','electroscope');
INSERT INTO service_petition_oidc_scopes(owner_id,value)
VALUES ('2','microscope');
INSERT INTO service_petition_oidc_scopes(owner_id,value)
VALUES ('3','stethoscope');
INSERT INTO service_petition_oidc_scopes(owner_id,value)
VALUES ('4','kaleidoscope');
INSERT INTO service_petition_oidc_scopes(owner_id,value)
VALUES ('5','telescope');
INSERT INTO service_petition_oidc_scopes(owner_id,value)
VALUES ('6','stethoscope');
INSERT INTO service_petition_oidc_scopes(owner_id,value)
VALUES ('6','kaleidoscope');
INSERT INTO service_petition_oidc_scopes(owner_id,value)
VALUES ('7','telescope');
INSERT INTO service_petition_oidc_scopes(owner_id,value)
VALUES ('8','electroscope');
INSERT INTO service_petition_oidc_scopes(owner_id,value)
VALUES ('10','telescope');
INSERT INTO service_petition_oidc_scopes(owner_id,value)
VALUES ('11','electroscope');


INSERT INTO user_info(sub,preferred_username,name,given_name,family_name,email,tenant,role_id)
VALUES ('4359841657275796f20734f26d7b60c515f17cd36bad58d29ed87d000d621934@tenant_1.eu','asdasd','aas','asdas','asdasd','testmail@mail.com','tenant_1',1);
INSERT INTO user_edu_person_entitlement (user_id,edu_person_entitlement)
VALUES (1,'urn:mace:tenant_1.eu:group:service-integration.aai.tenant_1.eu:role=member#aai.tenant_1.eu');
INSERT INTO user_info(sub,preferred_username,name,given_name,family_name,email,tenant,role_id)
VALUES ('test_tenant_1_end_user','test_tenant_1_end_user','test_tenant_1_end_user','test_tenant_1_end_user','test_tenant_1_end_user','testmail@mail.com','tenant_1',1);
INSERT INTO user_edu_person_entitlement (user_id,edu_person_entitlement)
VALUES (2,'urn:mace:tenant_1.eu:group:service-integration.aai.tenant_1.eu:role=member#aai.tenant_1.eu');
INSERT INTO user_info(sub,preferred_username,name,given_name,family_name,email,tenant,role_id)
VALUES ('test_tenant_1_operator_user','test_tenant_1_operator_user','test_tenant_1_operator_user','test_tenant_1_operator_user','test_tenant_1_operator_user','testmail@mail.com','tenant_1',2);
INSERT INTO user_edu_person_entitlement (user_id,edu_person_entitlement)
VALUES (3,'urn:mace:tenant_1.eu:group:service-integration.aai.tenant_1.eu:role=member#aai.tenant_1.eu');
INSERT INTO user_info(sub,preferred_username,name,given_name,family_name,email,tenant,role_id)
VALUES ('test_tenant_1_manager_user','test_tenant_1_manager_user','test_tenant_1_manager_user','test_tenant_1_manager_user','test_tenant_1_manager_user','testmail@mail.com','tenant_1',3);
INSERT INTO user_edu_person_entitlement (user_id,edu_person_entitlement)
VALUES (4,'urn:mace:tenant_1.eu:group:service-integration.aai.tenant_1.eu:role=member#aai.tenant_1.eu');
INSERT INTO user_info(sub,preferred_username,name,given_name,family_name,email,tenant,role_id)
VALUES ('test_tenant_2_end_user','test_tenant_2_end_user','test_tenant_2_end_user','test_tenant_2_end_user','test_tenant_2_end_user','testmail@mail.com','tenant_2',4);
INSERT INTO user_edu_person_entitlement (user_id,edu_person_entitlement)
VALUES (5,'urn:mace:tenant_1.eu:group:service-integration.aai.tenant_1.eu:role=member#aai.tenant_1.eu');
INSERT INTO user_info(sub,preferred_username,name,given_name,family_name,email,tenant,role_id)
VALUES ('test_tenant_2_operator_user','test_tenant_2_operator_user','test_tenant_2_operator_user','test_tenant_2_operator_user','test_tenant_2_operator_user','testmail@mail.com','tenant_2',5);
INSERT INTO user_edu_person_entitlement (user_id,edu_person_entitlement)
VALUES (6,'urn:mace:tenant_1.eu:group:service-integration.aai.tenant_1.eu:role=member#aai.tenant_1.eu');
INSERT INTO user_info(sub,preferred_username,name,given_name,family_name,email,tenant,role_id)
VALUES ('test_tenant_2_manager_user','test_tenant_2_manager_user','test_tenant_2_manager_user','test_tenant_2_manager_user','test_tenant_2_manager_user','testmail@mail.com','tenant_2',6);
INSERT INTO user_edu_person_entitlement (user_id,edu_person_entitlement)
VALUES (7,'urn:mace:tenant_1.eu:group:service-integration.aai.tenant_1.eu:role=member#aai.tenant_1.eu');
INSERT INTO user_info(sub,preferred_username,name,given_name,family_name,email,tenant,role_id)
VALUES ('test_tenant_1_operator_user_2','test_tenant_1_operator_user','test_tenant_1_operator_user2','test_tenant_1_operator_user','test_tenant_1_operator_user','testmai1l@mail.com','tenant_1',2);
INSERT INTO user_edu_person_entitlement (user_id,edu_person_entitlement)
VALUES (8,'urn:mace:tenant_1.eu:group:service-integration.aai.tenant_1.eu:role=member#aai.tenant_1.eu');
INSERT INTO user_info(sub,preferred_username,name,given_name,family_name,email,tenant,role_id)
VALUES ('test_tenant_1_operator_user_3','test_tenant_1_operator_user','test_tenant_1_operator_user3','test_tenant_1_operator_user','test_tenant_1_operator_user','testmail2@mail.com','tenant_1',2);
INSERT INTO user_edu_person_entitlement (user_id,edu_person_entitlement)
VALUES (9,'urn:mace:tenant_1.eu:group:service-integration.aai.tenant_1.eu:role=member#aai.tenant_1.eu');


INSERT INTO user_roles (role_name,tenant)
VALUES ('End User','tenant_1');
INSERT INTO user_roles(role_name,tenant)
VALUES ('Operator','tenant_1');
INSERT INTO user_roles(role_name,tenant)
VALUES ('Manager','tenant_1');
INSERT INTO user_roles (role_name,tenant)
VALUES ('End User','tenant_2');
INSERT INTO user_roles(role_name,tenant)
VALUES ('Operator','tenant_2');
INSERT INTO user_roles(role_name,tenant)
VALUES ('Manager','tenant_2');


INSERT INTO role_entitlements (role_id,entitlement)
VALUES (3,'urn:mace:tenant_1.eu:group:service-integration.aai.tenant_1.eu:role=approver#aai.tenant_1.eu');
INSERT INTO role_entitlements (role_id,entitlement)
VALUES (2,'urn:mace:tenant_1.eu:group:service-integration.aai.tenant_1.eu:role=member#aai.tenant_1.eu');
INSERT INTO role_entitlements (role_id,entitlement)
VALUES (6,'urn:mace:tenant_1.eu:group:service-integration.aai.tenant_1.eu:role=approver#aai.tenant_1.eu');
INSERT INTO role_entitlements (role_id,entitlement)
VALUES (5,'urn:mace:tenant_1.eu:group:service-integration.aai.tenant_1.eu:role=member#aai.tenant_1.eu');


INSERT INTO role_actions(role_id,action)
VALUES(1,'get_user');
INSERT INTO role_actions(role_id,action)
VALUES(1,'get_own_services');
INSERT INTO role_actions(role_id,action)
VALUES(1,'get_own_service');
INSERT INTO role_actions(role_id,action)
VALUES(1,'get_own_petitions');
INSERT INTO role_actions(role_id,action)
VALUES(1,'get_own_petition');
INSERT INTO role_actions(role_id,action)
VALUES(1,'add_own_petition');
INSERT INTO role_actions(role_id,action)
VALUES(1,'update_own_petition');
INSERT INTO role_actions(role_id,action)
VALUES(1,'delete_own_petition');
INSERT INTO role_actions(role_id,action)
VALUES(1,'view_errors');


INSERT INTO role_actions(role_id,action)
VALUES(2,'get_user');
INSERT INTO role_actions(role_id,action)
VALUES(2,'get_own_services');
INSERT INTO role_actions(role_id,action)
VALUES(2,'get_own_service');
INSERT INTO role_actions(role_id,action)
VALUES(2,'get_service');
INSERT INTO role_actions(role_id,action)
VALUES(2,'get_own_petitions');
INSERT INTO role_actions(role_id,action)
VALUES(2,'get_own_petition');
INSERT INTO role_actions(role_id,action)
VALUES(2,'get_petition');
INSERT INTO role_actions(role_id,action)
VALUES(2,'add_own_petition');
INSERT INTO role_actions(role_id,action)
VALUES(2,'update_own_petition');
INSERT INTO role_actions(role_id,action)
VALUES(2,'delete_own_petition');
INSERT INTO role_actions(role_id,action)
VALUES(2,'review_own_petition');
INSERT INTO role_actions(role_id,action)
VALUES(2,'review_petition');
INSERT INTO role_actions(role_id,action)
VALUES(2,'get_petitions');
INSERT INTO role_actions(role_id,action)
VALUES(2,'get_services');
INSERT INTO role_actions(role_id,action)
VALUES(2,'view_groups');
INSERT INTO role_actions(role_id,action)
VALUES(2,'invite_to_group');
INSERT INTO role_actions(role_id,action)
VALUES(2,'view_errors');
INSERT INTO role_actions(role_id,action)
VALUES(2,'review_notification');
INSERT INTO role_actions(role_id,action)
VALUES(2,'send_notifications');
INSERT INTO role_actions(role_id,action)
VALUES(2,'manage_tags');


INSERT INTO role_actions(role_id,action)
VALUES(3,'get_user');
INSERT INTO role_actions(role_id,action)
VALUES(3,'get_own_services');
INSERT INTO role_actions(role_id,action)
VALUES(3,'get_own_service');
INSERT INTO role_actions(role_id,action)
VALUES(3,'get_service');
INSERT INTO role_actions(role_id,action)
VALUES(3,'get_own_petitions');
INSERT INTO role_actions(role_id,action)
VALUES(3,'get_own_petition');
INSERT INTO role_actions(role_id,action)
VALUES(3,'get_petition');
INSERT INTO role_actions(role_id,action)
VALUES(3,'add_own_petition');
INSERT INTO role_actions(role_id,action)
VALUES(3,'update_own_petition');
INSERT INTO role_actions(role_id,action)
VALUES(3,'delete_own_petition');
INSERT INTO role_actions(role_id,action)
VALUES(3,'review_own_petition');
INSERT INTO role_actions(role_id,action)
VALUES(3,'review_restricted');
INSERT INTO role_actions(role_id,action)
VALUES(3,'review_petition');
INSERT INTO role_actions(role_id,action)
VALUES(3,'get_petitions');
INSERT INTO role_actions(role_id,action)
VALUES(3,'get_services');
INSERT INTO role_actions(role_id,action)
VALUES(3,'view_groups');
INSERT INTO role_actions(role_id,action)
VALUES(3,'invite_to_group');
INSERT INTO role_actions(role_id,action)
VALUES(3,'view_errors');
INSERT INTO role_actions(role_id,action)
VALUES(3,'send_notifications');
INSERT INTO role_actions(role_id,action)
VALUES(3,'manage_tags');


INSERT INTO role_actions(role_id,action)
VALUES(4,'get_user');
INSERT INTO role_actions(role_id,action)
VALUES(4,'get_own_services');
INSERT INTO role_actions(role_id,action)
VALUES(4,'get_own_service');
INSERT INTO role_actions(role_id,action)
VALUES(4,'get_own_petitions');
INSERT INTO role_actions(role_id,action)
VALUES(4,'get_own_petition');
INSERT INTO role_actions(role_id,action)
VALUES(4,'add_own_petition');
INSERT INTO role_actions(role_id,action)
VALUES(4,'update_own_petition');
INSERT INTO role_actions(role_id,action)
VALUES(4,'delete_own_petition');
INSERT INTO role_actions(role_id,action)
VALUES(4,'view_errors');


INSERT INTO role_actions(role_id,action)
VALUES(5,'get_user');
INSERT INTO role_actions(role_id,action)
VALUES(5,'get_own_services');
INSERT INTO role_actions(role_id,action)
VALUES(5,'get_own_service');
INSERT INTO role_actions(role_id,action)
VALUES(5,'get_service');
INSERT INTO role_actions(role_id,action)
VALUES(5,'get_own_petitions');
INSERT INTO role_actions(role_id,action)
VALUES(5,'get_own_petition');
INSERT INTO role_actions(role_id,action)
VALUES(5,'get_petition');
INSERT INTO role_actions(role_id,action)
VALUES(5,'add_own_petition');
INSERT INTO role_actions(role_id,action)
VALUES(5,'update_own_petition');
INSERT INTO role_actions(role_id,action)
VALUES(5,'delete_own_petition');
INSERT INTO role_actions(role_id,action)
VALUES(5,'review_own_petition');
INSERT INTO role_actions(role_id,action)
VALUES(5,'review_petition');
INSERT INTO role_actions(role_id,action)
VALUES(5,'get_petitions');
INSERT INTO role_actions(role_id,action)
VALUES(5,'get_services');
INSERT INTO role_actions(role_id,action)
VALUES(5,'view_groups');
INSERT INTO role_actions(role_id,action)
VALUES(5,'invite_to_group');
INSERT INTO role_actions(role_id,action)
VALUES(5,'view_errors');
INSERT INTO role_actions(role_id,action)
VALUES(5,'review_notification');
INSERT INTO role_actions(role_id,action)
VALUES(5,'send_notifications');
INSERT INTO role_actions(role_id,action)
VALUES(5,'manage_tags');


INSERT INTO role_actions(role_id,action)
VALUES(6,'get_user');
INSERT INTO role_actions(role_id,action)
VALUES(6,'get_own_services');
INSERT INTO role_actions(role_id,action)
VALUES(6,'get_own_service');
INSERT INTO role_actions(role_id,action)
VALUES(6,'get_service');
INSERT INTO role_actions(role_id,action)
VALUES(6,'get_own_petitions');
INSERT INTO role_actions(role_id,action)
VALUES(6,'get_own_petition');
INSERT INTO role_actions(role_id,action)
VALUES(6,'get_petition');
INSERT INTO role_actions(role_id,action)
VALUES(6,'add_own_petition');
INSERT INTO role_actions(role_id,action)
VALUES(6,'update_own_petition');
INSERT INTO role_actions(role_id,action)
VALUES(6,'delete_own_petition');
INSERT INTO role_actions(role_id,action)
VALUES(6,'review_own_petition');
INSERT INTO role_actions(role_id,action)
VALUES(6,'review_restricted');
INSERT INTO role_actions(role_id,action)
VALUES(6,'get_petitions');
INSERT INTO role_actions(role_id,action)
VALUES(6,'get_services');
INSERT INTO role_actions(role_id,action)
VALUES(6,'view_groups');
INSERT INTO role_actions(role_id,action)
VALUES(6,'invite_to_group');
INSERT INTO role_actions(role_id,action)
VALUES(6,'view_errors');
INSERT INTO role_actions(role_id,action)
VALUES(6,'send_notifications');
INSERT INTO role_actions(role_id,action)
VALUES(6,'review_petition');
INSERT INTO role_actions(role_id,action)
VALUES(6,'manage_tags');


INSERT INTO tenant_deployer_agents (tenant,integration_environment,type,entity_type,hostname,entity_protocol,deployer_name)
VALUES 
  ('tenant_1', 'production', 'keycloak', 'service', 'mock','oidc',null ),
  ('tenant_1', 'demo', 'keycloak', 'service', 'mock','oidc',null ),
  ('tenant_1', 'development', 'keycloak', 'service', 'mock','oidc',null ),
  ('tenant_1', 'production', 'ssp', 'service', 'mock','saml','1' ),
  ('tenant_1', 'production', 'ssp', 'service', 'mock','saml','2' ),
  ('tenant_1', 'demo', 'ssp', 'service', 'mock','saml','1' ),
  ('tenant_1', 'demo', 'ssp', 'service', 'mock','saml','2'),
  ('tenant_1', 'development', 'ssp', 'service', 'mock','saml',null ),
  ('tenant_2', 'production', 'keycloak', 'service', 'mock','saml',null ),
  ('tenant_2', 'production', 'keycloak', 'service', 'mock','oidc',null );

INSERT INTO groups (group_name)
VALUES ('group_1');
INSERT INTO groups (group_name)
VALUES ('group_2');
INSERT INTO groups (group_name)
VALUES ('group_3');
INSERT INTO groups (group_name)
VALUES ('group_4');
INSERT INTO groups (group_name)
VALUES ('group_5');
INSERT INTO groups (group_name)
VALUES ('group_6');
INSERT INTO groups (group_name)
VALUES ('group_7');
INSERT INTO groups (group_name)
VALUES ('group_1');
INSERT INTO groups (group_name)
VALUES ('group_2');
INSERT INTO groups (group_name)
VALUES ('group_3');
INSERT INTO groups (group_name)
VALUES ('group_8');


INSERT INTO group_subs (group_id,sub,group_manager)
VALUES (1,'4359841657275796f20734f26d7b60c515f17cd36bad58d29ed87d000d621974@tenant_1.eu',true);
INSERT INTO group_subs (group_id,sub,group_manager)
VALUES (2,'4359841657275796f20734f26d7b60c515f17cd36bad58d29ed87d000d621974@tenant_1.eu',true);
INSERT INTO group_subs (group_id,sub,group_manager)
VALUES (3,'4359841657275796f20734f26d7b60c515f17cd36bad58d29ed87d000d621974@tenant_1.eu',true);
INSERT INTO group_subs (group_id,sub,group_manager)
VALUES (4,'4359841657275796f20734f26d7b60c515f17cd36bad58d29ed87d000d621974@tenant_1.eu',true);
INSERT INTO group_subs (group_id,sub,group_manager)
VALUES (6,'4359841657275796f20734f26d7b60c515f17cd36bad58d29ed87d000d621974@tenant_1.eu',true);
INSERT INTO group_subs (group_id,sub,group_manager)
VALUES (5,'4359841657275796f20734f26d7b60c515f17cd36bad58d29ed87d000d621974@tenant_1.eu',true);
INSERT INTO group_subs (group_id,sub,group_manager)
VALUES (5,'7a6ae5617ea76389401e3c3839127fd2a019572066d40c5d0176bd242651f934@tenant_1.eu',true);
INSERT INTO group_subs (group_id,sub,group_manager)
VALUES (7,'4359841657275796f20734f26d7b60c515f17cd36bad58d29ed87d000d621974@tenant_1.eu',true);
INSERT INTO group_subs (group_id,sub,group_manager)
VALUES (8,'4e38406c89591bb08e070accbce62140cfc8beb40314c03aa82cf3683ac270b5@aai.tenant_2-portal.eu',true);
INSERT INTO group_subs (group_id,sub,group_manager)
VALUES (9,'4e38406c89591bb08e070accbce62140cfc8beb40314c03aa82cf3683ac270b5@aai.tenant_2-portal.eu',true);
INSERT INTO group_subs (group_id,sub,group_manager)
VALUES (10,'4e38406c89591bb08e070accbce62140cfc8beb40314c03aa82cf3683ac270b5@aai.tenant_2-portal.eu',true);
INSERT INTO group_subs (group_id,sub,group_manager)
VALUES (11,'4359841657275796f20734f26d7b60c515f17cd36bad58d29ed87d000d621974@tenant_1.eu',true);


INSERT INTO service_errors (service_id,date,error_code,error_description)
VALUES(10,'2020-09-01 10:23:54',424,'
    at Server.setupListenHandle [as _listen2] (net.js:1313:16)
    at listenInCluster (net.js:1361:12)
    at Server.listen (net.js:1447:7)
    at Function.listen (/home/andreas/Projects/rciam-service-registry/registry-backend-express/node_modules/express/lib/application.js:618:24)
    at Object.<anonymous> (/home/andreas/Projects/rciam-service-registry/registry-backend-express/JavaScript/index.js:148:18)
    at Module._compile (internal/modules/cjs/loader.js:1118:30)
    at Object.Module._extensions..js (internal/modules/cjs/loader.js:1138:10)
    at Module.load (internal/modules/cjs/loader.js:982:32)
    at Function.Module._load (internal/modules/cjs/loader.js:875:14)
    at Function.executeUserEntryPoint [as runMain] (internal/modules/run_main.js:71:12)
');


INSERT INTO service_boolean (service_id,name,value)
VALUES (1,'dbcoco',true);


INSERT INTO service_boolean (service_id,name,value)
VALUES (1,'tenant_1_policy',true);


INSERT INTO service_tags (service_id,tenant,tag)
VALUES (1,'tenant_1','tenant_1');
INSERT INTO service_tags (service_id,tenant,tag)
VALUES (1,'tenant_1','test');


