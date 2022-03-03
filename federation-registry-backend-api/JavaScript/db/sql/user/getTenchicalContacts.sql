SELECT distinct value as email,name FROM
(SELECT id from service_details WHERE tenant=${tenant}) as service_details INNER JOIN service_contacts ON service_details.id = service_contacts.owner_id AND service_contacts.type = 'technical'
LEFT JOIN user_info ON user_info.email = service_contacts.value
