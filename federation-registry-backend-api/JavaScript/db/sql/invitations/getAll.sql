SELECT invites.id,group_manager,invited_by,date,CASE WHEN service_petition_details.service_name IS NULL THEN service_details.service_name ELSE service_petition_details.service_name  END as service_name
  FROM
    (SELECT id,group_manager,invited_by,date,group_id FROM invitations WHERE sub=${sub}) as invites
LEFT JOIN service_details USING (group_id) LEFT JOIN service_petition_details USING (group_id)
