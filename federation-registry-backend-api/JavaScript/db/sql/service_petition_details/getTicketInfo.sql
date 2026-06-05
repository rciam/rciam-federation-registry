SELECT
  petition.service_name,
  petition.integration_environment,
  petition.type,
  reviewer_info.preferred_username AS reviewer_username,
  reviewer_info.email AS reviewer_email,
  petition.requester_username,
  petition.requester_email,
  petition.reviewed_at,
  petition.protocol,
  petition.tenant
FROM (
  SELECT
    petition.reviewed_at,
    petition.protocol,
    petition.service_name,
    petition.integration_environment,
    petition.type,
    requester_info.preferred_username AS requester_username,
    requester_info.email AS requester_email,
    petition.reviewer,
    petition.tenant
  FROM (
    SELECT *
    FROM (
      SELECT
        reviewed_at,
        service_name,
        integration_environment,
        type,
        requester,
        reviewer,
        protocol,
        tenant,
        RANK() OVER (
          PARTITION BY service_id
          ORDER BY reviewed_at DESC
        ) AS rank
      FROM service_petition_details
      WHERE
        service_id IN (${ids:csv})
        ${tenant_selector:raw}
        AND reviewed_at IS NOT NULL
    ) rs
    WHERE rank <= 1
  ) AS petition
  LEFT JOIN user_info AS requester_info
    ON petition.requester = requester_info.sub
   AND petition.tenant = requester_info.tenant
) AS petition
LEFT JOIN user_info AS reviewer_info
  ON petition.reviewer = reviewer_info.sub
 AND petition.tenant = reviewer_info.tenant;