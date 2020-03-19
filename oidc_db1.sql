DROP TABLE IF EXISTS user_edu_person_entitlement, user_info, client_petition_contact, client_petition_grant_type, client_petition_redirect_uri, client_petition_scope, client_petitions, client_service_scope,client_service_contact,client_service_grant_type,client_service_redirect_uri,client_services;


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
create table client_services (
  id SERIAL PRIMARY KEY,
  client_description VARCHAR(1024),
  reuse_refresh_tokens BOOLEAN,
  allow_introspection BOOLEAN,
  client_id VARCHAR(256),
  client_secret VARCHAR(2048),
  access_token_validity_seconds bigint,
  refresh_token_validity_seconds bigint,
  client_name  VARCHAR(256),
  logo_uri VARCHAR(2048),
  policy_uri VARCHAR(2048),
  clear_access_tokens_on_refresh BOOLEAN,
  code_challenge_method VARCHAR(256),
  device_code_validity_seconds bigint,
  integration_environment VARCHAR(256),
  requester VARCHAR(256),
  deleted BOOLEAN DEFAULT FALSE,
  deployed BOOLEAN DEFAULT FALSE
);
create table client_service_contact (
  id SERIAL PRIMARY KEY,
  owner_id bigint,
  value VARCHAR(256),
  type VARCHAR(256),
  FOREIGN KEY (owner_id) REFERENCES client_services(id)
);

create table client_service_grant_type (
  id SERIAL PRIMARY KEY,
  owner_id bigint,
  value VARCHAR(256),
  FOREIGN KEY (owner_id) REFERENCES client_services(id)
);

create table client_service_redirect_uri (
  id SERIAL PRIMARY KEY,
  owner_id bigint,
  value VARCHAR(256),
  FOREIGN KEY (owner_id) REFERENCES client_services(id)
);

create table client_service_scope (
  id SERIAL PRIMARY KEY,
  owner_id bigint,
  value VARCHAR(256),
  FOREIGN KEY (owner_id) REFERENCES client_services(id)
);


create table client_petitions (
  id SERIAL PRIMARY KEY,
  service_id bigint DEFAULT NULL,
  client_description VARCHAR(1024),
  reuse_refresh_tokens BOOLEAN,
  allow_introspection BOOLEAN,
  client_id VARCHAR(256),
  client_secret VARCHAR(2048),
  access_token_validity_seconds bigint,
  refresh_token_validity_seconds bigint,
  client_name  VARCHAR(256),
  logo_uri VARCHAR(2048),
  policy_uri VARCHAR(2048),
  clear_access_tokens_on_refresh BOOLEAN,
  code_challenge_method VARCHAR(256),
  device_code_validity_seconds bigint,
  integration_environment VARCHAR(256),
  type VARCHAR(256) DEFAULT 'create',
  status VARCHAR(256) DEFAULT 'pending',
  comment VARCHAR(2024) DEFAULT NULL,
  requester VARCHAR(256),
  reviewer VARCHAR(256) DEFAULT NULL,
  reviewed_at timestamp without time zone DEFAULT NULL,
  FOREIGN KEY (service_id) REFERENCES client_services(id) ON DELETE SET NULL
);



create table client_petition_contact (
  id SERIAL PRIMARY KEY,
  owner_id bigint,
  value VARCHAR(256),
  type VARCHAR(256),
  FOREIGN KEY (owner_id) REFERENCES client_petitions(id)
);

create table client_petition_grant_type (
  id SERIAL PRIMARY KEY,
  owner_id bigint,
  value VARCHAR(256),
  FOREIGN KEY (owner_id) REFERENCES client_petitions(id)
);

create table client_petition_redirect_uri (
  id SERIAL PRIMARY KEY,
  owner_id bigint,
  value VARCHAR(256),
  FOREIGN KEY (owner_id) REFERENCES client_petitions(id)
);

create table client_petition_scope (
  id SERIAL PRIMARY KEY,
  owner_id bigint,
  value VARCHAR(256),
  FOREIGN KEY (owner_id) REFERENCES client_petitions(id)
);


