UPDATE service_${type:raw}details_oidc SET reuse_refresh_tokens=${reuse_refresh_tokens},allow_introspection=${allow_introspection},client_id=${client_id},client_secret=${client_secret},access_token_validity_seconds=${access_token_validity_seconds},refresh_token_validity_seconds=${refresh_token_validity_seconds},clear_access_tokens_on_refresh=${clear_access_tokens_on_refresh},
code_challenge_method=${code_challenge_method},device_code_validity_seconds=${device_code_validity_seconds},id_token_timeout_seconds=${id_token_timeout_seconds}
WHERE id=${id}
