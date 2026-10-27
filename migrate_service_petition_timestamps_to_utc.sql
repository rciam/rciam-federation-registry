-- Migrate service-petition timestamps to timezone-aware instants.
--
-- Existing data was written using two different wall-clock conventions:
--   * last_edited was produced by PostgreSQL in Europe/Athens local time.
--   * reviewed_at was produced by the Node.js service in UTC.
--
-- PostgreSQL stores timestamp with time zone values as UTC instants. The AT
-- TIME ZONE clauses below tell PostgreSQL how to interpret each legacy
-- timestamp without time zone value before changing the column type.
-- Europe/Athens historical daylight-saving offsets are applied automatically.
--
-- Run this migration once, before deploying the matching application code.
-- It deliberately fails if either column has already been migrated, preventing
-- an accidental second timezone conversion.

BEGIN;

DO $$
DECLARE
  last_edited_type text;
  reviewed_at_type text;
BEGIN
  SELECT data_type
  INTO last_edited_type
  FROM information_schema.columns
  WHERE table_schema = current_schema()
    AND table_name = 'service_petition_details'
    AND column_name = 'last_edited';

  SELECT data_type
  INTO reviewed_at_type
  FROM information_schema.columns
  WHERE table_schema = current_schema()
    AND table_name = 'service_petition_details'
    AND column_name = 'reviewed_at';

  IF last_edited_type IS DISTINCT FROM 'timestamp without time zone'
     OR reviewed_at_type IS DISTINCT FROM 'timestamp without time zone' THEN
    RAISE EXCEPTION
      'Expected timestamp without time zone columns, found last_edited=% and reviewed_at=%',
      last_edited_type,
      reviewed_at_type;
  END IF;
END
$$;

LOCK TABLE service_petition_details IN ACCESS EXCLUSIVE MODE;

ALTER TABLE service_petition_details
  ALTER COLUMN last_edited TYPE timestamp with time zone
    USING last_edited AT TIME ZONE 'Europe/Athens',
  ALTER COLUMN reviewed_at TYPE timestamp with time zone
    USING reviewed_at AT TIME ZONE 'UTC';

-- Display migrated values as UTC for the verification result. This setting is
-- local to the transaction and does not change the database configuration.
SET LOCAL TIME ZONE 'UTC';

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
