SELECT json_build_object('id',sd.id,'service_name', sd.service_name,'service_description',sd.service_description,
						 'logo_uri',sd.logo_uri,'policy_uri',sd.policy_uri,'integration_environment',sd.integration_environment,'protocol',sd.protocol,
						 'country',sd.country,'website_url',sd.website_url,'tenant',sd.tenant,'aup_uri',sd.aup_uri,'organization_name',sd.name,
						 'application_type',sd.application_type,'organization_url',sd.url,'organization_id',sd.organization_id,${all_properties_filter:raw}
						 'service_coc',(SELECT CASE WHEN  json_object_agg(v.name,v.value) IS NULL THEN NULL ELSE  json_object_agg(v.name,v.value) END
						 FROM service_coc v WHERE sd.id = v.service_id),'created_at',created_at,
						 'contacts',
						 	(SELECT json_agg(json_build_object('email',v.value,'type',v.type))
							 FROM service_contacts v WHERE sd.id = v.owner_id),
							 'owners',
							 (SELECT json_agg((v.sub))
						 		FROM group_subs v WHERE sd.group_id = v.group_id)
							,'tags',tags) json
    FROM (SELECT *
	FROM ((SELECT *,CASE WHEN (SELECT json_agg((v.tag)) FROM service_tags v WHERE service_details.id=v.service_id) IS NULL THEN ARRAY[]::varchar[] ELSE (SELECT array_agg((v.tag)) FROM service_tags v WHERE service_details.id=v.service_id) END as tags FROM service_details WHERE deleted=false ${integration_environment_filter:raw} ${protocol_filter:raw}) AS bar LEFT JOIN service_state USING (id)) AS foo
	LEFT JOIN service_details_oidc USING (id)
	LEFT JOIN service_details_saml USING (id)
	LEFT JOIN organizations USING(organization_id) WHERE tenant=${tenant}) as sd
WHERE deleted=false ${protocol_id_filter:raw} ${tags_filter:raw} ${exclude_tags_filter:raw}
