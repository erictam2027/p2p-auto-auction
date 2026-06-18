import { createAdminClient } from "@/lib/supabase/admin";
import { NextResponse } from "next/server";

export async function GET() {
  const supabase = createAdminClient();

  if (!supabase) {
    return NextResponse.json(
      {
        ok: false,
        error: "Supabase admin client is not configured.",
      },
      { status: 500 },
    );
  }

  const checks = {
    closeExpiredAuctionsRpc: false,
    escrowTransactionsTable: false,
    vehiclesWinnerId: false,
    bidsUserId: false,
    stripeConfigured: Boolean(process.env.STRIPE_SECRET_KEY?.trim()),
    cronConfigured: Boolean(process.env.CRON_SECRET?.trim()),
    keysavvyAffiliateConfigured: Boolean(process.env.KEYSAVVY_AFFILIATE_ID?.trim()),
  };

  const { error: rpcError } = await supabase.rpc("close_expired_auctions");
  checks.closeExpiredAuctionsRpc = !rpcError;

  const { error: escrowError } = await supabase.from("escrow_transactions").select("id").limit(1);
  checks.escrowTransactionsTable = !escrowError;

  const { error: vehicleError } = await supabase.from("vehicles").select("winner_id").limit(1);
  checks.vehiclesWinnerId = !vehicleError;

  const { error: bidsError } = await supabase.from("bids").select("user_id").limit(1);
  checks.bidsUserId = !bidsError;

  const ok = checks.closeExpiredAuctionsRpc &&
    checks.escrowTransactionsTable &&
    checks.vehiclesWinnerId &&
    checks.bidsUserId;

  return NextResponse.json({ ok, checks });
}
