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
  created_at timestamp without time zone,
  clear_access_tokens_on_refresh BOOLEAN,
  code_challenge_method VARCHAR(256),
  device_code_validity_seconds bigint,
  modified_at timestamp without time zone,
  pending_approval BOOLEAN,
  approved BOOLEAN,
  requester bigint,
  reviewer bigint
);
create table client_contact (
  owner_id bigint,
  value VARCHAR(256),
  PRIMARY KEY (owner_id,value),
  FOREIGN KEY (owner_id) REFERENCES client_details(id)
);

create table client_grant_type (
  owner_id bigint,
  value VARCHAR(256),
  PRIMARY KEY (owner_id,value),
  FOREIGN KEY (owner_id) REFERENCES client_details(id)
);

create table client_redirect_uri (
  owner_id bigint,
  value VARCHAR(256),
  PRIMARY KEY (owner_id,value),
  FOREIGN KEY (owner_id) REFERENCES client_details(id)
);

create table client_scope (
  owner_id bigint,
  value VARCHAR(256),
  PRIMARY KEY (owner_id,value),
  FOREIGN KEY (owner_id) REFERENCES client_details(id)
);
ALTER TABLE client_details ALTER COLUMN requester TYPE VARCHAR(256);
UPDATE client_details SET requester='4359841657275796f20734f26d7b60c515f17cd36bad58d29ed87d000d621974@egi.eu' WHERE requester='1';
