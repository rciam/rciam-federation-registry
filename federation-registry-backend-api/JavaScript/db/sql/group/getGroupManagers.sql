SELECT DISTINCT preferred_username as username, email, group_manager,group_id,sub,service_details.id as service_id,service_petition_details.id as petition_id
FROM
  ((SELECT sub, group_manager,group_id FROM
    group_subs WHERE group_id=${group_id} AND group_manager=true) as foo
    LEFT JOIN user_info USING (sub) LEFT JOIN service_details USING (group_id) LEFT JOIN service_petition_details USING (group_id))
WHERE user_info.tenant=${tenant}