INSERT INTO client_services (client_description,reuse_refresh_tokens,allow_introspection,client_id,client_secret,access_token_validity_seconds,refresh_token_validity_seconds,client_name,logo_uri,policy_uri,clear_access_tokens_on_refresh,code_challenge_method,device_code_validity_seconds,integration_environment,requester,deployed)
VALUES ('Lorem ipsum dolor sit amet, consectetur adipiscing elit. Aenean in ex in tellus congue commodo. Suspendisse condimentum purus ante, in ornare leo egestas ut.',true,true,'client1','secret',10000,1000,'Client 1','https://cdn.vox-cdn.com/thumbor/0n6dqQfk9MuOBSiM39Pog2Bw39Y=/1400x1400/filters:format(jpeg)/cdn.vox-cdn.com/uploads/chorus_asset/file/19341372/microsoftedgenewlogo.jpg','https://policy_uri.com',true,'plain',10000,'demo','4359841657275796f20734f26d7b60c515f17cd36bad58d29ed87d000d621974@egi.eu',true);
INSERT INTO client_services (client_description,reuse_refresh_tokens,allow_introspection,client_id,client_secret,access_token_validity_seconds,refresh_token_validity_seconds,client_name,logo_uri,policy_uri,clear_access_tokens_on_refresh,code_challenge_method,device_code_validity_seconds,integration_environment,requester,deployed)
VALUES ('Lorem ipsum dolor sit amet, consectetur adipiscing elit. Aenean in ex in tellus congue commodo. Suspendisse condimentum purus ante, in ornare leo egestas ut.',true,true,'client2','secret',10000,1000,'Client 2','https://i.pinimg.com/originals/33/b8/69/33b869f90619e81763dbf1fccc896d8d.jpg','https://policy_uri.com',true,'plain',10000,'production','4359841657275796f20734f26d7b60c515f17cd36bad58d29ed87d000d621974@egi.eu',true);
INSERT INTO client_services (client_description,reuse_refresh_tokens,allow_introspection,client_id,client_secret,access_token_validity_seconds,refresh_token_validity_seconds,client_name,logo_uri,policy_uri,clear_access_tokens_on_refresh,code_challenge_method,device_code_validity_seconds,integration_environment,requester,deployed)
VALUES ('Lorem ipsum dolor sit amet, consectetur adipiscing elit. Aenean in ex in tellus congue commodo. Suspendisse condimentum purus ante, in ornare leo egestas ut.',true,true,'client3','secret',10000,1000,'Client 3','http://logok.org/wp-content/uploads/2014/05/Total-logo-earth.png','https://policy_uri.com',true,'plain',10000,'demo','4359841657275796f20734f26d7b60c515f17cd36bad58d29ed87d000d621974@egi.eu',true);
INSERT INTO client_services (client_description,reuse_refresh_tokens,allow_introspection,client_id,client_secret,access_token_validity_seconds,refresh_token_validity_seconds,client_name,logo_uri,policy_uri,clear_access_tokens_on_refresh,code_challenge_method,device_code_validity_seconds,integration_environment,requester,deployed)
VALUES ('Lorem ipsum dolor sit amet, consectetur adipiscing elit. Aenean in ex in tellus congue commodo. Suspendisse condimentum purus ante, in ornare leo egestas ut.',true,true,'client4','secret',10000,1000,'Client 4','https://brandmark.io/logo-rank/random/pepsi.png','https://policy_uri.com',true,'plain',10000,'development','4359841657275796f20734f26d7b60c515f17cd36bad58d29ed87d000d621974@egi.eu',true);
INSERT INTO client_services (client_description,reuse_refresh_tokens,allow_introspection,client_id,client_secret,access_token_validity_seconds,refresh_token_validity_seconds,client_name,logo_uri,policy_uri,clear_access_tokens_on_refresh,code_challenge_method,device_code_validity_seconds,integration_environment,requester,deployed)
VALUES ('Lorem ipsum dolor sit amet, consectetur adipiscing elit. Aenean in ex in tellus congue commodo. Suspendisse condimentum purus ante, in ornare leo egestas ut.',true,true,'client5','secret',10000,1000,'Client 5','https://brandmark.io/logo-rank/random/pepsi.png','https://policy_uri.com',true,'plain',10000,'development','7a6ae5617ea76389401e3c3839127fd2a019572066d40c5d0176bd242651f934@egi.eu',true);

