SELECT json_agg(tag) as tags
FROM 
    (SELECT DISTINCT tag FROM service_tags WHERE tenant=${tenant_name} ${search_string:raw}) as foo