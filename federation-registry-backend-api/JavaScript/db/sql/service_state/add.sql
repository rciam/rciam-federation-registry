INSERT INTO service_state (id,state,deployment_type,last_edited)
VALUES (${id},${state},${deployment_type},${last_edited})
RETURNING *
