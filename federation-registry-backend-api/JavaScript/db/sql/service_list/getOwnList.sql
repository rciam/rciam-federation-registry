SELECT service_id,petition_id,service_description,logo_uri,service_name,integration_environment,status,type,state,CASE WHEN group_manager IS NULL then false ELSE group_manager END, owned,CASE WHEN notification IS NULL THEN false ELSE notification END AS notification,comment,group_id,metadata_url,client_id,deployment_type
FROM
  (SELECT id AS group_id,true AS owned,CASE WHEN group_manager IS NULL then false ELSE group_manager END FROM groups LEFT JOIN group_subs ON groups.id=group_subs.group_id WHERE sub=${sub}) AS group_ids LEFT JOIN
  (SELECT id AS service_id,service_description,logo_uri,service_name,deleted,requester,integration_environment,group_id FROM service_details WHERE tenant=${tenant_name}) AS service_details USING (group_id) LEFT JOIN service_state ON service_details.service_id=service_state.id
  LEFT JOIN (SELECT id AS petition_id,status,type, service_id,comment,CASE WHEN service_petition_details.comment IS NOT NULL THEN true ELSE false END AS notification
    FROM service_petition_details WHERE reviewed_at IS NULL) AS petitions USING (service_id)
  LEFT JOIN service_details_oidc ON service_details.service_id=service_details_oidc.id LEFT JOIN service_details_saml ON service_details.service_id=service_details_saml.id WHERE deleted=false
UNION
SELECT service_id,petition_id,service_description,logo_uri,service_name,integration_environment,status,type,state,CASE WHEN group_manager IS NULL THEN false ELSE group_manager END,owned,notification,comment,petitions.group_id,metadata_url,client_id,deployment_type
  FROM
  (SELECT service_id,id AS petition_id,service_description,logo_uri,comment,service_name,integration_environment,CASE WHEN service_petition_details.comment IS NOT NULL THEN true ELSE false END AS notification, true AS owned,status,type,null AS state, group_id,null AS deployment_type
  FROM service_petition_details WHERE reviewed_at IS NULL AND type='create' AND tenant=${tenant_name}) as petitions LEFT JOIN group_subs ON petitions.group_id= group_subs.group_id
  LEFT JOIN service_details_oidc ON petitions.service_id=service_details_oidc.id LEFT JOIN service_details_saml ON petitions.service_id=service_details_saml.id
WHERE group_subs.sub = ${sub}
