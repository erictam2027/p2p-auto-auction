"use server";

import { createClient } from "@/lib/supabase/server";
import type { ParsedInventoryVehicle } from "@/lib/utils/parse-inventory-csv";

type SyncInventoryResult =
  | {
      ok: true;
      count: number;
    }
  | {
      ok: false;
      error: string;
    };

function parseInteger(value: string, fallback = 0) {
  const normalized = value.replace(/[$,\s]/g, "");
  const parsed = Number.parseInt(normalized, 10);

  return Number.isFinite(parsed) ? parsed : fallback;
}

function mapVehicleToInsert(vehicle: ParsedInventoryVehicle) {
  return {
    year: parseInteger(vehicle.year),
    make: vehicle.make,
    model: vehicle.model,
    current_bid: parseInteger(vehicle.currentBid),
    time_left: vehicle.timeLeft || "Coming soon",
    image_url: vehicle.imageUrl || null,
  };
}

export async function syncInventoryToMarketplace(
  vehicles: ParsedInventoryVehicle[],
): Promise<SyncInventoryResult> {
  if (vehicles.length === 0) {
    return {
      ok: false,
      error: "No vehicles are staged for upload.",
    };
  }

  const supabase = await createClient();
  const rows = vehicles.map(mapVehicleToInsert);
  const { error } = await supabase.from("vehicles").insert(rows);

  if (error) {
    return {
      ok: false,
      error: error.message,
    };
  }

  return {
    ok: true,
    count: rows.length,
  };
}
