SELECT group_id,invitation_mail,preferred_username,email,sub,group_manager,CASE WHEN service_petition_details.service_name IS NULL THEN service_details.service_name ELSE service_petition_details.service_name  END as service_name
FROM
  (SELECT group_id,sub,group_manager,email as invitation_mail FROM invitations WHERE id=${id} and sub=${sub}) as invitation
LEFT JOIN user_info USING (sub) LEFT JOIN service_details USING (group_id) LEFT JOIN service_petition_details USING (group_id)
