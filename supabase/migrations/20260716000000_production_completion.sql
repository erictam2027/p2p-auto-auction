-- Production completion: missing columns, messages, watchlists, notifications, identity.
-- Safe to re-run.

-- Vehicles: auction + trust fields
ALTER TABLE vehicles ADD COLUMN IF NOT EXISTS reserve_price integer;
ALTER TABLE vehicles ADD COLUMN IF NOT EXISTS bid_count integer NOT NULL DEFAULT 0;
ALTER TABLE vehicles ADD COLUMN IF NOT EXISTS nmvtis_verified boolean NOT NULL DEFAULT false;
ALTER TABLE vehicles ADD COLUMN IF NOT EXISTS nmvtis_status text;
ALTER TABLE vehicles ADD COLUMN IF NOT EXISTS nmvtis_report_url text;
ALTER TABLE vehicles ADD COLUMN IF NOT EXISTS inspection_available boolean NOT NULL DEFAULT false;
ALTER TABLE vehicles ADD COLUMN IF NOT EXISTS inspection_status text;
ALTER TABLE vehicles ADD COLUMN IF NOT EXISTS lemon_squad_order_id text;
ALTER TABLE vehicles ADD COLUMN IF NOT EXISTS location text;
ALTER TABLE vehicles ADD COLUMN IF NOT EXISTS city_state text;
ALTER TABLE vehicles ADD COLUMN IF NOT EXISTS trim text;
ALTER TABLE vehicles ADD COLUMN IF NOT EXISTS recent_service text[];
ALTER TABLE vehicles ADD COLUMN IF NOT EXISTS modifications text[];
ALTER TABLE vehicles ADD COLUMN IF NOT EXISTS equipment text[];
ALTER TABLE vehicles ADD COLUMN IF NOT EXISTS dealer_notes text[];

-- Profiles: identity verification
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS persona_inquiry_id text;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS identity_status text NOT NULL DEFAULT 'unverified'
  CHECK (identity_status IN ('unverified', 'pending', 'verified', 'failed'));
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS identity_verified_at timestamptz;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS stripe_customer_id text;

-- Messages (buyer ↔ seller)
CREATE TABLE IF NOT EXISTS messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  vehicle_id uuid NOT NULL REFERENCES vehicles(id) ON DELETE CASCADE,
  sender_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  receiver_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  content text NOT NULL,
  read_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_messages_receiver_created ON messages(receiver_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_messages_vehicle ON messages(vehicle_id, created_at ASC);

ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'messages' AND policyname = 'messages_select_participants'
  ) THEN
    CREATE POLICY messages_select_participants ON messages FOR SELECT
      USING (auth.uid() = sender_id OR auth.uid() = receiver_id);
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'messages' AND policyname = 'messages_insert_sender'
  ) THEN
    CREATE POLICY messages_insert_sender ON messages FOR INSERT
      WITH CHECK (auth.uid() = sender_id);
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'messages' AND policyname = 'messages_update_participants'
  ) THEN
    CREATE POLICY messages_update_participants ON messages FOR UPDATE
      USING (auth.uid() = sender_id OR auth.uid() = receiver_id);
  END IF;
END $$;

-- Watchlist
CREATE TABLE IF NOT EXISTS watchlist (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  vehicle_id uuid NOT NULL REFERENCES vehicles(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, vehicle_id)
);

CREATE INDEX IF NOT EXISTS idx_watchlist_user ON watchlist(user_id);

ALTER TABLE watchlist ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'watchlist' AND policyname = 'watchlist_select_own'
  ) THEN
    CREATE POLICY watchlist_select_own ON watchlist FOR SELECT USING (auth.uid() = user_id);
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'watchlist' AND policyname = 'watchlist_insert_own'
  ) THEN
    CREATE POLICY watchlist_insert_own ON watchlist FOR INSERT WITH CHECK (auth.uid() = user_id);
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'watchlist' AND policyname = 'watchlist_delete_own'
  ) THEN
    CREATE POLICY watchlist_delete_own ON watchlist FOR DELETE USING (auth.uid() = user_id);
  END IF;
END $$;

