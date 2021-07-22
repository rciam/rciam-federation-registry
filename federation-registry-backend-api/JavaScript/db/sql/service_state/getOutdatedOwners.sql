SELECT DISTINCT email,name as username,user_info.tenant  FROM
(SELECT id FROM service_state WHERE outdated=true) as foo
LEFT JOIN service_details USING (id)
LEFT JOIN service_petition_details ON foo.id = service_petition_details.service_id AND service_petition_details.reviewed_at IS NULL
INNER JOIN group_subs on group_subs.group_id=service_details.group_id
LEFT JOIN user_info USING (sub) WHERE email IS NOT NULL AND service_petition_details.id IS NULL
