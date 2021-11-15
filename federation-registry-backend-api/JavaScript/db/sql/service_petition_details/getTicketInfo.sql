SELECT service_name,integration_environment,type,preferred_username as reviewer_username, email as reviewer_email,requester_username,requester_email,reviewed_at,protocol
  FROM
 (SELECT reviewed_at,protocol,service_name,integration_environment,type,preferred_username as requester_username, email as requester_email,reviewer FROM
    (
      SELECT *
      FROM
      (SELECT reviewed_at,service_name,integration_environment,type,requester,reviewer,protocol,Rank() over (Partition BY service_id ORDER BY reviewed_at DESC) AS RANK FROM service_petition_details WHERE service_id IN (${ids:csv}) AND integration_environment IN (${envs:csv}) AND tenant='egi' AND reviewed_at IS NOT NULL)rs WHERE Rank <= 1
    ) as petition
  LEFT JOIN user_info ON petition.requester = user_info.sub AND user_info.tenant='egi') as petition
LEFT JOIN user_info ON petition.reviewer = user_info.sub AND user_info.tenant='egi'
