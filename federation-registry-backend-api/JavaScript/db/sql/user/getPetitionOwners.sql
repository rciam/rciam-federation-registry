SELECT DISTINCT email,name,service_name,type FROM
(
  SELECT email,name,service_name,type FROM
  (
    (SELECT requester,service_name,group_id,type FROM service_petition_details WHERE id=${id} AND type ='create') as usr
    LEFT JOIN group_subs USING (group_id)
    LEFT JOIN user_info USING (sub)  )
  UNION
  SELECT email,name,petition.service_name,type FROM
  (
    (SELECT requester,service_name,service_id,type FROM service_petition_details WHERE id=${id}) as petition
    LEFT JOIN service_details  ON petition.service_id=service_details.id LEFT JOIN group_subs USING (group_id)
    LEFT JOIN user_info USING (sub)
  )
) as foo
WHERE email IS NOT NULL;
