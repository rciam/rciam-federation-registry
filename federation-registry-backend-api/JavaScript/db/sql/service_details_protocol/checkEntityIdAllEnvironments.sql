SELECT t1.id as service_id
FROM
	(SELECT id FROM service_details_saml WHERE entity_id=${entity_id} and id!=${service_id})  as t1
	JOIN (SELECT id FROM service_details WHERE tenant=${tenant} AND deleted=false) as  t2 USING (id)
UNION
SELECT t1.id as petition_id
FROM
	(SELECT id FROM service_petition_details_saml WHERE entity_id=${entity_id} and id!=${petition_id})  as t1
	JOIN ( SELECT id FROM service_petition_details WHERE reviewed_at IS NULL AND tenant=${tenant}) as t2 USING (id)
