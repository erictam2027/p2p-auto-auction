"use server";

import { createClient } from "@/lib/supabase/server";

type PlaceBidResult =
  | {
      ok: true;
    }
  | {
      ok: false;
      error: string;
    };

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
    .select("*")
    .eq("vehicle_id", vehicleId);

  return (data ?? []).reduce((highest, bid) => {
    const amount = readNumber(bid, ["amount", "bid_amount", "current_bid"]);
    return Math.max(highest, amount);
  }, 0);
}

export async function placeBid(
  vehicleId: string,
  bidAmount: string,
): Promise<PlaceBidResult> {
  const amount = parseBidAmount(bidAmount);

  if (!amount || amount <= 0) {
    return {
      ok: false,
      error: "Enter a valid bid amount.",
    };
  }

  const supabase = await createClient();
  const { data: vehicle, error: vehicleError } = await supabase
    .from("vehicles")
    .select("id,current_bid")
    .eq("id", vehicleId)
    .single();

  if (vehicleError || !vehicle) {
    return {
      ok: false,
      error: vehicleError?.message ?? "Vehicle listing was not found.",
    };
  }

  const currentBid = readNumber(vehicle, ["current_bid"]);
  const highestBid = Math.max(currentBid, await getHighestBidAmount(supabase, vehicleId));

  if (amount <= highestBid) {
    return {
      ok: false,
      error: `Bid must be higher than $${highestBid.toLocaleString()}.`,
    };
  }

  const { error: insertError } = await supabase.from("bids").insert({
    vehicle_id: vehicleId,
    amount,
  });

  if (insertError) {
    return {
      ok: false,
      error: insertError.message,
    };
  }

  const { error: updateError } = await supabase
    .from("vehicles")
    .update({ current_bid: amount })
    .eq("id", vehicleId);

  if (updateError) {
    return {
      ok: false,
      error: updateError.message,
    };
  }

  return { ok: true };
}
