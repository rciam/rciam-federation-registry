UPDATE service_details SET deleted=true WHERE id IN
(SELECT id FROM service_state WHERE deployment_type='delete' AND id IN(${ids:csv}))
