-- Run this entire file once in the Supabase SQL editor.
-- Safe to re-run: uses IF NOT EXISTS / CREATE OR REPLACE where possible.

-- Auction lifecycle
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

-- Escrow transactions
CREATE TABLE IF NOT EXISTS escrow_transactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  vehicle_id uuid NOT NULL REFERENCES vehicles(id) ON DELETE CASCADE,
  buyer_id uuid NOT NULL REFERENCES profiles(id),
  seller_id uuid NOT NULL REFERENCES profiles(id),
  sale_price integer NOT NULL,
  status text NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'checkout_started', 'payment_received', 'completed', 'cancelled')),
  platform_fee_status text NOT NULL DEFAULT 'pending'
    CHECK (platform_fee_status IN ('pending', 'paid', 'waived')),
  platform_fee_cents integer NOT NULL DEFAULT 0,
  keysavvy_transaction_id text,
  keysavvy_checkout_url text,
  stripe_checkout_session_id text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  completed_at timestamptz,
  UNIQUE (vehicle_id)
);

CREATE INDEX IF NOT EXISTS idx_escrow_transactions_buyer_id ON escrow_transactions(buyer_id);
CREATE INDEX IF NOT EXISTS idx_escrow_transactions_seller_id ON escrow_transactions(seller_id);
CREATE INDEX IF NOT EXISTS idx_escrow_transactions_status ON escrow_transactions(status);

ALTER TABLE escrow_transactions ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'escrow_transactions'
      AND policyname = 'escrow_transactions_select_participants'
  ) THEN
    CREATE POLICY escrow_transactions_select_participants
      ON escrow_transactions
      FOR SELECT
      USING (auth.uid() = buyer_id OR auth.uid() = seller_id);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'escrow_transactions'
      AND policyname = 'escrow_transactions_insert_buyer'
  ) THEN
    CREATE POLICY escrow_transactions_insert_buyer
      ON escrow_transactions
      FOR INSERT
      WITH CHECK (auth.uid() = buyer_id);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'escrow_transactions'
      AND policyname = 'escrow_transactions_update_participants'
  ) THEN
    CREATE POLICY escrow_transactions_update_participants
      ON escrow_transactions
      FOR UPDATE
      USING (auth.uid() = buyer_id OR auth.uid() = seller_id);
  END IF;
END $$;

-- Atomic bidding RPC
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