-- In-app notifications
CREATE TABLE IF NOT EXISTS notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  type text NOT NULL,
  title text NOT NULL,
  body text NOT NULL,
  href text,
  vehicle_id uuid REFERENCES vehicles(id) ON DELETE SET NULL,
  read_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications(user_id, created_at DESC);

ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'notifications' AND policyname = 'notifications_select_own'
  ) THEN
    CREATE POLICY notifications_select_own ON notifications FOR SELECT USING (auth.uid() = user_id);
    CREATE POLICY notifications_update_own ON notifications FOR UPDATE USING (auth.uid() = user_id);
  END IF;
END $$;

-- Keep bid_count in sync
CREATE OR REPLACE FUNCTION bump_vehicle_bid_count()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE vehicles
  SET bid_count = COALESCE(bid_count, 0) + 1
  WHERE id = NEW.vehicle_id;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_bump_vehicle_bid_count ON bids;
CREATE TRIGGER trg_bump_vehicle_bid_count
  AFTER INSERT ON bids
  FOR EACH ROW
  EXECUTE FUNCTION bump_vehicle_bid_count();

-- Close auctions: reserve gate + pending escrow + win/seller notifications
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
  winning_amount integer;
  reserve_met boolean;
  title_text text;
  fee_cents integer;
BEGIN
  FOR vehicle_record IN
    SELECT
      id,
      seller_id,
      reserve_price,
      current_bid,
      year,
      make,
      model
    FROM vehicles
    WHERE status = 'live'
      AND end_time IS NOT NULL
      AND end_time <= now()
  LOOP
    SELECT b.user_id, b.amount
    INTO winning_user_id, winning_amount
    FROM bids b
    WHERE b.vehicle_id = vehicle_record.id
      AND b.user_id IS NOT NULL
    ORDER BY b.amount DESC, b.created_at ASC
    LIMIT 1;

    reserve_met := true;
    IF vehicle_record.reserve_price IS NOT NULL
       AND (winning_amount IS NULL OR winning_amount < vehicle_record.reserve_price) THEN
      winning_user_id := NULL;
      reserve_met := false;
    END IF;

    UPDATE vehicles
    SET
      status = 'ended',
      winner_id = winning_user_id
    WHERE id = vehicle_record.id;

    title_text := trim(
      both ' '
      from concat_ws(
        ' ',
        vehicle_record.year::text,
        vehicle_record.make,
        vehicle_record.model
      )
    );

    IF winning_user_id IS NOT NULL AND winning_amount IS NOT NULL THEN
      fee_cents := round(winning_amount * 100 * 0.05)::integer;

      INSERT INTO escrow_transactions (
        vehicle_id,
        buyer_id,
        seller_id,
        sale_price,
        status,
        platform_fee_status,
        platform_fee_cents,
        updated_at
      )
      VALUES (
        vehicle_record.id,
        winning_user_id,
        vehicle_record.seller_id,
        winning_amount,
        'pending',
        'pending',
        fee_cents,
        now()
      )
      ON CONFLICT (vehicle_id) DO NOTHING;

      INSERT INTO notifications (user_id, type, title, body, href, vehicle_id)
      VALUES (
        winning_user_id,
        'auction_won',
        'You won an auction',
        coalesce(nullif(title_text, ''), 'A listing') ||
          ' ended with you as the high bidder. Complete KeySavvy checkout to fund escrow.',
        '/auctions/' || vehicle_record.id::text,
        vehicle_record.id
      );

      IF vehicle_record.seller_id IS NOT NULL THEN
        INSERT INTO notifications (user_id, type, title, body, href, vehicle_id)
        VALUES (
          vehicle_record.seller_id,
          'auction_sold',
          'Your auction sold',
          coalesce(nullif(title_text, ''), 'Your listing') ||
            ' closed with a winning bid. Track escrow on Payouts.',
          '/dashboard/payouts',
          vehicle_record.id
        );
      END IF;
    ELSIF NOT reserve_met AND vehicle_record.seller_id IS NOT NULL THEN
      INSERT INTO notifications (user_id, type, title, body, href, vehicle_id)
      VALUES (
        vehicle_record.seller_id,
        'reserve_not_met',
        'Reserve not met',
        coalesce(nullif(title_text, ''), 'Your listing') ||
          ' ended without meeting reserve. No sale was completed.',
        '/auctions/' || vehicle_record.id::text,
        vehicle_record.id
      );
    END IF;

    updated_count := updated_count + 1;
  END LOOP;

  RETURN updated_count;
END;
$$;
