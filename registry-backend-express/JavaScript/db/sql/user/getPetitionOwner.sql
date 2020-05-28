SELECT email,name,service_name FROM
(
  (SELECT requester,service_name FROM service_petition_details WHERE id=${id}) as usr
  LEFT JOIN user_info on usr.requester = user_info.sub
)
