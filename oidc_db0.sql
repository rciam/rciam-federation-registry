DROP TABLE IF EXISTS user_edu_person_entitlement, user_info, client_contact, client_grant_type, client_redirect_uri, client_scope, client_details;


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

create table client_details (
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
  approved BOOLEAN DEFAULT FALSE,
  requester VARCHAR(256),
  reviewer VARCHAR(256) DEFAULT NULL,
  created_at timestamp without time zone,
  updated_at timestamp without time zone,
  is_deleted BOOLEAN NOT NULL DEFAULT FALSE,
  model_id bigint DEFAULT NULL,
  revision int DEFAULT 0
);


create table client_contact (
  id SERIAL PRIMARY KEY,
  owner_id bigint,
  value VARCHAR(256),
  type VARCHAR(256),
  created_at timestamp without time zone,
  is_deleted BOOLEAN DEFAULT FALSE,
  deleted_at timestamp without time zone DEFAULT NULL,
  FOREIGN KEY (owner_id) REFERENCES client_details(id)
);

create table client_grant_type (
  id SERIAL PRIMARY KEY,
  owner_id bigint,
  value VARCHAR(256),
  created_at timestamp without time zone,
  is_deleted BOOLEAN DEFAULT FALSE,
  deleted_at timestamp without time zone DEFAULT NULL,
  FOREIGN KEY (owner_id) REFERENCES client_details(id)
);

create table client_redirect_uri (
  id SERIAL PRIMARY KEY,
  owner_id bigint,
  value VARCHAR(256),
  created_at timestamp without time zone,
  is_deleted BOOLEAN DEFAULT FALSE,
  deleted_at timestamp without time zone DEFAULT NULL,
  FOREIGN KEY (owner_id) REFERENCES client_details(id)
);

create table client_scope (
  id SERIAL PRIMARY KEY,
  owner_id bigint,
  value VARCHAR(256),
  created_at timestamp without time zone,
  is_deleted BOOLEAN DEFAULT FALSE,
  deleted_at timestamp without time zone DEFAULT NULL,
  FOREIGN KEY (owner_id) REFERENCES client_details(id)
);


INSERT INTO client_details (client_description,reuse_refresh_tokens,allow_introspection,client_id,client_secret,access_token_validity_seconds,refresh_token_validity_seconds,client_name,logo_uri,policy_uri,clear_access_tokens_on_refresh,code_challenge_method,device_code_validity_seconds,integration_environment,requester,created_at,updated_at)
VALUES ('This is not a small description with its size chosen deliberately to suit a secret purpose not revealed in this description',true,true,'client1','secret',10000,1000,'Client 1','https://cdn.vox-cdn.com/thumbor/0n6dqQfk9MuOBSiM39Pog2Bw39Y=/1400x1400/filters:format(jpeg)/cdn.vox-cdn.com/uploads/chorus_asset/file/19341372/microsoftedgenewlogo.jpg','https://policy_uri.com',true,'plain',10000,'demo','4359841657275796f20734f26d7b60c515f17cd36bad58d29ed87d000d621974@egi.eu','2004-10-19 10:23:54','2004-10-19 10:23:54');
INSERT INTO client_details (client_description,reuse_refresh_tokens,allow_introspection,client_id,client_secret,access_token_validity_seconds,refresh_token_validity_seconds,client_name,logo_uri,policy_uri,clear_access_tokens_on_refresh,code_challenge_method,device_code_validity_seconds,integration_environment,requester,created_at,updated_at)
VALUES ('This is not a small description with its size chosen deliberately to suit a secret purpose not revealed in this description',true,true,'client2','secret',10000,1000,'Client 2','https://i.pinimg.com/originals/33/b8/69/33b869f90619e81763dbf1fccc896d8d.jpg','https://policy_uri.com',true,'plain',10000,'production','4359841657275796f20734f26d7b60c515f17cd36bad58d29ed87d000d621974@egi.eu','2004-10-19 10:23:54','2004-10-19 10:23:54');
INSERT INTO client_details (client_description,reuse_refresh_tokens,allow_introspection,client_id,client_secret,access_token_validity_seconds,refresh_token_validity_seconds,client_name,logo_uri,policy_uri,clear_access_tokens_on_refresh,code_challenge_method,device_code_validity_seconds,integration_environment,requester,created_at,updated_at)
VALUES ('This is not a small description with its size chosen deliberately to suit a secret purpose not revealed in this description',true,true,'client3','secret',10000,1000,'Client 3','http://logok.org/wp-content/uploads/2014/05/Total-logo-earth.png','https://policy_uri.com',true,'plain',10000,'demo','4359841657275796f20734f26d7b60c515f17cd36bad58d29ed87d000d621974@egi.eu','2004-10-19 10:23:54','2004-10-19 10:23:54');
INSERT INTO client_details (client_description,reuse_refresh_tokens,allow_introspection,client_id,client_secret,access_token_validity_seconds,refresh_token_validity_seconds,client_name,logo_uri,policy_uri,clear_access_tokens_on_refresh,code_challenge_method,device_code_validity_seconds,integration_environment,requester,created_at,updated_at)
VALUES ('This is not a small description with its size chosen deliberately to suit a secret purpose not revealed in this description',true,true,'client4','secret',10000,1000,'Client 4','https://brandmark.io/logo-rank/random/pepsi.png','https://policy_uri.com',true,'plain',10000,'development','4359841657275796f20734f26d7b60c515f17cd36bad58d29ed87d000d621974@egi.eu','2004-10-19 10:23:54','2004-10-19 10:23:54');

