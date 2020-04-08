DROP TABLE IF EXISTS user_edu_person_entitlement, user_info, service_petition_contacts, service_petition_oidc_grant_types, service_petition_oidc_redirect_uris, service_petition_oidc_scopes,
service_petition_details_oidc,service_petition_details_saml, service_petition_details, service_oidc_scopes,service_contacts,service_oidc_grant_types,service_oidc_redirect_uris,service_details_oidc,
service_details_saml,service_details;


create table user_info (
  id SERIAL PRIMARY KEY,
  sub VARCHAR(256),
  preferred_username VARCHAR(256),
  name VARCHAR(256),
  given_name VARCHAR(256),
  family_name VARCHAR(256),
  email VARCHAR(256)
);

create table user_edu_person_entitlement (
  user_id bigint,
  edu_person_entitlement VARCHAR(256),
  PRIMARY KEY (user_id,edu_person_entitlement),
  FOREIGN KEY (user_id) REFERENCES user_info(id)
);
create table service_details (
  id SERIAL PRIMARY KEY,
  service_description VARCHAR(1024),
  service_name  VARCHAR(256),
  logo_uri VARCHAR(2048),
  policy_uri VARCHAR(2048),
  integration_environment VARCHAR(256),
  requester VARCHAR(256),
  protocol VARCHAR(256),
  deleted BOOLEAN DEFAULT FALSE,
  deployed BOOLEAN DEFAULT FALSE
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
  service_id bigint DEFAULT NULL,
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


INSERT INTO service_details (service_description,service_name,logo_uri,policy_uri,integration_environment,requester,deployed,protocol)
VALUES ('Lorem ipsum dolor sit amet, consectetur adipiscing elit. Aenean in ex in tellus congue commodo. Suspendisse condimentum purus ante, in ornare leo egestas ut.','Client 1','https://cdn.vox-cdn.com/thumbor/0n6dqQfk9MuOBSiM39Pog2Bw39Y=/1400x1400/filters:format(jpeg)/cdn.vox-cdn.com/uploads/chorus_asset/file/19341372/microsoftedgenewlogo.jpg','https://policy_uri.com','demo','4359841657275796f20734f26d7b60c515f17cd36bad58d29ed87d000d621974@egi.eu',true,'oidc');
INSERT INTO service_details (service_description,service_name,logo_uri,policy_uri,integration_environment,requester,deployed,protocol)
VALUES ('Lorem ipsum dolor sit amet, consectetur adipiscing elit. Aenean in ex in tellus congue commodo. Suspendisse condimentum purus ante, in ornare leo egestas ut.','Client 2','https://i.pinimg.com/originals/33/b8/69/33b869f90619e81763dbf1fccc896d8d.jpg','https://policy_uri.com','production','4359841657275796f20734f26d7b60c515f17cd36bad58d29ed87d000d621974@egi.eu',true,'oidc');
INSERT INTO service_details (service_description,service_name,logo_uri,policy_uri,integration_environment,requester,deployed,protocol)
VALUES ('Lorem ipsum dolor sit amet, consectetur adipiscing elit. Aenean in ex in tellus congue commodo. Suspendisse condimentum purus ante, in ornare leo egestas ut.','Client 3','http://logok.org/wp-content/uploads/2014/05/Total-logo-earth.png','https://policy_uri.com','demo','4359841657275796f20734f26d7b60c515f17cd36bad58d29ed87d000d621974@egi.eu',true,'oidc');
INSERT INTO service_details (service_description,service_name,logo_uri,policy_uri,integration_environment,requester,deployed,protocol)
VALUES ('Lorem ipsum dolor sit amet, consectetur adipiscing elit. Aenean in ex in tellus congue commodo. Suspendisse condimentum purus ante, in ornare leo egestas ut.','Client 4','https://brandmark.io/logo-rank/random/pepsi.png','https://policy_uri.com','development','4359841657275796f20734f26d7b60c515f17cd36bad58d29ed87d000d621974@egi.eu',true,'oidc');
INSERT INTO service_details (service_description,service_name,logo_uri,policy_uri,integration_environment,requester,deployed,protocol)
VALUES ('Lorem ipsum dolor sit amet, consectetur adipiscing elit. Aenean in ex in tellus congue commodo. Suspendisse condimentum purus ante, in ornare leo egestas ut.','Client 5','https://brandmark.io/logo-rank/random/pepsi.png','https://policy_uri.com','development','7a6ae5617ea76389401e3c3839127fd2a019572066d40c5d0176bd242651f934@egi.eu',true,'oidc');

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
VALUES ('Lorem ipsum dolor sit amet, consectetur adipiscing elit. Aenean in ex in tellus congue commodo. Suspendisse condimentum purus ante, in ornare leo egestas ut.','Client 3','http://logok.org/wp-content/uploads/2014/05/Total-logo-earth.png','https://policy_uri.com','demo','4359841657275796f20734f26d7b60c515f17cd36bad58d29ed87d000d621974@egi.eu','approved',3,'2004-10-19 10:23:54','oidc');
INSERT INTO service_petition_details (service_description,service_name,logo_uri,policy_uri,integration_environment,requester,status,service_id,reviewed_at,protocol)
VALUES ('Lorem ipsum dolor sit amet, consectetur adipiscing elit. Aenean in ex in tellus congue commodo. Suspendisse condimentum purus ante, in ornare leo egestas ut.','Client 4','https://brandmark.io/logo-rank/random/pepsi.png','https://policy_uri.com','development','4359841657275796f20734f26d7b60c515f17cd36bad58d29ed87d000d621974@egi.eu','approved',4,'2004-10-19 10:23:54','oidc');
INSERT INTO service_petition_details (service_description,service_name,logo_uri,policy_uri,integration_environment,requester,status,service_id,reviewed_at,protocol)
VALUES ('Lorem ipsum dolor sit amet, consectetur adipiscing elit. Aenean in ex in tellus congue commodo. Suspendisse condimentum purus ante, in ornare leo egestas ut.','Client 5','https://brandmark.io/logo-rank/random/pepsi.png','https://policy_uri.com','development','7a6ae5617ea76389401e3c3839127fd2a019572066d40c5d0176bd242651f934@egi.eu','approved',5,'2004-10-19 10:23:54','oidc');
INSERT INTO service_petition_details (service_description,service_name,logo_uri,policy_uri,integration_environment,requester,type,service_id,protocol)
VALUES ('Lorem ipsum dolor sit amet, consectetur adipiscing elit. Aenean in ex in tellus congue commodo. Suspendisse condimentum purus ante, in ornare leo egestas ut.','Client 5 new','https://images.fastcompany.net/image/upload/w_596,c_limit,q_auto:best,f_auto/fc/3034007-inline-i-applelogo.jpg','https://policy_uri.com','development','4359841657275796f20734f26d7b60c515f17cd36bad58d29ed87d000d621974@egi.eu','edit',3,'oidc');
INSERT INTO service_petition_details (service_description,service_name,logo_uri,policy_uri,integration_environment,requester,type,protocol)
VALUES ('Lorem ipsum dolor sit amet, consectetur adipiscing elit. Aenean in ex in tellus congue commodo. Suspendisse condimentum purus ante, in ornare leo egestas ut.','Client 7','https://www.bookmarks.design/media/image/hatchful.jpg','https://policy_uri.com','development','4359841657275796f20734f26d7b60c515f17cd36bad58d29ed87d000d621974@egi.eu','create','oidc');
INSERT INTO service_petition_details (service_description,service_name,logo_uri,policy_uri,integration_environment,requester,type,service_id,protocol)
VALUES ('Lorem ipsum dolor sit amet, consectetur adipiscing elit. Aenean in ex in tellus congue commodo. Suspendisse condimentum purus ante, in ornare leo egestas ut.','Client 1','https://cdn.vox-cdn.com/thumbor/0n6dqQfk9MuOBSiM39Pog2Bw39Y=/1400x1400/filters:format(jpeg)/cdn.vox-cdn.com/uploads/chorus_asset/file/19341372/microsoftedgenewlogo.jpg','https://policy_uri.com','demo','4359841657275796f20734f26d7b60c515f17cd36bad58d29ed87d000d621974@egi.eu','delete',1,'oidc');


INSERT INTO service_petition_details_oidc (id,client_id,allow_introspection,client_secret,reuse_refresh_tokens,clear_access_tokens_on_refresh,id_token_timeout_seconds,access_token_validity_seconds,refresh_token_validity_seconds,code_challenge_method,device_code_validity_seconds)
VALUES (1,'client1',true,'secret',true,true,600,3600,28800,'plain',10000);
INSERT INTO service_petition_details_oidc (id,client_id,allow_introspection,client_secret,reuse_refresh_tokens,clear_access_tokens_on_refresh,id_token_timeout_seconds,access_token_validity_seconds,refresh_token_validity_seconds,code_challenge_method,device_code_validity_seconds)
VALUES (2,'client2',true,'secret',true,true,600,3600,28800,'plain',10000);
INSERT INTO service_petition_details_oidc (id,client_id,allow_introspection,client_secret,reuse_refresh_tokens,clear_access_tokens_on_refresh,id_token_timeout_seconds,access_token_validity_seconds,refresh_token_validity_seconds,code_challenge_method,device_code_validity_seconds)
VALUES (3,'client3',true,'secret',true,true,600,3600,28800,'plain',10000);
INSERT INTO service_petition_details_oidc (id,client_id,allow_introspection,client_secret,reuse_refresh_tokens,clear_access_tokens_on_refresh,id_token_timeout_seconds,access_token_validity_seconds,refresh_token_validity_seconds,code_challenge_method,device_code_validity_seconds)
VALUES (4,'client4',true,'secret',true,true,600,3600,28800,'plain',10000);
INSERT INTO service_petition_details_oidc (id,client_id,allow_introspection,client_secret,reuse_refresh_tokens,clear_access_tokens_on_refresh,id_token_timeout_seconds,access_token_validity_seconds,refresh_token_validity_seconds,code_challenge_method,device_code_validity_seconds)
VALUES (5,'client5',true,'secret',true,true,600,3600,28800,'plain',10000);
INSERT INTO service_petition_details_oidc (id,client_id,allow_introspection,client_secret,reuse_refresh_tokens,clear_access_tokens_on_refresh,id_token_timeout_seconds,access_token_validity_seconds,refresh_token_validity_seconds,code_challenge_method,device_code_validity_seconds)
VALUES (6,'client5',true,'secret',true,true,600,3600,28800,'plain',10000);
INSERT INTO service_petition_details_oidc (id,client_id,allow_introspection,client_secret,reuse_refresh_tokens,clear_access_tokens_on_refresh,id_token_timeout_seconds,access_token_validity_seconds,refresh_token_validity_seconds,code_challenge_method,device_code_validity_seconds)
VALUES (7,'client7',true,'secret',true,true,600,3600,28800,'plain',10000);
INSERT INTO service_petition_details_oidc (id,client_id,allow_introspection,client_secret,reuse_refresh_tokens,clear_access_tokens_on_refresh,id_token_timeout_seconds,access_token_validity_seconds,refresh_token_validity_seconds,code_challenge_method,device_code_validity_seconds)
VALUES (8,'client1',true,'secret',true,true,600,3600,28800,'plain',10000);



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
