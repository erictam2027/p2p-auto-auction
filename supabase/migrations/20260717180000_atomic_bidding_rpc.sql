-- Atomic bidding RPC: serializes bid validation, insert, current bid update, and snipe extension.
-- Safe to re-run.

ALTER TABLE vehicles ADD COLUMN IF NOT EXISTS seller_id uuid REFERENCES profiles(id);
ALTER TABLE vehicles ADD COLUMN IF NOT EXISTS bid_count integer NOT NULL DEFAULT 0;
ALTER TABLE vehicles ADD COLUMN IF NOT EXISTS snipe_extended_at timestamptz;

DROP FUNCTION IF EXISTS public.place_bid_atomic(uuid, integer, integer, integer);

CREATE OR REPLACE FUNCTION public.place_bid_atomic(
  p_vehicle_id uuid,
  p_bidder_id uuid,
  p_amount integer DEFAULT NULL,
  p_min_increment integer DEFAULT 100,
  p_snipe_extension_seconds integer DEFAULT 120
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  vehicle_record RECORD;
  previous_high_bidder_id uuid;
  previous_high_amount integer := 0;
  current_high_amount integer := 0;
  minimum_amount integer;
  target_amount integer;
  next_end_time timestamptz;
  next_bid_count integer;
BEGIN
  IF p_bidder_id IS NULL THEN
    RAISE EXCEPTION 'You must be signed in to place a bid.';
  END IF;

  IF p_min_increment IS NULL OR p_min_increment < 1 THEN
    p_min_increment := 100;
  END IF;

  IF p_snipe_extension_seconds IS NULL OR p_snipe_extension_seconds < 1 THEN
    p_snipe_extension_seconds := 120;
  END IF;

  SELECT
    id,
    current_bid,
    status,
    end_time,
    seller_id,
    bid_count,
    snipe_extended_at
  INTO vehicle_record
  FROM vehicles
  WHERE id = p_vehicle_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Vehicle listing was not found.';
  END IF;

  IF lower(coalesce(vehicle_record.status, '')) <> 'live'
     OR vehicle_record.end_time IS NULL
     OR vehicle_record.end_time <= now() THEN
    RAISE EXCEPTION 'This auction has ended and is no longer accepting bids.';
  END IF;

  IF vehicle_record.seller_id = p_bidder_id THEN
    RAISE EXCEPTION 'You cannot bid on your own listing.';
  END IF;

  SELECT b.user_id, b.amount
  INTO previous_high_bidder_id, previous_high_amount
  FROM bids b
  WHERE b.vehicle_id = p_vehicle_id
    AND b.user_id IS NOT NULL
  ORDER BY b.amount DESC, b.created_at ASC
  LIMIT 1;

  current_high_amount := greatest(
    coalesce(vehicle_record.current_bid, 0),
    coalesce(previous_high_amount, 0)
  );
  minimum_amount := current_high_amount + p_min_increment;
  target_amount := coalesce(p_amount, minimum_amount);

  IF target_amount <= 0 THEN
    RAISE EXCEPTION 'Enter a valid bid amount.';
  END IF;

  IF target_amount < minimum_amount THEN
    RAISE EXCEPTION 'Bid must be at least $%.', minimum_amount;
  END IF;

  IF vehicle_record.end_time <= now() + make_interval(secs => p_snipe_extension_seconds) THEN
    next_end_time := now() + make_interval(secs => p_snipe_extension_seconds);
  ELSE
    next_end_time := vehicle_record.end_time;
  END IF;

  INSERT INTO bids (vehicle_id, user_id, amount)
  VALUES (p_vehicle_id, p_bidder_id, target_amount);

  UPDATE vehicles
  SET
    current_bid = target_amount,
    end_time = next_end_time,
    snipe_extended_at = CASE
      WHEN next_end_time IS DISTINCT FROM vehicle_record.end_time THEN now()
      ELSE snipe_extended_at
    END
  WHERE id = p_vehicle_id
  RETURNING bid_count INTO next_bid_count;

  RETURN jsonb_build_object(
    'new_bid', target_amount,
    'new_bid_cents', target_amount * 100,
    'bid_count', coalesce(next_bid_count, 0),
    'end_time', next_end_time,
    'previous_high_bidder_id', previous_high_bidder_id
  );
END;
$$;

REVOKE ALL ON FUNCTION public.place_bid_atomic(uuid, uuid, integer, integer, integer) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.place_bid_atomic(uuid, uuid, integer, integer, integer) TO service_role;

NOTIFY pgrst, 'reload schema';
