SELECT DISTINCT name,preferred_username as username, email, group_manager,foo.group_id,sub,services.id as service_id,petitions.id as petition_id
FROM
  ((SELECT sub, group_manager,group_id FROM
    group_subs WHERE group_id=${group_id} AND group_manager=true) as foo
    LEFT JOIN user_info USING (sub) LEFT JOIN service_details as services USING (group_id) LEFT JOIN service_petition_details as petitions ON foo.group_id=petitions.group_id AND services.id IS NULL AND petitions.type='create' AND petitions.status='pending')
WHERE user_info.tenant=${tenant}
