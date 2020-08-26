SELECT service_id,petition_id,service_description,logo_uri,service_name,integration_environment,CASE WHEN owned IS NULL THEN false ELSE owned END,status,type,state,group_manager,CASE WHEN notification IS NULL THEN false ELSE notification END AS notification,deleted,comment,group_id
FROM
  (SELECT id AS service_id,service_description,logo_uri,service_name,deleted,requester,integration_environment,group_id FROM service_details) AS service_details LEFT JOIN service_state ON service_details.service_id=service_state.id LEFT JOIN
  (SELECT id AS group_id,true AS owned,group_manager FROM groups LEFT JOIN group_subs ON groups.id=group_subs.group_id WHERE sub=${sub}) AS group_ids
  USING (group_id)
  LEFT JOIN (SELECT id AS petition_id,status,type,CASE WHEN service_petition_details.comment IS NOT NULL THEN true ELSE false END AS notification, service_id,comment
    FROM service_petition_details WHERE reviewed_at IS NULL) AS petitions USING (service_id)
WHERE deleted=false OR (deleted=TRUE AND state!='deployed')
UNION
SELECT service_id,petition_id,service_description,logo_uri,service_name,integration_environment,owned,status,type,state,group_manager,notification,deleted,comment,group_id
  FROM
  (SELECT service_id,id AS petition_id,comment,service_description,logo_uri,service_name,integration_environment,CASE WHEN service_petition_details.comment IS NOT NULL THEN true ELSE false END AS notification,CASE WHEN requester=${sub} THEN true ELSE false END AS owned,status,type,null AS state,false as group_manager,false AS deleted,NULL::bigint as group_id
  FROM service_petition_details WHERE reviewed_at IS NULL AND type='create') as petitions
