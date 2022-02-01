SELECT json_agg(email) as emails
FROM 
    (SELECT DISTINCT value as email FROM
    (SELECT id from service_details WHERE integration_environment IN (${environments:csv}) AND deleted=false) as ids 
    LEFT JOIN service_contacts ON service_contacts.owner_id = ids.id AND service_contacts.type IN (${contact_types:csv})
    WHERE value IS NOT NULL) as foo