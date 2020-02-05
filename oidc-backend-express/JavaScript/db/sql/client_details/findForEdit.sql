SELECT * FROM client_details
WHERE id=${id} AND is_deleted=false AND model_id IS NULL
