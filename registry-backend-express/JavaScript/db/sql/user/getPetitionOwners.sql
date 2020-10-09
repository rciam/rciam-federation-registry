SELECT email,name,service_name FROM
(
  (SELECT requester,service_name FROM service_petition_details WHERE id=${id} AND type ='create') as usr
  LEFT JOIN user_info on usr.requester = user_info.sub
)
UNION
SELECT email,name,petition.service_name FROM
(
  (SELECT requester,service_name,service_id FROM service_petition_details WHERE id=${id}) as petition
  LEFT JOIN service_details  ON petition.service_id=service_details.id LEFT JOIN group_subs USING (group_id)
  LEFT JOIN user_info USING (sub)
);