INSERT INTO client_service_contact(owner_id,value,type)
VALUES ('1','mymail@gmail.com','admin');
INSERT INTO client_service_contact(owner_id,value,type)
VALUES ('1','mysnail@gmail.com','admin');
INSERT INTO client_service_contact(owner_id,value,type)
VALUES ('1','mygrail@gmail.com','admin');
INSERT INTO client_service_contact(owner_id,value,type)
VALUES ('1','myfail@gmail.com','admin');
INSERT INTO client_service_contact(owner_id,value,type)
VALUES ('2','mymail@gmail.com','admin');
INSERT INTO client_service_contact(owner_id,value,type)
VALUES ('2','mysnail@gmail.com','admin');
INSERT INTO client_service_contact(owner_id,value,type)
VALUES ('2','mygrail@gmail.com','admin');
INSERT INTO client_service_contact(owner_id,value,type)
VALUES ('2','myfail@gmail.com','admin');
INSERT INTO client_service_contact(owner_id,value,type)
VALUES ('3','mymail@gmail.com','admin');
INSERT INTO client_service_contact(owner_id,value,type)
VALUES ('3','mysnail@gmail.com','admin');
INSERT INTO client_service_contact(owner_id,value,type)
VALUES ('3','mygrail@gmail.com','admin');
INSERT INTO client_service_contact(owner_id,value,type)
VALUES ('3','myfail@gmail.com','admin');
INSERT INTO client_service_contact(owner_id,value,type)
VALUES ('4','mymail@gmail.com','admin');
INSERT INTO client_service_contact(owner_id,value,type)
VALUES ('4','mysnail@gmail.com','admin');
INSERT INTO client_service_contact(owner_id,value,type)
VALUES ('4','mygrail@gmail.com','admin');
INSERT INTO client_service_contact(owner_id,value,type)
VALUES ('4','myfail@gmail.com','admin');
INSERT INTO client_service_contact(owner_id,value,type)
VALUES ('5','mymail@gmail.com','admin');
INSERT INTO client_service_contact(owner_id,value,type)
VALUES ('5','mysnail@gmail.com','admin');
INSERT INTO client_service_contact(owner_id,value,type)
VALUES ('5','mygrail@gmail.com','admin');
INSERT INTO client_service_contact(owner_id,value,type)
VALUES ('5','myfail@gmail.com','admin');


INSERT INTO client_service_grant_type(owner_id,value)
VALUES ('1','implicit');
INSERT INTO client_service_grant_type(owner_id,value)
VALUES ('1','authorization_code');
INSERT INTO client_service_grant_type(owner_id,value)
VALUES ('1','refresh_token');
INSERT INTO client_service_grant_type(owner_id,value)
VALUES ('2','implicit');
INSERT INTO client_service_grant_type(owner_id,value)
VALUES ('2','authorization_code');
INSERT INTO client_service_grant_type(owner_id,value)
VALUES ('2','refresh_token');
INSERT INTO client_service_grant_type(owner_id,value)
VALUES ('3','implicit');
INSERT INTO client_service_grant_type(owner_id,value)
VALUES ('3','authorization_code');
INSERT INTO client_service_grant_type(owner_id,value)
VALUES ('3','refresh_token');
INSERT INTO client_service_grant_type(owner_id,value)
VALUES ('4','implicit');
INSERT INTO client_service_grant_type(owner_id,value)
VALUES ('4','authorization_code');
INSERT INTO client_service_grant_type(owner_id,value)
VALUES ('4','refresh_token');
INSERT INTO client_service_grant_type(owner_id,value)
VALUES ('5','implicit');
INSERT INTO client_service_grant_type(owner_id,value)
VALUES ('5','authorization_code');
INSERT INTO client_service_grant_type(owner_id,value)
VALUES ('5','refresh_token');



INSERT INTO client_service_redirect_uri(owner_id,value)
VALUES ('1','https://redirecturi1.com');
INSERT INTO client_service_redirect_uri(owner_id,value)
VALUES ('1','https://redirecturi2.com');
INSERT INTO client_service_redirect_uri(owner_id,value)
VALUES ('2','https://redirecturi1.com');
INSERT INTO client_service_redirect_uri(owner_id,value)
VALUES ('2','https://redirecturi2.com');
INSERT INTO client_service_redirect_uri(owner_id,value)
VALUES ('3','https://redirecturi1.com');
INSERT INTO client_service_redirect_uri(owner_id,value)
VALUES ('3','https://redirecturi2.com');
INSERT INTO client_service_redirect_uri(owner_id,value)
VALUES ('4','https://redirecturi.com');

INSERT INTO client_service_redirect_uri(owner_id,value)
VALUES ('5','https://redirecturi.com');

INSERT INTO client_service_scope(owner_id,value)
VALUES ('1','electroscope');
INSERT INTO client_service_scope(owner_id,value)
VALUES ('2','microscope');
INSERT INTO client_service_scope(owner_id,value)
VALUES ('3','stethoscope');
INSERT INTO client_service_scope(owner_id,value)
VALUES ('4','kaleidoscope');
INSERT INTO client_service_scope(owner_id,value)
VALUES ('5','telescope');



