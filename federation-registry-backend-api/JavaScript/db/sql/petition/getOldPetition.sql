SELECT json_build_object('service_name', sd.service_name,'service_description',sd.service_description,
						 'logo_uri',sd.logo_uri,'policy_uri',sd.policy_uri,'integration_environment',sd.integration_environment,
						 'client_id',sd.client_id,'allow_introspection',sd.allow_introspection,'code_challenge_method',sd.code_challenge_method,
						 'device_code_validity_seconds',sd.device_code_validity_seconds,'access_token_validity_seconds',sd.access_token_validity_seconds,
						 'refresh_token_validity_seconds',sd.refresh_token_validity_seconds,'refresh_token_validity_seconds',sd.refresh_token_validity_seconds,
						 'client_secret',sd.client_secret,'reuse_refresh_token',sd.reuse_refresh_token,'protocol',sd.protocol,'jwks',sd.jwks,'jwks_uri',sd.jwks_uri,
						 'country',sd.country,'website_url',sd.website_url,'token_endpoint_auth_method',sd.token_endpoint_auth_method,'token_endpoint_auth_signing_alg',sd.token_endpoint_auth_signing_alg,
						 'clear_access_tokens_on_refresh',sd.clear_access_tokens_on_refresh,'id_token_timeout_seconds',sd.id_token_timeout_seconds,'metadata_url',sd.metadata_url
						 ,'entity_id',sd.entity_id,'organization_name',sd.name,'organization_url',sd.url,'organization_id',sd.organization_id,'application_type',sd.application_type,
						 'requester',sd.requester,'service_id',sd.service_id,'type',sd.type,'comment',sd.comment,'submitted_at',sd.last_edited,'status',sd.status,'reviewed_at',sd.reviewed_at,'aup_uri',sd.aup_uri,
						 'service_boolean',(SELECT CASE WHEN json_agg(json_build_object(v.name,v.value)) IS NULL THEN NULL ELSE json_agg(json_build_object(v.name,v.value)) END
						 FROM service_petition_boolean v WHERE sd.id = v.petition_id),
						 'grant_types',
							(SELECT json_agg((v.value))
							 FROM service_petition_oidc_grant_types v WHERE sd.id = v.owner_id),
						 'scope',
						 	(SELECT json_agg((v.value))
							 FROM service_petition_oidc_scopes v WHERE sd.id = v.owner_id),
						 'redirect_uris',
						 	(SELECT json_agg((v.value))
							 FROM service_petition_oidc_redirect_uris v WHERE sd.id = v.owner_id),
						 'contacts',
						 	(SELECT json_agg(json_build_object('email',v.value,'type',v.type))
							 FROM service_petition_contacts v WHERE sd.id = v.owner_id)
							) json
    FROM (SELECT *
	FROM (SELECT * FROM service_petition_details WHERE id=${id} AND tenant=${tenant})  AS foo
	LEFT JOIN service_petition_details_oidc USING (id)
	LEFT JOIN service_petition_details_saml USING (id)
	LEFT JOIN organizations USING (organization_id)
) as sd
