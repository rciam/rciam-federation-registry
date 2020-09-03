SELECT preferred_username as username, email, group_manager, false as pending,group_id,sub,Null::INTEGER as invitation_id,NULL::TIMESTAMP WITHOUT TIME ZONE as invitation_date
FROM
  ((SELECT sub, group_manager,group_id FROM
    group_subs WHERE group_id=${group_id}) as foo
    LEFT JOIN user_info USING (sub))
UNION
SELECT preferred_username as username, foo.email, group_manager, true as pending,group_id,sub,invitation_id,date as invitation_date
  FROM
    ((SELECT sub, group_manager,email,group_id,id as invitation_id,date FROM invitations WHERE group_id=${group_id}) as foo
      LEFT JOIN user_info USING (sub))