INSERT INTO client_petitions (client_description,reuse_refresh_tokens,allow_introspection,client_id,client_secret,access_token_validity_seconds,refresh_token_validity_seconds,client_name,logo_uri,policy_uri,clear_access_tokens_on_refresh,code_challenge_method,device_code_validity_seconds,integration_environment,requester,status,service_id,reviewed_at)
VALUES ('Lorem ipsum dolor sit amet, consectetur adipiscing elit. Aenean in ex in tellus congue commodo. Suspendisse condimentum purus ante, in ornare leo egestas ut.',true,true,'client1','secret',10000,1000,'Client 1','https://cdn.vox-cdn.com/thumbor/0n6dqQfk9MuOBSiM39Pog2Bw39Y=/1400x1400/filters:format(jpeg)/cdn.vox-cdn.com/uploads/chorus_asset/file/19341372/microsoftedgenewlogo.jpg','https://policy_uri.com',true,'plain',10000,'demo','4359841657275796f20734f26d7b60c515f17cd36bad58d29ed87d000d621974@egi.eu','approved',1,'2004-10-19 10:23:54');
INSERT INTO client_petitions (client_description,reuse_refresh_tokens,allow_introspection,client_id,client_secret,access_token_validity_seconds,refresh_token_validity_seconds,client_name,logo_uri,policy_uri,clear_access_tokens_on_refresh,code_challenge_method,device_code_validity_seconds,integration_environment,requester,status,service_id,reviewed_at)
VALUES ('Lorem ipsum dolor sit amet, consectetur adipiscing elit. Aenean in ex in tellus congue commodo. Suspendisse condimentum purus ante, in ornare leo egestas ut.',true,true,'client2','secret',10000,1000,'Client 2','https://i.pinimg.com/originals/33/b8/69/33b869f90619e81763dbf1fccc896d8d.jpg','https://policy_uri.com',true,'plain',10000,'production','4359841657275796f20734f26d7b60c515f17cd36bad58d29ed87d000d621974@egi.eu','approved',2,'2004-10-19 10:23:54');
INSERT INTO client_petitions (client_description,reuse_refresh_tokens,allow_introspection,client_id,client_secret,access_token_validity_seconds,refresh_token_validity_seconds,client_name,logo_uri,policy_uri,clear_access_tokens_on_refresh,code_challenge_method,device_code_validity_seconds,integration_environment,requester,status,service_id,reviewed_at)
VALUES ('Lorem ipsum dolor sit amet, consectetur adipiscing elit. Aenean in ex in tellus congue commodo. Suspendisse condimentum purus ante, in ornare leo egestas ut.',true,true,'client3','secret',10000,1000,'Client 3','http://logok.org/wp-content/uploads/2014/05/Total-logo-earth.png','https://policy_uri.com',true,'plain',10000,'demo','4359841657275796f20734f26d7b60c515f17cd36bad58d29ed87d000d621974@egi.eu','approved',3,'2004-10-19 10:23:54');
INSERT INTO client_petitions (client_description,reuse_refresh_tokens,allow_introspection,client_id,client_secret,access_token_validity_seconds,refresh_token_validity_seconds,client_name,logo_uri,policy_uri,clear_access_tokens_on_refresh,code_challenge_method,device_code_validity_seconds,integration_environment,requester,status,service_id,reviewed_at)
VALUES ('Lorem ipsum dolor sit amet, consectetur adipiscing elit. Aenean in ex in tellus congue commodo. Suspendisse condimentum purus ante, in ornare leo egestas ut.',true,true,'client4','secret',10000,1000,'Client 4','https://brandmark.io/logo-rank/random/pepsi.png','https://policy_uri.com',true,'plain',10000,'development','4359841657275796f20734f26d7b60c515f17cd36bad58d29ed87d000d621974@egi.eu','approved',4,'2004-10-19 10:23:54');
INSERT INTO client_petitions (client_description,reuse_refresh_tokens,allow_introspection,client_id,client_secret,access_token_validity_seconds,refresh_token_validity_seconds,client_name,logo_uri,policy_uri,clear_access_tokens_on_refresh,code_challenge_method,device_code_validity_seconds,integration_environment,requester,status,service_id,reviewed_at)
VALUES ('Lorem ipsum dolor sit amet, consectetur adipiscing elit. Aenean in ex in tellus congue commodo. Suspendisse condimentum purus ante, in ornare leo egestas ut.',true,true,'client5','secret',10000,1000,'Client 5','https://brandmark.io/logo-rank/random/pepsi.png','https://policy_uri.com',true,'plain',10000,'development','7a6ae5617ea76389401e3c3839127fd2a019572066d40c5d0176bd242651f934@egi.eu','approved',5,'2004-10-19 10:23:54');
INSERT INTO client_petitions (client_description,reuse_refresh_tokens,allow_introspection,client_id,client_secret,access_token_validity_seconds,refresh_token_validity_seconds,client_name,logo_uri,policy_uri,clear_access_tokens_on_refresh,code_challenge_method,device_code_validity_seconds,integration_environment,requester,type,service_id)
VALUES ('Lorem ipsum dolor sit amet, consectetur adipiscing elit. Aenean in ex in tellus congue commodo. Suspendisse condimentum purus ante, in ornare leo egestas ut.',true,true,'client10','secret',10000,1000,'Client 5 new','https://images.fastcompany.net/image/upload/w_596,c_limit,q_auto:best,f_auto/fc/3034007-inline-i-applelogo.jpg','https://policy_uri.com',true,'plain',10000,'development','4359841657275796f20734f26d7b60c515f17cd36bad58d29ed87d000d621974@egi.eu','edit',3);
INSERT INTO client_petitions (client_description,reuse_refresh_tokens,allow_introspection,client_id,client_secret,access_token_validity_seconds,refresh_token_validity_seconds,client_name,logo_uri,policy_uri,clear_access_tokens_on_refresh,code_challenge_method,device_code_validity_seconds,integration_environment,requester,type)
VALUES ('Lorem ipsum dolor sit amet, consectetur adipiscing elit. Aenean in ex in tellus congue commodo. Suspendisse condimentum purus ante, in ornare leo egestas ut.',true,true,'client6','secret',10000,1000,'Client 7','https://www.bookmarks.design/media/image/hatchful.jpg','https://policy_uri.com',true,'plain',10000,'development','4359841657275796f20734f26d7b60c515f17cd36bad58d29ed87d000d621974@egi.eu','create');
INSERT INTO client_petitions (service_id,requester,type) VALUES (1,'4359841657275796f20734f26d7b60c515f17cd36bad58d29ed87d000d621974@egi.eu','delete');



