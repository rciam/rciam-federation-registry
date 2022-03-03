SELECT json_agg(email) as emails
FROM 
    (SELECT DISTINCT value as email FROM
    (SELECT id,group_id from service_details WHERE integration_environment IN (${environments:csv}) AND protocol IN (${protocols:csv}) AND deleted=false AND tenant=${tenant}) as ids 
    LEFT JOIN service_state USING (id)
    LEFT JOIN group_subs USING (group_id)
    LEFT JOIN service_contacts ON service_contacts.owner_id = ids.id AND service_contacts.type IN (${contact_types:csv})
    WHERE value IS NOT NULL) as foo