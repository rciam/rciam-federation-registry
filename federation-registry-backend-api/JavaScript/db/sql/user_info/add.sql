INSERT INTO user_info (sub,preferred_username,name,given_name,family_name,email,tenant,role_id)
VALUES (${sub},${preferred_username},${name},${given_name},${family_name},${email},${tenant},${role_id})
RETURNING *
