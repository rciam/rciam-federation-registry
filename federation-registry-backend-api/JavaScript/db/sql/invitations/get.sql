SELECT preferred_username as username, user_info.email, group_manager,group_id,sub,invitation_id,date as invitation_date,foo.email as invitation_email,CASE WHEN EXTRACT(EPOCH FROM ${now} - date)>${validity_seconds} THEN true ELSE false END as expired 
  FROM
    ((SELECT sub, group_manager,email,group_id,id as invitation_id,date,tenant FROM invitations WHERE group_id=${group_id}  ) as foo
      LEFT JOIN user_info USING (sub))
WHERE foo.tenant=${tenant}