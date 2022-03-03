SELECT DISTINCT service_details.id as service_id,service_details.service_name,service_details.integration_environment,outdated FROM
(SELECT id,outdated FROM service_state WHERE outdated=true) as foo
LEFT JOIN service_details USING (id)
LEFT JOIN service_petition_details ON foo.id = service_petition_details.service_id AND service_petition_details.reviewed_at IS NULL
WHERE service_petition_details.id IS NULL AND service_details.deleted=false AND service_details.tenant=${tenant}