INSERT INTO client_contact(owner_id,value,type,created_at)
VALUES ('1','mymail@gmail.com','admin','2004-10-19 10:23:54');
INSERT INTO client_contact(owner_id,value,type,created_at)
VALUES ('1','mysnail@gmail.com','admin','2004-10-19 10:23:54');
INSERT INTO client_contact(owner_id,value,type,created_at)
VALUES ('1','mygrail@gmail.com','admin','2004-10-19 10:23:54');
INSERT INTO client_contact(owner_id,value,type,created_at)
VALUES ('1','myfail@gmail.com','admin','2004-10-19 10:23:54');
INSERT INTO client_contact(owner_id,value,type,created_at)
VALUES ('2','mymail@gmail.com','admin','2004-10-19 10:23:54');
INSERT INTO client_contact(owner_id,value,type,created_at)
VALUES ('2','mysnail@gmail.com','admin','2004-10-19 10:23:54');
INSERT INTO client_contact(owner_id,value,type,created_at)
VALUES ('2','mygrail@gmail.com','admin','2004-10-19 10:23:54');
INSERT INTO client_contact(owner_id,value,type,created_at)
VALUES ('2','myfail@gmail.com','admin','2004-10-19 10:23:54');
INSERT INTO client_contact(owner_id,value,type,created_at)
VALUES ('3','mymail@gmail.com','admin','2004-10-19 10:23:54');
INSERT INTO client_contact(owner_id,value,type,created_at)
VALUES ('3','mysnail@gmail.com','admin','2004-10-19 10:23:54');
INSERT INTO client_contact(owner_id,value,type,created_at)
VALUES ('3','mygrail@gmail.com','admin','2004-10-19 10:23:54');
INSERT INTO client_contact(owner_id,value,type,created_at)
VALUES ('3','myfail@gmail.com','admin','2004-10-19 10:23:54');
INSERT INTO client_contact(owner_id,value,type,created_at)
VALUES ('4','mymail@gmail.com','admin','2004-10-19 10:23:54');
INSERT INTO client_contact(owner_id,value,type,created_at)
VALUES ('4','mysnail@gmail.com','admin','2004-10-19 10:23:54');
INSERT INTO client_contact(owner_id,value,type,created_at)
VALUES ('4','mygrail@gmail.com','admin','2004-10-19 10:23:54');
INSERT INTO client_contact(owner_id,value,type,created_at)
VALUES ('4','myfail@gmail.com','admin','2004-10-19 10:23:54');


INSERT INTO client_grant_type(owner_id,value,created_at)
VALUES ('1','implicit','2004-10-19 10:23:54');
INSERT INTO client_grant_type(owner_id,value,created_at)
VALUES ('1','authorization_code','2004-10-19 10:23:54');
INSERT INTO client_grant_type(owner_id,value,created_at)
VALUES ('1','refresh_token','2004-10-19 10:23:54');
INSERT INTO client_grant_type(owner_id,value,created_at)
VALUES ('2','implicit','2004-10-19 10:23:54');
INSERT INTO client_grant_type(owner_id,value,created_at)
VALUES ('2','authorization_code','2004-10-19 10:23:54');
INSERT INTO client_grant_type(owner_id,value,created_at)
VALUES ('2','refresh_token','2004-10-19 10:23:54');
INSERT INTO client_grant_type(owner_id,value,created_at)
VALUES ('3','implicit','2004-10-19 10:23:54');
INSERT INTO client_grant_type(owner_id,value,created_at)
VALUES ('3','authorization_code','2004-10-19 10:23:54');
INSERT INTO client_grant_type(owner_id,value,created_at)
VALUES ('3','refresh_token','2004-10-19 10:23:54');
INSERT INTO client_grant_type(owner_id,value,created_at)
VALUES ('4','implicit','2004-10-19 10:23:54');
INSERT INTO client_grant_type(owner_id,value,created_at)
VALUES ('4','authorization_code','2004-10-19 10:23:54');
INSERT INTO client_grant_type(owner_id,value,created_at)
VALUES ('4','refresh_token','2004-10-19 10:23:54');


INSERT INTO client_redirect_uri(owner_id,value,created_at)
VALUES ('1','https://redirecturi1.com','2004-10-19 10:23:54');
INSERT INTO client_redirect_uri(owner_id,value,created_at)
VALUES ('1','https://redirecturi2.com','2004-10-19 10:23:54');
INSERT INTO client_redirect_uri(owner_id,value,created_at)
VALUES ('2','https://redirecturi1.com','2004-10-19 10:23:54');
INSERT INTO client_redirect_uri(owner_id,value,created_at)
VALUES ('2','https://redirecturi2.com','2004-10-19 10:23:54');
INSERT INTO client_redirect_uri(owner_id,value,created_at)
VALUES ('3','https://redirecturi1.com','2004-10-19 10:23:54');
INSERT INTO client_redirect_uri(owner_id,value,created_at)
VALUES ('3','https://redirecturi2.com','2004-10-19 10:23:54');
INSERT INTO client_redirect_uri(owner_id,value,created_at)
VALUES ('4','https://redirecturi.com','2004-10-19 10:23:54');

INSERT INTO client_scope(owner_id,value,created_at)
VALUES ('1','electroscope','2004-10-19 10:23:54');
INSERT INTO client_scope(owner_id,value,created_at)
VALUES ('2','microscope','2004-10-19 10:23:54');
INSERT INTO client_scope(owner_id,value,created_at)
VALUES ('3','stethoscope','2004-10-19 10:23:54');
INSERT INTO client_scope(owner_id,value,created_at)
VALUES ('4','kaleidoscope','2004-10-19 10:23:54');
