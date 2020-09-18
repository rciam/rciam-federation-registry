SELECT petition.protocol,type,service_id,group_subs.sub
  FROM
(SELECT protocol,type,service_id FROM service_petition_details WHERE id=${id} AND reviewed_at IS NULL AND tenant=${tenant}) as petition
 LEFT JOIN service_details ON petition.service_id=service_details.id
 LEFT JOIN group_subs USING (group_id)
 WHERE sub=${sub}
UNION
SELECT petition.protocol,type,service_id,group_subs.sub
 FROM
(SELECT protocol,type,service_id,group_id FROM service_petition_details WHERE id=${id} AND reviewed_at IS NULL AND tenant=${tenant}) as petition
LEFT JOIN group_subs USING (group_id)
WHERE sub=${sub}
