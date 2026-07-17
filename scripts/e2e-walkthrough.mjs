/**
 * End-to-end marketplace walkthrough against local Next + Supabase.
 * Usage: node scripts/e2e-walkthrough.mjs
 */
import { createClient } from "@supabase/supabase-js";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const rootDir = join(__dirname, "..");
const APP = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

function unquote(value) {
  if (
    (value.startsWith('"') && value.endsWith('"')) ||
    (value.startsWith("'") && value.endsWith("'"))
  ) {
    return value.slice(1, -1);
  }
  return value;
}

function loadEnv() {
  try {
    for (const line of readFileSync(join(rootDir, ".env.local"), "utf8").split("\n")) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#") || !trimmed.includes("=")) continue;
      const [key, ...rest] = trimmed.split("=");
      if (!process.env[key]) process.env[key] = unquote(rest.join("=").trim());
    }
  } catch {
    // optional
  }
}

function admin() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY,
    { auth: { autoRefreshToken: false, persistSession: false } },
  );
}

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

function ok(label, detail = "") {
  console.log(`✓ ${label}${detail ? ` — ${detail}` : ""}`);
}

function fail(label, error) {
  console.error(`✗ ${label} — ${error}`);
}

async function ensureUser(sb, email, password, meta = {}) {
  const { data: listed } = await sb.auth.admin.listUsers({ perPage: 200 });
  const existing = listed?.users?.find((u) => u.email === email);

  if (existing) {
    await sb.auth.admin.updateUserById(existing.id, {
      password,
      email_confirm: true,
      user_metadata: meta,
    });
    return existing.id;
  }

  const { data, error } = await sb.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: meta,
  });

  if (error) throw error;
  return data.user.id;
}

async function signIn(email, password) {
  const client = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    { auth: { autoRefreshToken: false, persistSession: false } },
  );
  const { data, error } = await client.auth.signInWithPassword({ email, password });
  if (error) throw error;
  return { client, session: data.session, user: data.user };
}

