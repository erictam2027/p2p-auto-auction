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
) {
  return {
    year: parseInteger(vehicle.year),
    make: vehicle.make,
    model: vehicle.model,
    vin: vehicle.vin.trim() || null,
    mileage: parseInteger(vehicle.mileage) || null,
    current_bid: parseInteger(vehicle.currentBid),
    image_url: vehicle.imageUrl.trim() || null,
    image_urls: vehicle.imageUrl.trim() ? [vehicle.imageUrl.trim()] : [],
    seller_id: sellerId,
    end_time: null,
    status: "draft",
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

  const rows = vehicles.map((vehicle) => mapVehicleToInsert(vehicle, user.id));
  const { error } = await supabase.from("vehicles").insert(rows);

  if (error) {
    return {
      ok: false,
      error: error.message,
    };
  }

  revalidatePath("/dashboard");
  revalidatePath("/dashboard/inventory");
  revalidatePath("/dashboard/auctions");
  revalidatePath("/");

  return {
    ok: true,
    count: rows.length,
  };
}
