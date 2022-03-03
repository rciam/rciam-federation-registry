INSERT INTO service_details (service_description,service_name,logo_uri,policy_uri,integration_environment,requester,protocol,group_id,tenant,country,website_url,aup_uri,organization_id)
VALUES (${service_description},${service_name},${logo_uri},${policy_uri},${integration_environment},${requester},${protocol},${group_id},${tenant},${country},${website_url},${aup_uri},${organization_id})
RETURNING *
