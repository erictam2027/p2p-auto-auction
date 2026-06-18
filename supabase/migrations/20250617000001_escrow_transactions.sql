-- Post-auction escrow tracking for KeySavvy checkout and platform fee collection.
-- Run in the Supabase SQL editor or via supabase db push.

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

CREATE POLICY escrow_transactions_select_participants
  ON escrow_transactions
  FOR SELECT
  USING (
    auth.uid() = buyer_id
    OR auth.uid() = seller_id
  );

CREATE POLICY escrow_transactions_insert_buyer
  ON escrow_transactions
  FOR INSERT
  WITH CHECK (auth.uid() = buyer_id);

CREATE POLICY escrow_transactions_update_participants
  ON escrow_transactions
  FOR UPDATE
  USING (
    auth.uid() = buyer_id
    OR auth.uid() = seller_id
  );
