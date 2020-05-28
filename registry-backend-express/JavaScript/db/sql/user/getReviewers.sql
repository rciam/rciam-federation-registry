SELECT DISTINCT email,name FROM
((SELECT user_id FROM user_edu_person_entitlement WHERE edu_person_entitlement = ANY(ARRAY[${entitlements:csv}])) as ent
LEFT JOIN user_info on ent.user_id = user_info.id)
