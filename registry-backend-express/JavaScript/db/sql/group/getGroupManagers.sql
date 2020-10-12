SELECT preferred_username as username, email, group_manager,group_id,sub
FROM
  ((SELECT sub, group_manager,group_id FROM
    group_subs WHERE group_id=5 AND group_manager=true) as foo
    LEFT JOIN user_info USING (sub))
