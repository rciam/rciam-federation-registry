INSERT INTO service_${type:raw}details_saml (id,metadata_url,entity_id)
VALUES (${id},${metadata_url},${entity_id})
RETURNING *
