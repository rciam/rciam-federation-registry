SELECT preferred_username as username, email, group_manager, false as pending
FROM
  ((SELECT sub, group_manager FROM
    group_subs WHERE group_id=${group_id}) as foo
    LEFT JOIN user_info USING (sub))
UNION
SELECT preferred_username as username, foo.email, group_manager, true as pending
  FROM
    ((SELECT sub, group_manager,email FROM invitations WHERE group_id=${group_id}) as foo
      LEFT JOIN user_info USING (sub))
