SELECT json_agg(tag)
FROM 
    (SELECT DISTINCT tag FROM service_tags ${search_string:raw}) as foo