INSERT INTO client_petition_contact(owner_id,value,type)
VALUES ('1','mymail@gmail.com','admin');
INSERT INTO client_petition_contact(owner_id,value,type)
VALUES ('1','mysnail@gmail.com','admin');
INSERT INTO client_petition_contact(owner_id,value,type)
VALUES ('1','mygrail@gmail.com','admin');
INSERT INTO client_petition_contact(owner_id,value,type)
VALUES ('1','myfail@gmail.com','admin');
INSERT INTO client_petition_contact(owner_id,value,type)
VALUES ('2','mymail@gmail.com','admin');
INSERT INTO client_petition_contact(owner_id,value,type)
VALUES ('2','mysnail@gmail.com','admin');
INSERT INTO client_petition_contact(owner_id,value,type)
VALUES ('2','mygrail@gmail.com','admin');
INSERT INTO client_petition_contact(owner_id,value,type)
VALUES ('2','myfail@gmail.com','admin');
INSERT INTO client_petition_contact(owner_id,value,type)
VALUES ('3','mymail@gmail.com','admin');
INSERT INTO client_petition_contact(owner_id,value,type)
VALUES ('3','mysnail@gmail.com','admin');
INSERT INTO client_petition_contact(owner_id,value,type)
VALUES ('3','mygrail@gmail.com','admin');
INSERT INTO client_petition_contact(owner_id,value,type)
VALUES ('3','myfail@gmail.com','admin');
INSERT INTO client_petition_contact(owner_id,value,type)
VALUES ('4','mymail@gmail.com','admin');
INSERT INTO client_petition_contact(owner_id,value,type)
VALUES ('4','mysnail@gmail.com','admin');
INSERT INTO client_petition_contact(owner_id,value,type)
VALUES ('4','mygrail@gmail.com','admin');
INSERT INTO client_petition_contact(owner_id,value,type)
VALUES ('4','myfail@gmail.com','admin');
INSERT INTO client_petition_contact(owner_id,value,type)
VALUES ('5','mymail@gmail.com','admin');
INSERT INTO client_petition_contact(owner_id,value,type)
VALUES ('5','mysnail@gmail.com','admin');
INSERT INTO client_petition_contact(owner_id,value,type)
VALUES ('5','mygrail@gmail.com','admin');
INSERT INTO client_petition_contact(owner_id,value,type)
VALUES ('5','myfail@gmail.com','admin');
INSERT INTO client_petition_contact(owner_id,value,type)
VALUES ('6','mygrail@gmail.com','admin');
INSERT INTO client_petition_contact(owner_id,value,type)
VALUES ('6','myfail@gmail.com','admin');
INSERT INTO client_petition_contact(owner_id,value,type)
VALUES ('7','mygrail@gmail.com','admin');
INSERT INTO client_petition_contact(owner_id,value,type)
VALUES ('7','myfail@gmail.com','admin');



