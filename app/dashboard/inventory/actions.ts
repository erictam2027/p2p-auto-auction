"use server";

import { canAccessDashboard } from "@/lib/auth/profile";
import { createClient } from "@/lib/supabase/server";
import type { ParsedInventoryVehicle } from "@/lib/utils/parse-inventory-csv";
import { revalidatePath } from "next/cache";

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

function mapVehicleToInsert(
  vehicle: ParsedInventoryVehicle,
  sellerId: string,
  endTime: string,
) {
  return {
    year: parseInteger(vehicle.year),
    make: vehicle.make,
    model: vehicle.model,
    vin: vehicle.vin.trim() || null,
    mileage: parseInteger(vehicle.mileage) || null,
    current_bid: parseInteger(vehicle.currentBid),
    image_url: vehicle.imageUrl.trim() || null,
    seller_id: sellerId,
    end_time: endTime,
    status: "live",
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
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { ok: false, error: "You must be signed in to sync inventory." };
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("role, verification_status")
    .eq("id", user.id)
    .maybeSingle();

  if (!canAccessDashboard(profile)) {
    return { ok: false, error: "You are not authorized to upload inventory." };
  }

  const endTime = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();
  const rows = vehicles.map((vehicle) => mapVehicleToInsert(vehicle, user.id, endTime));
  const { error } = await supabase.from("vehicles").insert(rows);

  if (error) {
    return {
      ok: false,
      error: error.message,
    };
  }

  revalidatePath("/dashboard");
  revalidatePath("/dashboard/inventory");
  revalidatePath("/");

  return {
    ok: true,
    count: rows.length,
  };
}
