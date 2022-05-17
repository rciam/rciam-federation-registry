SELECT  json_agg(json_build_object('outdated',foo.outdated,'service_id',foo.service_id,'petition_id',foo.petition_id,'service_name',foo.service_name,'service_description',foo.service_description,'logo_uri',foo.logo_uri,'integration_environment',foo.integration_environment,'owned',foo.owned,'status',foo.status,'type',foo.type,'state',foo.state,'group_manager',foo.group_manager,'notification',foo.notification,'comment',foo.comment,'group_id',foo.group_id,'deployment_type',foo.deployment_type,'last_edited',foo.last_edited,'created_at',foo.created_at,'orphan',foo.orphan,'tags',foo.tags)) as list_items, full_count,outdated_count,request_review_count FROM (
  SELECT *,COUNT(*) OVER() As full_count,COUNT(case when outdated=true AND petition_id IS NULL AND bar.owned then 1 else null end ) OVER() as outdated_count,COUNT(case when status='request_review' then 1 else null end ) OVER() as request_review_count FROM (
    SELECT service_id,petition_id,service_description,logo_uri,service_name,integration_environment,CASE WHEN owned IS NULL THEN false ELSE owned END,status,type,state,CASE WHEN group_ids.group_manager IS NULL then false ELSE group_ids.group_manager END,CASE WHEN notification IS NULL THEN false ELSE notification END AS notification,comment,service_details.group_id,deployment_type,CASE WHEN petitions.last_edited IS NOT NULL THEN petitions.last_edited ELSE service_state.last_edited END,outdated,client_id,created_at,orphan,tags
    FROM
    ${select_own_service:raw}
      (SELECT id AS service_id,service_description,logo_uri,service_name,deleted,requester,integration_environment,group_id,CASE WHEN (SELECT json_agg((v.sub))
						 		FROM group_subs v WHERE service_details.group_id = v.group_id) IS NULL THEN true ELSE false END as orphan,CASE WHEN (SELECT array_agg((v.tag)) FROM service_tags v WHERE service_details.id=v.service_id) IS NULL THEN ARRAY[]::varchar[] ELSE (SELECT array_agg((v.tag)) FROM service_tags v WHERE service_details.id=v.service_id) END as tags
      FROM service_details WHERE tenant=${tenant_name} ${protocol_filter:raw} ${integration_environment_filter:raw}) AS service_details
    LEFT JOIN service_details_oidc on service_details.service_id = service_details_oidc.id
    ${select_all:raw}
    USING (group_id)
    RIGHT JOIN service_state as service_state ON service_details.service_id=service_state.id ${outdated_services:raw}
    LEFT JOIN
      (SELECT id AS petition_id,status,type, service_id,comment,CASE WHEN service_petition_details.comment IS NOT NULL THEN true ELSE false END AS notification,last_edited
        FROM service_petition_details WHERE reviewed_at IS NULL) AS petitions USING (service_id)
    LEFT JOIN group_subs ON service_details.group_id= group_subs.group_id
    LEFT JOIN user_info ON group_subs.sub = user_info.sub AND user_info.tenant = ${tenant_name}
    WHERE deleted=false ${pending_filter:raw} ${pending_sub_filter:raw} ${search_filter_services:raw} ${orphan_filter_services:raw} ${error_filter_services:raw} ${owner_filter_services:raw} ${tags_filter_services:raw}
    UNION ALL
    SELECT service_id,petition_id,service_description,logo_uri,service_name,integration_environment,CASE WHEN group_subs.sub=${sub} THEN true ELSE false END AS owned,status,type,state,CASE WHEN group_manager IS NULL THEN false ELSE group_manager END,notification,comment,petitions.group_id,deployment_type,last_edited,outdated,client_id, created_at,orphan,tags
      FROM
      (SELECT service_id,id AS petition_id,comment,service_description,logo_uri,service_name,integration_environment,CASE WHEN service_petition_details.comment IS NOT NULL THEN true ELSE false END AS notification,status,type,null AS deployment_type,null AS state,group_id,last_edited,false as outdated,null::timestamp as created_at,CASE WHEN (SELECT json_agg((v.sub))
						 		FROM group_subs v WHERE service_petition_details.group_id = v.group_id) IS NULL THEN true ELSE false END as orphan, ARRAY[]::varchar[] as tags
        FROM service_petition_details WHERE reviewed_at IS NULL AND type='create' AND tenant=${tenant_name} ${protocol_filter:raw} ${integration_environment_filter:raw} ${outdated_disable_petitions:raw} ${pending_sub_filter:raw} ${error_filter_petitions:raw})  as petitions
      LEFT JOIN service_petition_details_oidc ON petitions.petition_id=service_petition_details_oidc.id
      LEFT JOIN group_subs ON petitions.group_id= group_subs.group_id AND group_subs.sub=${sub}
      LEFT JOIN user_info ON group_subs.sub = user_info.sub AND user_info.tenant = ${tenant_name}
      
    ${select_own_petition:raw} ${owner_filter_petition:raw} ${tags_filter_petitions:raw}
  ) as bar ${search_filter_petitions:raw} ${orphan_filter_petitions:raw} 
  ORDER BY last_edited DESC LIMIT ${limit} OFFSET ${offset}
) AS foo GrOup By full_count,outdated_count,request_review_count
