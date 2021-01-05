SELECT true as result FROM
    (SELECT petition.group_id,service_details.group_id as s_group_id FROM
    (SELECT service_id,group_id FROM service_petition_details WHERE id=${id} AND reviewed_at IS NULL) as petition
   LEFT JOIN service_details ON service_details.id = petition.service_id) as petition
LEFT JOIN group_subs ON (group_subs.group_id=petition.group_id OR group_subs.group_id=petition.s_group_id) AND sub=${sub}
WHERE sub IS NOT NULL;
