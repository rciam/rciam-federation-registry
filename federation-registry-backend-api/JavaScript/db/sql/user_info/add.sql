INSERT INTO user_info (sub,preferred_username,name,given_name,family_name,email,tenant)
VALUES (${sub},${preferred_username},${name},${given_name},${family_name},${email},${tenant})
RETURNING *
