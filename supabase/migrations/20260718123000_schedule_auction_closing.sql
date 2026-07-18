-- Keep auction settlement on schedule without relying on a hosting-provider cron limit.
-- Safe to re-run.

CREATE EXTENSION IF NOT EXISTS pg_cron;

DO $$
DECLARE
  existing_job_id bigint;
BEGIN
  SELECT jobid
  INTO existing_job_id
  FROM cron.job
  WHERE jobname = 'close-expired-auctions'
  LIMIT 1;

  IF existing_job_id IS NOT NULL THEN
    PERFORM cron.unschedule(existing_job_id);
  END IF;

  PERFORM cron.schedule(
    'close-expired-auctions',
    '* * * * *',
    'SELECT public.close_expired_auctions();'
  );
END $$;
