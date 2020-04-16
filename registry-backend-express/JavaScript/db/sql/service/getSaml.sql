SELECT json_build_object('service_name', sd.service_name,'service_description',sd.service_description,
						 'logo_uri',sd.logo_uri,'policy_uri',sd.policy_uri,'entity_id',sd.entity_id,'integration_environment',sd.integration_environment,
		         'protocol',sd.protocol,'metadata_url',sd.metadata_url,
						 ${extra_data:raw}
						 'contacts',
						 	(SELECT json_agg(json_build_object('email',v.value,'type',v.type))
							 FROM service_${type:raw}contacts v WHERE sd.id = v.owner_id)
							) json
    FROM (SELECT *
	FROM (SELECT * FROM service_${type:raw}details WHERE id=${id}) AS foo
	LEFT JOIN service_${type:raw}details_saml USING (id)) as sd
