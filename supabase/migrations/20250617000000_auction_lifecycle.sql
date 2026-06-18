-- Auction lifecycle: winner tracking, bid attribution, and cron close function.
-- Run this in the Supabase SQL editor or via supabase db push.

ALTER TABLE vehicles ADD COLUMN IF NOT EXISTS winner_id uuid REFERENCES profiles(id);

ALTER TABLE bids ADD COLUMN IF NOT EXISTS user_id uuid REFERENCES auth.users(id);

CREATE INDEX IF NOT EXISTS idx_bids_vehicle_amount ON bids(vehicle_id, amount DESC);
CREATE INDEX IF NOT EXISTS idx_vehicles_status_end_time ON vehicles(status, end_time);

CREATE OR REPLACE FUNCTION close_expired_auctions()
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  updated_count integer := 0;
  vehicle_record RECORD;
  winning_user_id uuid;
BEGIN
  FOR vehicle_record IN
    SELECT id
    FROM vehicles
    WHERE status = 'live'
      AND end_time IS NOT NULL
      AND end_time <= now()
  LOOP
    SELECT b.user_id
    INTO winning_user_id
    FROM bids b
    WHERE b.vehicle_id = vehicle_record.id
      AND b.user_id IS NOT NULL
    ORDER BY b.amount DESC, b.created_at ASC
    LIMIT 1;

    UPDATE vehicles
    SET
      status = 'ended',
      winner_id = winning_user_id
    WHERE id = vehicle_record.id;

    updated_count := updated_count + 1;
  END LOOP;

  RETURN updated_count;
END;
$$;
