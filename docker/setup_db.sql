DROP TABLE IF EXISTS user_edu_person_entitlement,tokens,user_info, service_petition_contacts, service_petition_oidc_grant_types, service_petition_oidc_redirect_uris, service_petition_oidc_scopes,
service_petition_details_oidc,service_petition_details_saml, service_petition_details, service_oidc_scopes,service_contacts,service_oidc_grant_types,service_oidc_redirect_uris,service_details_oidc,
service_details_saml,service_details,service_state,user_roles,role_actions,role_entitlements,groups,invitations,group_subs,tenants;

create table tokens (
  token VARCHAR(1054),
  code VARCHAR(1054) PRIMARY KEY
);


create table user_info (
  id SERIAL PRIMARY KEY,
  sub VARCHAR(256),
  preferred_username VARCHAR(256),
  name VARCHAR(256),
  given_name VARCHAR(256),
  family_name VARCHAR(256),
  email VARCHAR(256)
);

create table user_roles (
  id SERIAL PRIMARY KEY,
  role_name VARCHAR(256),
  tenant_id bigint
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

create table tenants (
  id SERIAL PRIMARY KEY,
  name VARCHAR(256),
  client_id VARCHAR(256),
  client_secret VARCHAR(256),
  redirect_uri VARCHAR(256)
);

create table user_edu_person_entitlement (
  user_id INTEGER,
  edu_person_entitlement VARCHAR(256),
  PRIMARY KEY (user_id,edu_person_entitlement),
  FOREIGN KEY (user_id) REFERENCES user_info(id)
);
create table service_details (
  id SERIAL PRIMARY KEY,
  service_name  VARCHAR(256),
  group_id INTEGER,
  service_description VARCHAR(1024),
  logo_uri VARCHAR(2048),
  policy_uri VARCHAR(2048),
  integration_environment VARCHAR(256),
  requester VARCHAR(256),
  protocol VARCHAR(256),
  deleted BOOLEAN DEFAULT FALSE
);

create table service_details_oidc (
  id bigint PRIMARY KEY,
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
  FOREIGN KEY (id) REFERENCES service_details(id) ON DELETE CASCADE
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


INSERT INTO service_details (service_description,service_name,logo_uri,policy_uri,integration_environment,requester,protocol,group_id)
VALUES ('Lorem ipsum dolor sit amet, consectetur adipiscing elit. Aenean in ex in tellus congue commodo. Suspendisse condimentum purus ante, in ornare leo egestas ut.','Client 1','https://cdn.vox-cdn.com/thumbor/0n6dqQfk9MuOBSiM39Pog2Bw39Y=/1400x1400/filters:format(jpeg)/cdn.vox-cdn.com/uploads/chorus_asset/file/19341372/microsoftedgenewlogo.jpg','https://policy_uri.com','demo','4359841657275796f20734f26d7b60c515f17cd36bad58d29ed87d000d621974@egi.eu','oidc',1);
INSERT INTO service_details (service_description,service_name,logo_uri,policy_uri,integration_environment,requester,protocol,group_id)
VALUES ('Lorem ipsum dolor sit amet, consectetur adipiscing elit. Aenean in ex in tellus congue commodo. Suspendisse condimentum purus ante, in ornare leo egestas ut.','Client 2','https://i.pinimg.com/originals/33/b8/69/33b869f90619e81763dbf1fccc896d8d.jpg','https://policy_uri.com','production','4359841657275796f20734f26d7b60c515f17cd36bad58d29ed87d000d621974@egi.eu','oidc',2);
INSERT INTO service_details (service_description,service_name,logo_uri,policy_uri,integration_environment,requester,protocol,group_id)
VALUES ('Lorem ipsum dolor sit amet, consectetur adipiscing elit. Aenean in ex in tellus congue commodo. Suspendisse condimentum purus ante, in ornare leo egestas ut.','Client 3','https://encrypted-tbn0.gstatic.com/images?q=tbn%3AANd9GcROY_lTxPGm6_XjUncdBfqkSbRoFoEf4BLBlQ&usqp=CAU','https://policy_uri.com','demo','4359841657275796f20734f26d7b60c515f17cd36bad58d29ed87d000d621974@egi.eu','oidc',3);
INSERT INTO service_details (service_description,service_name,logo_uri,policy_uri,integration_environment,requester,protocol,group_id)
VALUES ('Lorem ipsum dolor sit amet, consectetur adipiscing elit. Aenean in ex in tellus congue commodo. Suspendisse condimentum purus ante, in ornare leo egestas ut.','Client 4','https://brandmark.io/logo-rank/random/pepsi.png','https://policy_uri.com','development','4359841657275796f20734f26d7b60c515f17cd36bad58d29ed87d000d621974@egi.eu','oidc',4);
INSERT INTO service_details (service_description,service_name,logo_uri,policy_uri,integration_environment,requester,protocol,group_id)
VALUES ('Lorem ipsum dolor sit amet, consectetur adipiscing elit. Aenean in ex in tellus congue commodo. Suspendisse condimentum purus ante, in ornare leo egestas ut.','Client 5','https://brandmark.io/logo-rank/random/pepsi.png','https://policy_uri.com','development','7a6ae5617ea76389401e3c3839127fd2a019572066d40c5d0176bd242651f934@egi.eu','oidc',5);
INSERT INTO service_details (service_description,service_name,logo_uri,policy_uri,integration_environment,requester,protocol,group_id)
VALUES ('Lorem ipsum dolor sit amet, consectetur adipiscing elit. Aenean in ex in tellus congue commodo. Suspendisse condimentum purus ante, in ornare leo egestas ut.','Saml 6','https://cdn.auth0.com/blog/duo-saml-exploit/saml.png','https://policy_uri.com','demo','4359841657275796f20734f26d7b60c515f17cd36bad58d29ed87d000d621974@egi.eu','saml',6);

INSERT INTO service_state (id,state)
VALUES (1,'deployed');
INSERT INTO service_state (id,state)
VALUES (2,'deployed');
INSERT INTO service_state (id,state)
VALUES (3,'deployed');
INSERT INTO service_state (id,state)
VALUES (4,'deployed');
INSERT INTO service_state (id,state)
VALUES (5,'deployed');
INSERT INTO service_state (id,state)
VALUES (6,'deployed');

INSERT INTO service_details_oidc (id,client_id,allow_introspection,client_secret,reuse_refresh_tokens,clear_access_tokens_on_refresh,id_token_timeout_seconds,access_token_validity_seconds,refresh_token_validity_seconds,code_challenge_method,device_code_validity_seconds)
VALUES (1,'client1',true,'secret',true,true,600,3600,28800,'plain',10000);
INSERT INTO service_details_oidc (id,client_id,allow_introspection,client_secret,reuse_refresh_tokens,clear_access_tokens_on_refresh,id_token_timeout_seconds,access_token_validity_seconds,refresh_token_validity_seconds,code_challenge_method,device_code_validity_seconds)
VALUES (2,'client2',true,'secret',true,true,600,3600,28800,'plain',10000);
INSERT INTO service_details_oidc (id,client_id,allow_introspection,client_secret,reuse_refresh_tokens,clear_access_tokens_on_refresh,id_token_timeout_seconds,access_token_validity_seconds,refresh_token_validity_seconds,code_challenge_method,device_code_validity_seconds)
VALUES (3,'client3',true,'secret',true,true,600,3600,28800,'plain',10000);
INSERT INTO service_details_oidc (id,client_id,allow_introspection,client_secret,reuse_refresh_tokens,clear_access_tokens_on_refresh,id_token_timeout_seconds,access_token_validity_seconds,refresh_token_validity_seconds,code_challenge_method,device_code_validity_seconds)
VALUES (4,'client4',true,'secret',true,true,600,3600,28800,'plain',10000);
INSERT INTO service_details_oidc (id,client_id,allow_introspection,client_secret,reuse_refresh_tokens,clear_access_tokens_on_refresh,id_token_timeout_seconds,access_token_validity_seconds,refresh_token_validity_seconds,code_challenge_method,device_code_validity_seconds)
VALUES (5,'client5',true,'secret',true,true,600,3600,28800,'plain',10000);


INSERT INTO service_details_saml (id,entity_id,metadata_url)
VALUES (6,'saml-id-1','https://metadataurl.com');

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




INSERT INTO service_petition_details (service_description,service_name,logo_uri,policy_uri,integration_environment,requester,status,service_id,reviewed_at,protocol)
VALUES ('Lorem ipsum dolor sit amet, consectetur adipiscing elit. Aenean in ex in tellus congue commodo. Suspendisse condimentum purus ante, in ornare leo egestas ut.','Client 1','https://cdn.vox-cdn.com/thumbor/0n6dqQfk9MuOBSiM39Pog2Bw39Y=/1400x1400/filters:format(jpeg)/cdn.vox-cdn.com/uploads/chorus_asset/file/19341372/microsoftedgenewlogo.jpg','https://policy_uri.com','demo','4359841657275796f20734f26d7b60c515f17cd36bad58d29ed87d000d621974@egi.eu','approved',1,'2004-10-19 10:23:54','oidc');
INSERT INTO service_petition_details (service_description,service_name,logo_uri,policy_uri,integration_environment,requester,status,service_id,reviewed_at,protocol)
VALUES ('Lorem ipsum dolor sit amet, consectetur adipiscing elit. Aenean in ex in tellus congue commodo. Suspendisse condimentum purus ante, in ornare leo egestas ut.','Client 2','https://i.pinimg.com/originals/33/b8/69/33b869f90619e81763dbf1fccc896d8d.jpg','https://policy_uri.com','production','4359841657275796f20734f26d7b60c515f17cd36bad58d29ed87d000d621974@egi.eu','approved',2,'2004-10-19 10:23:54','oidc');
INSERT INTO service_petition_details (service_description,service_name,logo_uri,policy_uri,integration_environment,requester,status,service_id,reviewed_at,protocol)
VALUES ('Lorem ipsum dolor sit amet, consectetur adipiscing elit. Aenean in ex in tellus congue commodo. Suspendisse condimentum purus ante, in ornare leo egestas ut.','Client 3','https://encrypted-tbn0.gstatic.com/images?q=tbn%3AANd9GcROY_lTxPGm6_XjUncdBfqkSbRoFoEf4BLBlQ&usqp=CAU','https://policy_uri.com','demo','4359841657275796f20734f26d7b60c515f17cd36bad58d29ed87d000d621974@egi.eu','approved',3,'2004-10-19 10:23:54','oidc');
INSERT INTO service_petition_details (service_description,service_name,logo_uri,policy_uri,integration_environment,requester,status,service_id,reviewed_at,protocol)
VALUES ('Lorem ipsum dolor sit amet, consectetur adipiscing elit. Aenean in ex in tellus congue commodo. Suspendisse condimentum purus ante, in ornare leo egestas ut.','Client 4','https://brandmark.io/logo-rank/random/pepsi.png','https://policy_uri.com','development','4359841657275796f20734f26d7b60c515f17cd36bad58d29ed87d000d621974@egi.eu','approved',4,'2004-10-19 10:23:54','oidc');
INSERT INTO service_petition_details (service_description,service_name,logo_uri,policy_uri,integration_environment,requester,status,service_id,reviewed_at,protocol)
VALUES ('Lorem ipsum dolor sit amet, consectetur adipiscing elit. Aenean in ex in tellus congue commodo. Suspendisse condimentum purus ante, in ornare leo egestas ut.','Client 5','https://brandmark.io/logo-rank/random/pepsi.png','https://policy_uri.com','development','7a6ae5617ea76389401e3c3839127fd2a019572066d40c5d0176bd242651f934@egi.eu','approved',5,'2004-10-19 10:23:54','oidc');
INSERT INTO service_petition_details (service_description,service_name,logo_uri,policy_uri,integration_environment,requester,type,service_id,protocol)
VALUES ('Lorem ipsum dolor sit amet, consectetur adipiscing elit. Aenean in ex in tellus congue commodo. Suspendisse condimentum purus ante, in ornare leo egestas ut.','Client 5 new','https://images.fastcompany.net/image/upload/w_596,c_limit,q_auto:best,f_auto/fc/3034007-inline-i-applelogo.jpg','https://policy_uri.com','development','7a6ae5617ea76389401e3c3839127fd2a019572066d40c5d0176bd242651f934@egi.eu','edit',5,'oidc');
INSERT INTO service_petition_details (service_description,service_name,logo_uri,policy_uri,integration_environment,requester,type,protocol,group_id)
VALUES ('Lorem ipsum dolor sit amet, consectetur adipiscing elit. Aenean in ex in tellus congue commodo. Suspendisse condimentum purus ante, in ornare leo egestas ut.','Client 7','https://www.bookmarks.design/media/image/hatchful.jpg','https://policy_uri.com','development','4359841657275796f20734f26d7b60c515f17cd36bad58d29ed87d000d621974@egi.eu','create','oidc',7);
INSERT INTO service_petition_details (service_description,service_name,logo_uri,policy_uri,integration_environment,requester,type,service_id,protocol)
VALUES ('Lorem ipsum dolor sit amet, consectetur adipiscing elit. Aenean in ex in tellus congue commodo. Suspendisse condimentum purus ante, in ornare leo egestas ut.','Client 1','https://cdn.vox-cdn.com/thumbor/0n6dqQfk9MuOBSiM39Pog2Bw39Y=/1400x1400/filters:format(jpeg)/cdn.vox-cdn.com/uploads/chorus_asset/file/19341372/microsoftedgenewlogo.jpg','https://policy_uri.com','demo','4359841657275796f20734f26d7b60c515f17cd36bad58d29ed87d000d621974@egi.eu','delete',1,'oidc');
INSERT INTO service_petition_details (service_description,service_name,logo_uri,policy_uri,integration_environment,requester,status,type,service_id,reviewed_at,protocol)
VALUES ('Lorem ipsum dolor sit amet, consectetur adipiscing elit. Aenean in ex in tellus congue commodo. Suspendisse condimentum purus ante, in ornare leo egestas ut.','Saml 6','https://cdn.auth0.com/blog/duo-saml-exploit/saml.png','https://policy_uri.com','demo','4359841657275796f20734f26d7b60c515f17cd36bad58d29ed87d000d621974@egi.eu','create','approved',6,'2020-10-4 13:18:11','saml');



INSERT INTO service_petition_details_oidc (id,client_id,allow_introspection,client_secret,reuse_refresh_tokens,clear_access_tokens_on_refresh,id_token_timeout_seconds,access_token_validity_seconds,refresh_token_validity_seconds,code_challenge_method,device_code_validity_seconds)
VALUES (1,'client1',true,'secret',true,true,600,3600,28800,'plain',10000);
INSERT INTO service_petition_details_oidc (id,client_id,allow_introspection,client_secret,reuse_refresh_tokens,clear_access_tokens_on_refresh,id_token_timeout_seconds,access_token_validity_seconds,refresh_token_validity_seconds,code_challenge_method,device_code_validity_seconds)
VALUES (2,'client2',true,'secret',true,true,600,3600,28800,'plain',10000);
INSERT INTO service_petition_details_oidc (id,client_id,allow_introspection,client_secret,reuse_refresh_tokens,clear_access_tokens_on_refresh,id_token_timeout_seconds,access_token_validity_seconds,refresh_token_validity_seconds,code_challenge_method,device_code_validity_seconds)
VALUES (3,'client3',true,'secret',true,true,600,3600,28800,'plain',10000);
INSERT INTO service_petition_details_oidc (id,client_id,allow_introspection,client_secret,reuse_refresh_tokens,clear_access_tokens_on_refresh,id_token_timeout_seconds,access_token_validity_seconds,refresh_token_validity_seconds,code_challenge_method,device_code_validity_seconds)
VALUES (4,'client4',true,'secret',true,true,600,36,28800,'plain',10000);
INSERT INTO service_petition_details_oidc (id,client_id,allow_introspection,client_secret,reuse_refresh_tokens,clear_access_tokens_on_refresh,id_token_timeout_seconds,access_token_validity_seconds,refresh_token_validity_seconds,code_challenge_method,device_code_validity_seconds)
VALUES (5,'client5',true,'secret',true,true,600,3600,28800,'plain',10000);
INSERT INTO service_petition_details_oidc (id,client_id,allow_introspection,client_secret,reuse_refresh_tokens,clear_access_tokens_on_refresh,id_token_timeout_seconds,access_token_validity_seconds,refresh_token_validity_seconds,code_challenge_method,device_code_validity_seconds)
VALUES (6,'client5',true,'secret',true,true,600,3600,28800,'plain',10000);
INSERT INTO service_petition_details_oidc (id,client_id,allow_introspection,client_secret,reuse_refresh_tokens,clear_access_tokens_on_refresh,id_token_timeout_seconds,access_token_validity_seconds,refresh_token_validity_seconds,code_challenge_method,device_code_validity_seconds)
VALUES (7,'client7',true,'secret',true,true,600,3600,28800,'plain',10000);
INSERT INTO service_petition_details_oidc (id,client_id,allow_introspection,client_secret,reuse_refresh_tokens,clear_access_tokens_on_refresh,id_token_timeout_seconds,access_token_validity_seconds,refresh_token_validity_seconds,code_challenge_method,device_code_validity_seconds)
VALUES (8,'client1',true,'secret',true,true,600,3600,28800,'plain',10000);

INSERT INTO service_petition_details_saml (id,entity_id,metadata_url)
VALUES (9,'saml-id-1','https://metadataurl.com');
INSERT INTO service_petition_contacts(owner_id,value,type)
VALUES (9,'mygrail@gmail.com','admin');
INSERT INTO service_petition_contacts(owner_id,value,type)
VALUES (9,'myfail@gmail.com','admin');



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

INSERT INTO user_info(sub,preferred_username,name,given_name,family_name,email)
VALUES ('4359841657275796f20734f26d7b60c515f17cd36bad58d29ed87d000d621934@egi.eu','Helen Char','helen charopia','helen','charopia','testmail@mail.com');
INSERT INTO user_edu_person_entitlement (user_id,edu_person_entitlement)
VALUES (1,'urn:mace:egi.eu:group:service-integration.aai.egi.eu:role=member#aai.egi.eu');



INSERT INTO user_roles (role_name,tenant_id)
VALUES ('End User',1);
INSERT INTO user_roles(role_name,tenant_id)
VALUES ('Site Operations Manager',1);
INSERT INTO user_roles(role_name,tenant_id)
VALUES ('Administrator',1);


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
VALUES(2,'get_user');
INSERT INTO role_actions(role_id,action)
VALUES(2,'get_own_services');
INSERT INTO role_actions(role_id,action)
VALUES(2,'get_own_service');
INSERT INTO role_actions(role_id,action)
VALUES(2,'get_own_petitions');
INSERT INTO role_actions(role_id,action)
VALUES(2,'get_own_petition');
INSERT INTO role_actions(role_id,action)
VALUES(2,'add_own_petition');
INSERT INTO role_actions(role_id,action)
VALUES(2,'update_own_petition');
INSERT INTO role_actions(role_id,action)
VALUES(2,'delete_own_petition');
INSERT INTO role_actions(role_id,action)
VALUES(2,'review_own_petition');
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
VALUES(3,'review_petition');
INSERT INTO role_actions(role_id,action)
VALUES(3,'get_petitions');
INSERT INTO role_actions(role_id,action)
VALUES(3,'get_services');
INSERT INTO role_actions(role_id,action)
VALUES(3,'view_groups');


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

INSERT INTO group_subs (group_id,sub,group_manager)
VALUES (1,'4359841657275796f20734f26d7b60c515f17cd36bad58d29ed87d000d621974@egi.eu',true);
INSERT INTO group_subs (group_id,sub,group_manager)
VALUES (2,'4359841657275796f20734f26d7b60c515f17cd36bad58d29ed87d000d621974@egi.eu',true);
INSERT INTO group_subs (group_id,sub,group_manager)
VALUES (3,'4359841657275796f20734f26d7b60c515f17cd36bad58d29ed87d000d621974@egi.eu',true);
INSERT INTO group_subs (group_id,sub,group_manager)
VALUES (4,'4359841657275796f20734f26d7b60c515f17cd36bad58d29ed87d000d621974@egi.eu',true);
INSERT INTO group_subs (group_id,sub,group_manager)
VALUES (6,'4359841657275796f20734f26d7b60c515f17cd36bad58d29ed87d000d621974@egi.eu',true);
INSERT INTO group_subs (group_id,sub,group_manager)
VALUES (5,'4359841657275796f20734f26d7b60c515f17cd36bad58d29ed87d000d621974@egi.eu',true);
INSERT INTO group_subs (group_id,sub,group_manager)
VALUES (5,'7a6ae5617ea76389401e3c3839127fd2a019572066d40c5d0176bd242651f934@egi.eu',true);
INSERT INTO group_subs (group_id,sub,group_manager)
VALUES (7,'4359841657275796f20734f26d7b60c515f17cd36bad58d29ed87d000d621974@egi.eu',true);




INSERT INTO role_entitlements (role_id,entitlement)
VALUES (3,'urn:mace:egi.eu:group:service-integration.aai.egi.eu:role=member#aai.egi.eu');

INSERT INTO role_entitlements (role_id,entitlement)
VALUES (2,'fake_entitlement');

INSERT INTO invitations(code,email,group_id,sub,group_manager,invited_by)
VALUES (null,'andreaskoza@grnet.gr',1,'7a6ae5617ea76389401e3c3839127fd2a019572066d40c5d0176bd242651f934@egi.eu',true,'koza-sparrow@hotmail.com');
INSERT INTO invitations(code,email,group_id,sub,group_manager,invited_by)
VALUES ('random_generated_code','alekaelias@yahoo.gr',1,null,false,'koza-sparrow@hotmail.com');
