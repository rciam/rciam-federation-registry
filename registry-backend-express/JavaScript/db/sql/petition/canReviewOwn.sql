SELECT id FROM (
  (SELECT service_id,id,type,requester
    FROM service_petition_details
    WHERE id=${id} AND reviewed_at IS NULL) as petition
  LEFT JOIN
    (SELECT id as service_id,group_id FROM service_details) as service
  USING (service_id)
) as data
LEFT JOIN
  (SELECT id as group_id,sub as my_sub FROM groups
    LEFT JOIN
      group_subs
    ON groups.id=group_subs.group_id
    WHERE sub=${sub}) AS groups
USING (group_id)
WHERE my_sub IS NOT NULL OR (type='create' AND requester=${sub})
