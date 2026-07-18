"use server";

import { isAuctionLive } from "@/lib/auctions/vehicle-status";
import { requireCardOnFile } from "@/lib/bidding/require-card-on-file";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

type PlaceBidResult =
  | {
      ok: true;
      newBidCents: number;
    }
  | {
      ok: false;
      error: string;
    };

type VehicleRow = {
  id: string;
  current_bid: number | null;
  status: string | null;
  end_time: string | null;
  seller_id: string | null;
  reserve_price: number | null;
  year: number | null;
  make: string | null;
  model: string | null;
};

const MIN_BID_INCREMENT = 100;

function parseBidAmount(value: string) {
  const normalized = value.replace(/[$,\s]/g, "");
  const parsed = Number(normalized);

  return Number.isFinite(parsed) ? Math.round(parsed) : null;
}

async function loadVehicleForBidding(
  supabase: Awaited<ReturnType<typeof createClient>>,
  vehicleId: string,
): Promise<VehicleRow | null> {
  const { data, error } = await supabase
    .from("vehicles")
    .select("id, current_bid, status, end_time, seller_id, reserve_price, year, make, model")
    .eq("id", vehicleId)
    .single();

  if (error || !data) {
    return null;
  }

  return data as VehicleRow;
}

function auctionClosedMessage() {
  return "This auction has ended and is no longer accepting bids.";
}

async function requireIdentityVerified(
  supabase: Awaited<ReturnType<typeof createClient>>,
  userId: string,
): Promise<{ ok: true } | { ok: false; error: string }> {
  const requirePersona = process.env.REQUIRE_PERSONA_FOR_BIDDING === "true";

  if (!requirePersona) {
    return { ok: true };
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("identity_status")
    .eq("id", userId)
    .maybeSingle();

  if (profile?.identity_status !== "verified") {
    return {
      ok: false,
      error: "Complete identity verification before placing bids.",
    };
  }

  return { ok: true };
}

async function notifyPreviousHighBidder(
  vehicle: VehicleRow,
  newAmount: number,
  newBidderId: string,
) {
  const admin = createAdminClient();

  if (!admin) {
    return;
  }

  const { data: previousBids } = await admin
    .from("bids")
    .select("user_id, amount")
    .eq("vehicle_id", vehicle.id)
    .neq("user_id", newBidderId)
    .order("amount", { ascending: false })
    .limit(5);

  const previousLeader = previousBids?.[0];

  if (!previousLeader?.user_id) {
    return;
  }

  const title = `${vehicle.year ?? ""} ${vehicle.make ?? "Vehicle"} ${vehicle.model ?? ""}`.trim();

  await admin.from("notifications").insert({
    user_id: previousLeader.user_id,
    type: "outbid",
    title: "You've been outbid",
    body: `A new bid of $${newAmount.toLocaleString()} was placed on ${title}.`,
    href: `/auctions/${vehicle.id}`,
    vehicle_id: vehicle.id,
  });
}

function readAtomicBidCents(data: unknown) {
  const payload = Array.isArray(data) ? data[0] : data;

  if (!payload || typeof payload !== "object") {
    return null;
  }

  const newBidCents = (payload as Record<string, unknown>).new_bid_cents;
  const newBid = (payload as Record<string, unknown>).new_bid;

  if (typeof newBidCents === "number" && Number.isFinite(newBidCents)) {
    return newBidCents;
  }

  if (typeof newBid === "number" && Number.isFinite(newBid)) {
    return newBid * 100;
  }

  return null;
}

function mapAtomicBidError(message: string) {
  if (/could not find the function|function .* does not exist/i.test(message)) {
    return "Bidding is not fully configured yet. Run the latest Supabase migrations and try again.";
  }

  return message;
}

async function commitAtomicBid(
  vehicle: VehicleRow,
  userId: string,
  amount: number | null,
): Promise<PlaceBidResult> {
  const admin = createAdminClient();

  if (!admin) {
    return {
      ok: false,
      error: "Bidding is not fully configured yet. Add SUPABASE_SERVICE_ROLE_KEY and try again.",
    };
  }

  const { data, error } = await admin.rpc("place_bid_atomic", {
    p_vehicle_id: vehicle.id,
    p_bidder_id: userId,
    p_amount: amount,
    p_min_increment: MIN_BID_INCREMENT,
    p_snipe_extension_seconds: 120,
  });

  if (error) {
    return { ok: false, error: mapAtomicBidError(error.message) };
  }

  const newBidCents = readAtomicBidCents(data);

  if (newBidCents === null) {
    return {
      ok: false,
      error: "Bid was accepted but the response was incomplete. Refresh the listing.",
    };
  }

  await notifyPreviousHighBidder(vehicle, newBidCents / 100, userId);
  revalidatePath(`/auctions/${vehicle.id}`);
  revalidatePath("/");
  revalidatePath("/browse");

  return { ok: true, newBidCents };
}

export async function placeBid(
  vehicleId: string,
  bidAmount: string,
): Promise<PlaceBidResult> {
  const amount = parseBidAmount(bidAmount);

  if (!amount || amount <= 0) {
    return { ok: false, error: "Enter a valid bid amount." };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { ok: false, error: "You must be signed in to place a bid." };
  }

  const vehicle = await loadVehicleForBidding(supabase, vehicleId);

  if (!vehicle) {
    return { ok: false, error: "Vehicle listing was not found." };
  }

  if (!isAuctionLive(vehicle)) {
    return { ok: false, error: auctionClosedMessage() };
  }

  if (vehicle.seller_id === user.id) {
    return { ok: false, error: "You cannot bid on your own listing." };
  }

  const identityCheck = await requireIdentityVerified(supabase, user.id);

  if (!identityCheck.ok) {
    return identityCheck;
  }

  const cardCheck = await requireCardOnFile(supabase, user.id);

  if (!cardCheck.ok) {
    return { ok: false, error: cardCheck.error };
  }

  return commitAtomicBid(vehicle, user.id, amount);
}

export async function placeQuickBid(vehicleId: string): Promise<PlaceBidResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { ok: false, error: "You must be signed in to place a bid." };
  }

  const vehicle = await loadVehicleForBidding(supabase, vehicleId);

  if (!vehicle) {
    return { ok: false, error: "Vehicle listing was not found." };
  }

  if (!isAuctionLive(vehicle)) {
    return { ok: false, error: auctionClosedMessage() };
  }

  if (vehicle.seller_id === user.id) {
    return { ok: false, error: "You cannot bid on your own listing." };
  }

  const identityCheck = await requireIdentityVerified(supabase, user.id);

  if (!identityCheck.ok) {
    return identityCheck;
  }

  const cardCheck = await requireCardOnFile(supabase, user.id);

  if (!cardCheck.ok) {
    return { ok: false, error: cardCheck.error };
  }

  return commitAtomicBid(vehicle, user.id, null);
}
