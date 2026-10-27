-- Migrate service lifecycle timestamps to timezone-aware UTC instants.
--
-- Legacy source conventions:
--   * service_state.last_edited: PostgreSQL CURRENT_TIMESTAMP, Europe/Athens.
--   * service_state.created_at: PostgreSQL CURRENT_TIMESTAMP, Europe/Athens.
--   * service_petition_details.last_edited: PostgreSQL CURRENT_TIMESTAMP,
--     Europe/Athens.
--   * service_petition_details.reviewed_at: Node.js Date, UTC.
--
-- PostgreSQL stores timestamp with time zone values as UTC instants. Session
-- timezone only controls how those instants are displayed.
--
-- Run this migration once, before deploying the matching application code.
-- It deliberately fails unless all four targets are timestamp without time
-- zone, preventing a second conversion. This script includes the petition
-- conversion; do not run the older petition-only migration first.

BEGIN;

DO $$
DECLARE
  target_count integer;
  valid_type_count integer;
  actual_types text;
BEGIN
  WITH expected(table_name, column_name) AS (
    VALUES
      ('service_state', 'last_edited'),
      ('service_state', 'created_at'),
      ('service_petition_details', 'last_edited'),
      ('service_petition_details', 'reviewed_at')
  )
  SELECT
    count(c.column_name),
    count(*) FILTER (WHERE c.data_type = 'timestamp without time zone'),
    string_agg(
      format('%I.%I=%s', e.table_name, e.column_name, coalesce(c.data_type, 'missing')),
      ', '
      ORDER BY e.table_name, e.column_name
    )
  INTO target_count, valid_type_count, actual_types
  FROM expected e
  LEFT JOIN information_schema.columns c
    ON c.table_schema = current_schema()
   AND c.table_name = e.table_name
   AND c.column_name = e.column_name;

  IF target_count <> 4 OR valid_type_count <> 4 THEN
    RAISE EXCEPTION
      'Expected four timestamp without time zone columns; found %',
      actual_types;
  END IF;
END
$$;

LOCK TABLE
  service_state,
  service_petition_details
IN ACCESS EXCLUSIVE MODE;

ALTER TABLE service_state
  ALTER COLUMN last_edited TYPE timestamp with time zone
    USING last_edited AT TIME ZONE 'Europe/Athens',
  ALTER COLUMN created_at TYPE timestamp with time zone
    USING created_at AT TIME ZONE 'Europe/Athens';

ALTER TABLE service_petition_details
  ALTER COLUMN last_edited TYPE timestamp with time zone
    USING last_edited AT TIME ZONE 'Europe/Athens',
  ALTER COLUMN reviewed_at TYPE timestamp with time zone
    USING reviewed_at AT TIME ZONE 'UTC';

-- Display verification output in UTC without changing the database setting.
SET LOCAL TIME ZONE 'UTC';

SELECT table_name, column_name, data_type
FROM information_schema.columns
WHERE table_schema = current_schema()
  AND (table_name, column_name) IN (
    ('service_state', 'last_edited'),
    ('service_state', 'created_at'),
    ('service_petition_details', 'last_edited'),
    ('service_petition_details', 'reviewed_at')
  )
ORDER BY table_name, column_name;

SELECT
  count(*) FILTER (WHERE last_edited IS NOT NULL) AS submitted_timestamp_count,
  count(*) FILTER (WHERE reviewed_at IS NOT NULL) AS reviewed_timestamp_count,
  count(*) FILTER (
    WHERE last_edited IS NOT NULL
      AND reviewed_at IS NOT NULL
      AND reviewed_at < last_edited
  ) AS invalid_timestamp_order_count
FROM service_petition_details;

COMMIT;
