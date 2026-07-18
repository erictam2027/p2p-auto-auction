import { createAdminClient } from "@/lib/supabase/admin";
import { NextResponse } from "next/server";

function isAuthorized(request: Request) {
  const secret = process.env.CRON_SECRET;
  const authorization = request.headers.get("authorization");

  return Boolean(secret && authorization === `Bearer ${secret}`);
}

export async function GET(request: Request) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ ok: false, error: "Unauthorized." }, { status: 401 });
  }

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
    messagesTable: false,
    watchlistTable: false,
    stripeConfigured: Boolean(
      process.env.STRIPE_SECRET_KEY?.trim() &&
        !process.env.STRIPE_SECRET_KEY.includes("placeholder"),
    ),
    cronConfigured: Boolean(process.env.CRON_SECRET?.trim()),
    keysavvyAffiliateConfigured: Boolean(process.env.KEYSAVVY_AFFILIATE_ID?.trim()),
    personaConfigured: Boolean(process.env.PERSONA_API_KEY?.trim()),
    vinauditConfigured: Boolean(process.env.VINAUDIT_API_KEY?.trim()),
  };

  const { error: rpcError } = await supabase.rpc("close_expired_auctions");
  checks.closeExpiredAuctionsRpc = !rpcError;

  const { error: escrowError } = await supabase.from("escrow_transactions").select("id").limit(1);
  checks.escrowTransactionsTable = !escrowError;

  const { error: vehicleError } = await supabase.from("vehicles").select("winner_id").limit(1);
  checks.vehiclesWinnerId = !vehicleError;

  const { error: bidsError } = await supabase.from("bids").select("user_id").limit(1);
  checks.bidsUserId = !bidsError;

  const { error: messagesError } = await supabase.from("messages").select("id").limit(1);
  checks.messagesTable = !messagesError;

  const { error: watchlistError } = await supabase.from("watchlist").select("id").limit(1);
  checks.watchlistTable = !watchlistError;

  const ok =
    checks.closeExpiredAuctionsRpc &&
    checks.escrowTransactionsTable &&
    checks.vehiclesWinnerId &&
    checks.bidsUserId;

  return NextResponse.json({ ok, checks });
}
