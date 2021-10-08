INSERT INTO service_petition_details (service_description,service_name,logo_uri,policy_uri,integration_environment,requester,type,service_id,comment,status,protocol,group_id,tenant,country,website_url,aup_uri,organization_id,last_edited)
VALUES (${service_description},${service_name},${logo_uri},${policy_uri},${integration_environment},${requester},${type},${service_id},${comment},${status},${protocol},${group_id},${tenant},${country},${website_url},${aup_uri},${organization_id},current_timestamp)
RETURNING *
