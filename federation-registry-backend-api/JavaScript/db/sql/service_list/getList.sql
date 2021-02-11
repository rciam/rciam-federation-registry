SELECT  json_agg(json_build_object('service_id',foo.service_id,'petition_id',foo.petition_id,'service_name',foo.service_name,'service_description',foo.service_description,'logo_uri',foo.logo_uri,'integration_environment',foo.integration_environment,'owned',foo.owned,'status',foo.status,'type',foo.type,'state',foo.state,'group_manager',foo.group_manager,'notification',foo.notification,'comment',foo.comment,'group_id',foo.group_id,'deployment_type',foo.deployment_type)) as list_items, full_count FROM (
  SELECT *,COUNT(*) OVER() As full_count FROM (
    SELECT service_id,petition_id,service_description,logo_uri,service_name,integration_environment,CASE WHEN owned IS NULL THEN false ELSE owned END,status,type,state,CASE WHEN group_manager IS NULL then false ELSE group_manager END,CASE WHEN notification IS NULL THEN false ELSE notification END AS notification,comment,group_id,deployment_type,CASE WHEN petitions.last_edited IS NOT NULL THEN petitions.last_edited ELSE service_state.last_edited END
    FROM
    ${select_own_service:raw}
      (SELECT id AS service_id,service_description,logo_uri,service_name,deleted,requester,integration_environment,group_id,last_edited
      FROM service_details WHERE tenant=${tenant_name} ${protocol_filter:raw} ${search_filter:raw} ${integration_environment_filter:raw}) AS service_details
    ${select_all:raw}
    USING (group_id)
    LEFT JOIN service_state ON service_details.service_id=service_state.id
    LEFT JOIN
      (SELECT id AS petition_id,status,type, service_id,comment,CASE WHEN service_petition_details.comment IS NOT NULL THEN true ELSE false END AS notification,last_edited
        FROM service_petition_details WHERE reviewed_at IS NULL) AS petitions USING (service_id)
    WHERE deleted=false ${pending_filter:raw}
    UNION
    SELECT service_id,petition_id,service_description,logo_uri,service_name,integration_environment,CASE WHEN group_subs.sub=${sub} THEN true ELSE false END AS owned,status,type,state,CASE WHEN group_manager IS NULL THEN false ELSE group_manager END,notification,comment,petitions.group_id,deployment_type,last_edited
      FROM
      (SELECT service_id,id AS petition_id,comment,service_description,logo_uri,service_name,integration_environment,CASE WHEN service_petition_details.comment IS NOT NULL THEN true ELSE false END AS notification,status,type,null AS deployment_type,null AS state,group_id,last_edited
        FROM service_petition_details WHERE reviewed_at IS NULL AND type='create' AND tenant=${tenant_name} ${protocol_filter:raw} ${search_filter:raw} ${integration_environment_filter:raw}) as petitions
      LEFT JOIN group_subs ON petitions.group_id= group_subs.group_id AND group_subs.sub=${sub}
    ${select_own_petition:raw}
  ) as bar ORDER BY last_edited DESC LIMIT ${limit} OFFSET ${offset}
) AS foo GrOup By full_count
