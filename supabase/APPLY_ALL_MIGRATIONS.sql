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
