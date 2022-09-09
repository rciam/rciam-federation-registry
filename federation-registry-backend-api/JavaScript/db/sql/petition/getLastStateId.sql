select id FROM service_petition_details WHERE (type='edit' OR type='create') AND status='approved' AND service_id = (select service_id from service_petition_details WHERE id=${id} ) AND reviewed_at < (select CASE WHEN reviewed_at IS NULL THEN current_timestamp else reviewed_at END from service_petition_details WHERE id=${id}) ORDER BY reviewed_at DESC LIMIT 1  

