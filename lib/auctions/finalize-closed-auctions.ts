import type { SupabaseClient } from "@supabase/supabase-js";

const PLATFORM_FEE_RATE = 0.05;

type ClosedVehicleRow = {
  id: string;
  seller_id: string | null;
  winner_id: string | null;
  current_bid: number | null;
  year: number | null;
  make: string | null;
  model: string | null;
  reserve_price: number | null;
};

/**
 * Backfill escrow + win notifications for ended auctions that the RPC may have
 * closed before the finalize migration was applied.
 */
export async function finalizeClosedAuctions(
  supabase: SupabaseClient,
): Promise<{ escrowCreated: number; notificationsCreated: number }> {
  const { data: vehicles, error } = await supabase
    .from("vehicles")
    .select(
      "id, seller_id, winner_id, current_bid, year, make, model, reserve_price",
    )
    .eq("status", "ended")
    .not("winner_id", "is", null)
    .order("end_time", { ascending: false })
    .limit(50);

  if (error || !vehicles?.length) {
    return { escrowCreated: 0, notificationsCreated: 0 };
  }

  let escrowCreated = 0;
  let notificationsCreated = 0;

  for (const vehicle of vehicles as ClosedVehicleRow[]) {
    if (!vehicle.winner_id || !vehicle.seller_id) {
      continue;
    }

    const salePrice = vehicle.current_bid ?? 0;
    if (salePrice <= 0) {
      continue;
    }

    if (
      vehicle.reserve_price != null &&
      salePrice < vehicle.reserve_price
    ) {
      continue;
    }

    const title =
      [vehicle.year, vehicle.make, vehicle.model].filter(Boolean).join(" ") ||
      "A listing";

    const { data: existingEscrow } = await supabase
      .from("escrow_transactions")
      .select("id")
      .eq("vehicle_id", vehicle.id)
      .maybeSingle();

    if (!existingEscrow) {
      const { error: escrowError } = await supabase
        .from("escrow_transactions")
        .insert({
          vehicle_id: vehicle.id,
          buyer_id: vehicle.winner_id,
          seller_id: vehicle.seller_id,
          sale_price: salePrice,
          status: "pending",
          platform_fee_status: "pending",
          platform_fee_cents: Math.round(salePrice * 100 * PLATFORM_FEE_RATE),
          updated_at: new Date().toISOString(),
        });

      if (!escrowError) {
        escrowCreated += 1;
      }
    }

    const { data: existingWinNote } = await supabase
      .from("notifications")
      .select("id")
      .eq("user_id", vehicle.winner_id)
      .eq("vehicle_id", vehicle.id)
      .eq("type", "auction_won")
      .maybeSingle();

    if (!existingWinNote) {
      const { error: noteError } = await supabase.from("notifications").insert({
        user_id: vehicle.winner_id,
        type: "auction_won",
        title: "You won an auction",
        body: `${title} ended with you as the high bidder. Complete KeySavvy checkout to fund escrow.`,
        href: `/auctions/${vehicle.id}`,
        vehicle_id: vehicle.id,
      });

      if (!noteError) {
        notificationsCreated += 1;
      }
    }
  }

  return { escrowCreated, notificationsCreated };
}
