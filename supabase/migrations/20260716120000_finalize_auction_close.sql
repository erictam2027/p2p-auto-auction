-- When auctions close: create pending escrow + win/reserve-not-met notifications.

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