INSERT INTO client_petition_grant_type(owner_id,value)
VALUES ('1','implicit');
INSERT INTO client_petition_grant_type(owner_id,value)
VALUES ('1','authorization_code');
INSERT INTO client_petition_grant_type(owner_id,value)
VALUES ('1','refresh_token');
INSERT INTO client_petition_grant_type(owner_id,value)
VALUES ('2','implicit');
INSERT INTO client_petition_grant_type(owner_id,value)
VALUES ('2','authorization_code');
INSERT INTO client_petition_grant_type(owner_id,value)
VALUES ('2','refresh_token');
INSERT INTO client_petition_grant_type(owner_id,value)
VALUES ('3','implicit');
INSERT INTO client_petition_grant_type(owner_id,value)
VALUES ('3','authorization_code');
INSERT INTO client_petition_grant_type(owner_id,value)
VALUES ('3','refresh_token');
INSERT INTO client_petition_grant_type(owner_id,value)
VALUES ('4','implicit');
INSERT INTO client_petition_grant_type(owner_id,value)
VALUES ('4','authorization_code');
INSERT INTO client_petition_grant_type(owner_id,value)
VALUES ('4','refresh_token');
INSERT INTO client_petition_grant_type(owner_id,value)
VALUES ('5','implicit');
INSERT INTO client_petition_grant_type(owner_id,value)
VALUES ('5','authorization_code');
INSERT INTO client_petition_grant_type(owner_id,value)
VALUES ('5','refresh_token');
INSERT INTO client_petition_grant_type(owner_id,value)
VALUES ('6','implicit');
INSERT INTO client_petition_grant_type(owner_id,value)
VALUES ('7','authorization_code');
INSERT INTO client_petition_grant_type(owner_id,value)
VALUES ('7','refresh_token');



INSERT INTO client_petition_redirect_uri(owner_id,value)
VALUES ('1','https://redirecturi1.com');
INSERT INTO client_petition_redirect_uri(owner_id,value)
VALUES ('1','https://redirecturi2.com');
INSERT INTO client_petition_redirect_uri(owner_id,value)
VALUES ('2','https://redirecturi1.com');
INSERT INTO client_petition_redirect_uri(owner_id,value)
VALUES ('2','https://redirecturi2.com');
INSERT INTO client_petition_redirect_uri(owner_id,value)
VALUES ('3','https://redirecturi1.com');
INSERT INTO client_petition_redirect_uri(owner_id,value)
VALUES ('3','https://redirecturi2.com');
INSERT INTO client_petition_redirect_uri(owner_id,value)
VALUES ('4','https://redirecturi.com');
INSERT INTO client_petition_redirect_uri(owner_id,value)
VALUES ('5','https://redirecturi.com');
INSERT INTO client_petition_redirect_uri(owner_id,value)
VALUES ('6','https://redirecturi.com');
INSERT INTO client_petition_redirect_uri(owner_id,value)
VALUES ('7','https://redirecturi2.com');
INSERT INTO client_petition_redirect_uri(owner_id,value)
VALUES ('7','https://redirecturi.com');

INSERT INTO client_petition_scope(owner_id,value)
VALUES ('1','electroscope');
INSERT INTO client_petition_scope(owner_id,value)
VALUES ('2','microscope');
INSERT INTO client_petition_scope(owner_id,value)
VALUES ('3','stethoscope');
INSERT INTO client_petition_scope(owner_id,value)
VALUES ('4','kaleidoscope');
INSERT INTO client_petition_scope(owner_id,value)
VALUES ('5','telescope');
INSERT INTO client_petition_scope(owner_id,value)
VALUES ('6','stethoscope');
INSERT INTO client_petition_scope(owner_id,value)
VALUES ('6','kaleidoscope');
INSERT INTO client_petition_scope(owner_id,value)
VALUES ('7','telescope');
