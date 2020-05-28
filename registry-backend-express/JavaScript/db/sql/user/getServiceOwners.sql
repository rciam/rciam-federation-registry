SELECT email,name,state,service_name FROM
(
  (SELECT requester,state,service_name FROM
    ((SELECT * FROM service_details WHERE id = ANY(ARRAY[${ids:csv}])) as s_d LEFT JOIN service_state on s_d.id = service_state.id)) as usr
  LEFT JOIN user_info on usr.requester = user_info.sub
)
