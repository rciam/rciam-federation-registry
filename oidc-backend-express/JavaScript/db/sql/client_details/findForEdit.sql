SELECT * FROM client_details
WHERE id=${id} AND requester=${requester} AND is_deleted=false AND model_id IS NULL
