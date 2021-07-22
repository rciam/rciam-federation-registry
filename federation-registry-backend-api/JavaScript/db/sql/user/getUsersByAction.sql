SELECT DISTINCT email,name FROM
(SELECT role_id FROM role_actions WHERE action=${action}) role_ids LEFT OUTER JOIN user_info ON role_ids.role_id = user_info.role_id 
WHERE tenant=${tenant};