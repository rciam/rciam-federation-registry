INSERT INTO user_info (sub,preferred_username,name,given_name,family_name,email)
VALUES (${sub},${preferred_username},${name},${given_name},${family_name},${email})
RETURNING *