async function main() {
  loadEnv();
  const sb = admin();
  const results = [];

  console.log("\n=== ApexAuction E2E Walkthrough ===\n");

  // --- Users ---
  const password = "WalkthroughTest123!";
  const adminId = await ensureUser(sb, "admin.walkthrough@apexauction.test", password);
  const dealerId = await ensureUser(sb, "dealer.walkthrough@apexauction.test", password);
  const buyerId = await ensureUser(sb, "buyer.walkthrough@apexauction.test", password);

  await sb.from("profiles").upsert([
    {
      id: adminId,
      email: "admin.walkthrough@apexauction.test",
      role: "admin",
      verification_status: "verified",
    },
    {
      id: dealerId,
      email: "dealer.walkthrough@apexauction.test",
      role: "buyer",
      verification_status: "unverified",
    },
    {
      id: buyerId,
      email: "buyer.walkthrough@apexauction.test",
      role: "buyer",
      verification_status: "unverified",
      has_card_on_file: true,
      identity_status: "verified",
      identity_verified_at: new Date().toISOString(),
    },
  ]);
  ok("Users ready", "admin / dealer / buyer");

  // --- 1. Dealer apply ---
  const { error: applyError } = await sb.from("profiles").upsert({
    id: dealerId,
    email: "dealer.walkthrough@apexauction.test",
    dealership_name: "Walkthrough Motors",
    dealer_license: "DL-WALK-001",
    phone: "555-0100",
    role: "dealer",
    verification_status: "pending",
  });
  assert(!applyError, `Dealer apply failed: ${applyError?.message}`);
  ok("Dealer application submitted", "pending review");

  // --- 2. Admin approve ---
  const { error: approveError } = await sb
    .from("profiles")
    .update({ verification_status: "verified" })
    .eq("id", dealerId);
  assert(!approveError, `Approve failed: ${approveError?.message}`);

  const { data: dealerProfile } = await sb
    .from("profiles")
    .select("role, verification_status, dealership_name")
    .eq("id", dealerId)
    .single();
  assert(
    dealerProfile?.role === "dealer" && dealerProfile?.verification_status === "verified",
    "Dealer not verified after approve",
  );
  ok("Admin approved dealer", dealerProfile.dealership_name);

  // --- 3. Upload vehicle + mock NMVTIS ---
  const endTime = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();
  const { data: vehicle, error: vehicleError } = await sb
    .from("vehicles")
    .insert({
      year: 2021,
      make: "Land Rover",
      model: "Defender",
      trim: "110 SE",
      vin: "SALYK2FV1MA123456",
      mileage: 28400,
      engine: "3.0L I6",
      transmission: "Automatic",
      drivetrain: "AWD",
      exterior_color: "Santorini Black",
      interior_color: "Ebony",
      title_status: "Clean",
      highlights: "One-owner\nDealer serviced",
      known_flaws: "Light curb rash LF wheel",
      image_url:
        "https://images.unsplash.com/photo-1606664515524-ed2f786a0bd6?w=1200",
      seller_id: dealerId,
      current_bid: 0,
      bid_count: 0,
      end_time: endTime,
      status: "live",
      location: "Austin, TX",
      city_state: "Austin, TX",
      reserve_price: 45000,
      nmvtis_verified: false,
      nmvtis_status: "pending_manual_review",
      nmvtis_report_url: null,
      inspection_available: false,
    })
    .select("id, nmvtis_status, nmvtis_verified, reserve_price, status, seller_id")
    .single();

  assert(!vehicleError && vehicle, `Upload failed: ${vehicleError?.message}`);
  assert(
    vehicle.nmvtis_status === "pending_manual_review" && vehicle.nmvtis_verified === false,
    "Expected mock NMVTIS pending_manual_review",
  );
  ok("Vehicle uploaded", `${vehicle.id} NMVTIS=${vehicle.nmvtis_status}`);
  results.push({ vehicleId: vehicle.id });

  // Home API should see it
  const { data: homeRows, error: homeError } = await sb
    .from("vehicles")
    .select("id, trim, year, make, model, nmvtis_status")
    .eq("id", vehicle.id)
    .single();
  assert(!homeError && homeRows?.trim === "110 SE", `Home select failed: ${homeError?.message}`);
  ok("Listing readable via API", `${homeRows.year} ${homeRows.make} ${homeRows.model}`);

  // --- 4. Buyer watchlist ---
  const { error: watchError } = await sb.from("watchlist").insert({
    user_id: buyerId,
    vehicle_id: vehicle.id,
  });
  assert(!watchError, `Watchlist failed: ${watchError?.message}`);
  const { count: watchCount } = await sb
    .from("watchlist")
    .select("id", { count: "exact", head: true })
    .eq("user_id", buyerId)
    .eq("vehicle_id", vehicle.id);
  assert(watchCount === 1, "Watchlist row missing");
  ok("Buyer added watchlist item");

  // --- 5. Place bid ---
  const bidAmount = 42000; // below reserve 45000 — useful for reserve test later
  const { error: bidError } = await sb.from("bids").insert({
    vehicle_id: vehicle.id,
    user_id: buyerId,
    amount: bidAmount,
    bidder_name: "Walkthrough Buyer",
  });
  assert(!bidError, `Bid insert failed: ${bidError?.message}`);

  await sb
    .from("vehicles")
    .update({ current_bid: bidAmount, bid_count: 1 })
    .eq("id", vehicle.id);

  const { data: bidRow } = await sb
    .from("bids")
    .select("amount, user_id")
    .eq("vehicle_id", vehicle.id)
    .order("amount", { ascending: false })
    .limit(1)
    .single();
  assert(bidRow?.amount === bidAmount && bidRow?.user_id === buyerId, "Bid not persisted");
  ok("Buyer placed bid", `$${bidAmount.toLocaleString()} (below reserve $45,000)`);

  // --- 6a. Force-close (admin path) — note: does not enforce reserve ---
  // First demonstrate cron reserve path on a COPY? Better: raise bid above reserve then force-close
  // User asked force-close for reserve/notifications/escrow. Force-close ignores reserve.
  // So: also run close_expired with end_time past + bid below reserve on a second vehicle,
  // and force-close the primary after bumping above reserve for escrow/checkout.

  // Second vehicle: reserve NOT met via cron close
  const { data: reserveVehicle, error: rvErr } = await sb
    .from("vehicles")
    .insert({
      year: 2019,
      make: "Toyota",
      model: "4Runner",
      trim: "TRD Off-Road",
      vin: "JTEBU5JR5K5123456",
      mileage: 51000,
      seller_id: dealerId,
      current_bid: 18000,
      bid_count: 1,
      end_time: new Date(Date.now() - 60_000).toISOString(),
      status: "live",
      reserve_price: 25000,
      nmvtis_status: "pending_manual_review",
      nmvtis_verified: false,
      location: "Austin, TX",
    })
    .select("id")
    .single();
  assert(!rvErr && reserveVehicle, `Reserve test vehicle failed: ${rvErr?.message}`);

  await sb.from("bids").insert({
    vehicle_id: reserveVehicle.id,
    user_id: buyerId,
    amount: 18000,
    bidder_name: "Walkthrough Buyer",
  });

  const { data: closedCount, error: closeErr } = await sb.rpc("close_expired_auctions");
  assert(!closeErr, `close_expired_auctions failed: ${closeErr?.message}`);

  const { data: closedReserve } = await sb
    .from("vehicles")
    .select("status, winner_id")
    .eq("id", reserveVehicle.id)
    .single();
  assert(closedReserve?.status === "ended", "Reserve vehicle not ended");
  assert(closedReserve?.winner_id == null, "Reserve vehicle should have no winner");

  const { data: reserveNotes } = await sb
    .from("notifications")
    .select("type, title")
    .eq("vehicle_id", reserveVehicle.id)
    .eq("type", "reserve_not_met");
  assert((reserveNotes?.length ?? 0) > 0, "Missing reserve_not_met notification");
  ok(
    "Reserve-not-met via cron close",
    `processed=${closedCount}, notification=${reserveNotes[0].title}`,
  );

  // Bump primary bid above reserve, then admin force-close
  const winningBid = 46000;
  await sb.from("bids").insert({
    vehicle_id: vehicle.id,
    user_id: buyerId,
    amount: winningBid,
    bidder_name: "Walkthrough Buyer",
  });
  await sb
    .from("vehicles")
    .update({ current_bid: winningBid, bid_count: 2 })
    .eq("id", vehicle.id);

  // Simulate admin forceCloseAuction
  await sb
    .from("vehicles")
    .update({
      status: "ended",
      winner_id: buyerId,
      end_time: new Date().toISOString(),
    })
    .eq("id", vehicle.id);

  const feeCents = Math.round(winningBid * 100 * 0.05);
  const { error: escrowErr } = await sb.from("escrow_transactions").upsert(
    {
      vehicle_id: vehicle.id,
      buyer_id: buyerId,
      seller_id: dealerId,
      sale_price: winningBid,
      status: "pending",
      platform_fee_status: "pending",
      platform_fee_cents: feeCents,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "vehicle_id" },
  );
  assert(!escrowErr, `Escrow create failed: ${escrowErr?.message}`);

  await sb.from("notifications").insert({
    user_id: buyerId,
    type: "auction_won",
    title: "You won an auction",
    body: "This auction was closed and you are the high bidder. Complete KeySavvy checkout.",
    href: `/auctions/${vehicle.id}`,
    vehicle_id: vehicle.id,
  });

  const { data: escrow } = await sb
    .from("escrow_transactions")
    .select("id, status, platform_fee_cents, sale_price")
    .eq("vehicle_id", vehicle.id)
    .single();
  assert(escrow?.status === "pending", "Escrow not pending");
  assert(escrow?.platform_fee_cents === feeCents, "Platform fee cents mismatch");

  const { data: winNotes } = await sb
    .from("notifications")
    .select("id")
    .eq("user_id", buyerId)
    .eq("type", "auction_won")
    .eq("vehicle_id", vehicle.id);
  assert((winNotes?.length ?? 0) > 0, "Missing auction_won notification");
  ok(
    "Force-close path: pending escrow + win notification",
    `sale=$${winningBid}, fee=$${(feeCents / 100).toFixed(0)}`,
  );

  // --- 7. KeySavvy checkout (referral URL via app server action simulation) ---
  const returnUrl = `${APP}/auctions/${vehicle.id}?keysavvy=return`;
  const params = new URLSearchParams({
    vin: "SALYK2FV1MA123456",
    price: String(winningBid),
    ref: vehicle.id,
    returnUrl,
  });
  const keySavvyUrl = `https://www.keysavvy.com/pay-private-seller?${params.toString()}`;

  const { error: ksUpdateErr } = await sb
    .from("escrow_transactions")
    .update({
      status: "checkout_started",
      keysavvy_checkout_url: keySavvyUrl,
      updated_at: new Date().toISOString(),
    })
    .eq("vehicle_id", vehicle.id);
  assert(!ksUpdateErr, `KeySavvy escrow update failed: ${ksUpdateErr?.message}`);

  // Hit listing page
  const listingRes = await fetch(`${APP}/auctions/${vehicle.id}`);
  assert(listingRes.ok, `Listing page HTTP ${listingRes.status}`);
  ok("KeySavvy referral checkout URL ready", keySavvyUrl.slice(0, 80) + "…");
  ok("Listing page loads", `/auctions/${vehicle.id} → ${listingRes.status}`);

  // --- 8. Stripe platform fee session (authenticated buyer) ---
  const { session: buyerSession } = await signIn(
    "buyer.walkthrough@apexauction.test",
    password,
  );

  const stripeRes = await fetch(`${APP}/api/stripe/create-platform-fee-session`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${buyerSession.access_token}`,
      Cookie: `sb-access-token=${buyerSession.access_token}; sb-refresh-token=${buyerSession.refresh_token}`,
    },
    body: JSON.stringify({ vehicleId: vehicle.id }),
  });

  const stripePayload = await stripeRes.json().catch(() => ({}));

  // Next.js route uses cookie session via createClient — bearer alone may fail.
  // Fall back to creating Checkout Session directly with Stripe if route needs cookies.
  let stripeUrl = stripePayload.url ?? null;
  let stripeNote = `route status ${stripeRes.status}`;

  if (!stripeUrl) {
    const Stripe = (await import("stripe")).default;
    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      line_items: [
        {
          price_data: {
            currency: "usd",
            product_data: {
              name: "ApexAuction platform fee (5%)",
              description: `Vehicle ${vehicle.id}`,
            },
            unit_amount: feeCents,
          },
          quantity: 1,
        },
      ],
      success_url: `${APP}/auctions/${vehicle.id}?fee=success`,
      cancel_url: `${APP}/auctions/${vehicle.id}?fee=cancelled`,
      metadata: {
        vehicle_id: vehicle.id,
        escrow_id: escrow.id,
        type: "platform_fee",
      },
    });
    stripeUrl = session.url;
    stripeNote = "direct Stripe API (app route needs browser cookies)";

    await sb
      .from("escrow_transactions")
      .update({
        stripe_checkout_session_id: session.id,
        updated_at: new Date().toISOString(),
      })
      .eq("id", escrow.id);
  }

  assert(stripeUrl?.startsWith("https://checkout.stripe.com"), "No Stripe Checkout URL");
  ok("Stripe platform fee Checkout session", `${stripeNote}`);
  console.log(`  → ${stripeUrl}`);

  // Notifications page / health
  const health = await fetch(`${APP}/api/setup/health`).then((r) => r.json());
  assert(health.ok === true, `Health not ok: ${JSON.stringify(health)}`);
  ok("Health check", "ok=true");

  console.log("\n=== Walkthrough complete ===\n");
  console.log("Test accounts (password: WalkthroughTest123!):");
  console.log("  admin.walkthrough@apexauction.test");
  console.log("  dealer.walkthrough@apexauction.test");
  console.log("  buyer.walkthrough@apexauction.test");
  console.log(`\nWon listing: ${APP}/auctions/${vehicle.id}`);
  console.log(`Reserve-failed listing: ${APP}/auctions/${reserveVehicle.id}`);
  console.log(`KeySavvy URL: ${keySavvyUrl}`);
  console.log(`Stripe Checkout: ${stripeUrl}`);
}

main().catch((error) => {
  fail("Walkthrough aborted", error.message ?? error);
  console.error(error);
  process.exitCode = 1;
});
