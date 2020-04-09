INSERT INTO service_details (service_description,service_name,logo_uri,policy_uri,integration_environment,requester,protocol)
VALUES (${service_description},${service_name},${logo_uri},${policy_uri},${integration_environment},${requester},${protocol})
RETURNING *
