INSERT INTO service_${type:raw}details_oidc (id,reuse_refresh_tokens,allow_introspection,client_id,client_secret,access_token_validity_seconds,refresh_token_validity_seconds,clear_access_tokens_on_refresh,code_challenge_method,device_code_validity_seconds,id_token_timeout_seconds)
VALUES (${id},${reuse_refresh_tokens},${allow_introspection},${client_id},${client_secret},${access_token_validity_seconds},${refresh_token_validity_seconds},${clear_access_tokens_on_refresh},${code_challenge_method},${device_code_validity_seconds},${id_token_timeout_seconds})
RETURNING *
