INSERT INTO service_state (id,state,deployment_type)
VALUES (${id},${state},${deployment_type})
RETURNING *
