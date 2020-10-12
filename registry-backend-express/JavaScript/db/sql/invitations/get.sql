SELECT preferred_username as username, user_info.email, group_manager,group_id,sub,invitation_id,date as invitation_date,foo.email as invitation_email
  FROM
    ((SELECT sub, group_manager,email,group_id,id as invitation_id,date FROM invitations WHERE group_id=${group_id} AND EXTRACT(EPOCH FROM ${now} - date)<${validity_seconds} ) as foo
      LEFT JOIN user_info USING (sub))
