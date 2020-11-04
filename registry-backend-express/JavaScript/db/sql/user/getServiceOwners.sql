SELECT email,name,state,service_name,usr.tenant FROM
(
  (SELECT group_id,state,service_name,tenant FROM
    ((SELECT * FROM service_details WHERE id IN (${ids:csv})) as s_d LEFT JOIN service_state on s_d.id = service_state.id)) as usr
  LEFT JOIN group_subs using (group_id)
  LEFT JOIN user_info USING (sub)
)
