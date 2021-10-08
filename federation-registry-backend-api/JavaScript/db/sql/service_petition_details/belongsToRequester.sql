SELECT petition_id from 
    (select group_id,service_id as id,id as petition_id  from service_petition_details WHERE id=${petition_id}) as foo
    LEFT JOIN service_details USING (id) 
     LEFT JOIN group_subs ON foo.group_id=group_subs.group_id OR service_details.group_id = group_subs.group_id
WHERE sub=${sub};  