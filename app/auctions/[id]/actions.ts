"use server";

import { getSnipeExtendedEndTime, isAuctionLive } from "@/lib/auctions/vehicle-status";
import { requireCardOnFile } from "@/lib/bidding/require-card-on-file";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

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

function readNumber(row: Record<string, unknown> | null | undefined, keys: string[]) {
  if (!row) return 0;

  for (const key of keys) {
    const value = row[key];
    if (typeof value === "number" && Number.isFinite(value)) {
      return value;
    }
    if (typeof value === "string") {
      const parsed = Number(value);
      if (Number.isFinite(parsed)) {
        return parsed;
      }
    }
  }

  return 0;
}

async function getHighestBidAmount(
  supabase: Awaited<ReturnType<typeof createClient>>,
  vehicleId: string,
) {
  const { data } = await supabase
    .from("bids")
    .select("amount, bid_amount, current_bid")
    .eq("vehicle_id", vehicleId);

  return (data ?? []).reduce((highest, bid) => {
    const amount = readNumber(bid, ["amount", "bid_amount", "current_bid"]);
    return Math.max(highest, amount);
  }, 0);
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

async function applySnipeExtensionIfNeeded(
  supabase: Awaited<ReturnType<typeof createClient>>,
  vehicle: VehicleRow,
) {
  const extendedEndTime = getSnipeExtendedEndTime(vehicle.end_time);

  if (!extendedEndTime) {
    return;
  }

  await supabase
    .from("vehicles")
    .update({ end_time: extendedEndTime })
    .eq("id", vehicle.id);
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

async function commitBid(
  supabase: Awaited<ReturnType<typeof createClient>>,
  vehicle: VehicleRow,
  userId: string,
  amount: number,
): Promise<PlaceBidResult> {
  const { error: insertError } = await supabase.from("bids").insert({
    vehicle_id: vehicle.id,
    user_id: userId,
    amount,
  });

  if (insertError) {
    return { ok: false, error: insertError.message };
  }

  const { error: updateError } = await supabase
    .from("vehicles")
    .update({ current_bid: amount })
    .eq("id", vehicle.id);

  if (updateError) {
    return { ok: false, error: updateError.message };
  }

  await applySnipeExtensionIfNeeded(supabase, vehicle);
  await notifyPreviousHighBidder(vehicle, amount, userId);

  return { ok: true, newBidCents: amount * 100 };
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

  const currentBid = readNumber(vehicle, ["current_bid"]);
  const highestBid = Math.max(currentBid, await getHighestBidAmount(supabase, vehicleId));
  const minimum = highestBid + MIN_BID_INCREMENT;

  if (amount < minimum) {
    return {
      ok: false,
      error: `Bid must be at least $${minimum.toLocaleString()}.`,
    };
  }

  return commitBid(supabase, vehicle, user.id, amount);
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

  const currentBid = readNumber(vehicle, ["current_bid"]);
  const highestBid = Math.max(currentBid, await getHighestBidAmount(supabase, vehicleId));
  const amount = highestBid + MIN_BID_INCREMENT;

  return commitBid(supabase, vehicle, user.id, amount);
}
