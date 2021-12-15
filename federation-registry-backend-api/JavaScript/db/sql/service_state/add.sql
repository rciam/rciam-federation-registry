INSERT INTO service_state (id,state,deployment_type,last_edited,created_at)
VALUES (${id},${state},${deployment_type},current_timestamp,current_timestamp)
RETURNING *
