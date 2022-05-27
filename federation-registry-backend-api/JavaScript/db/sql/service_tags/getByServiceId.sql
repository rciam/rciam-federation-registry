SELECT json_agg(tag) as tags
FROM service_tags WHERE service_id=${service_id} AND tenant=${tenant}