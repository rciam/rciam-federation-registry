SELECT t1.id as service_id
FROM
	(SELECT id FROM service_details_oidc WHERE client_id=${client_id} and id!=${service_id})  as t1
	JOIN (SELECT id FROM service_details WHERE tenant=${tenant} AND integration_environment=${environment} AND deleted=false) as  t2 USING (id)
UNION
SELECT t1.id as petition_id
FROM
	(SELECT id FROM service_petition_details_oidc WHERE client_id=${client_id} and id!=${petition_id})  as t1
	JOIN ( SELECT id FROM service_petition_details WHERE reviewed_at IS NULL AND tenant=${tenant} AND integration_environment=${environment}) as t2 USING (id)
