import {
  DEFAULT_HOME_AUCTION_FILTERS,
  HOME_PRICE_MAX,
  HOME_PRICE_MIN,
  type HomeAuctionFilters,
} from "@/lib/data/home-auction-filters";
import type { TrendingAuction } from "@/lib/data/trending-auctions";
import { createClient } from "@/lib/supabase/server";

type VehicleRow = Record<string, unknown>;

export const VEHICLE_AUCTION_SELECT =
  "id, year, make, model, trim, mileage, location, city_state, current_bid, bid_count, end_time, image_url, nmvtis_verified, inspection_available, transmission, vin";

function readString(row: VehicleRow, keys: string[], fallback = "") {
  for (const key of keys) {
    const value = row[key];
    if (typeof value === "string" && value.trim().length > 0) {
      return value;
    }
  }
  return fallback;
}

function readNumber(row: VehicleRow, keys: string[], fallback = 0) {
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
  return fallback;
}

function readBoolean(row: VehicleRow, keys: string[], fallback = false) {
  for (const key of keys) {
    const value = row[key];
    if (typeof value === "boolean") {
      return value;
    }
  }
  return fallback;
}

function readEndTime(row: VehicleRow): string {
  const value = row.end_time;

  if (typeof value !== "string" || value.trim().length === 0) {
    return "";
  }

  const parsed = Date.parse(value);

  if (!Number.isFinite(parsed)) {
    return "";
  }

  return new Date(parsed).toISOString();
}

export function vehicleToAuction(vehicle: VehicleRow): TrendingAuction {
  const id = readString(vehicle, ["id", "slug"]);
  const storedCurrentBidCents = readNumber(
    vehicle,
    ["current_bid_cents", "currentBidCents", "starting_bid_cents", "price_cents"],
    Number.NaN,
  );
  const currentBidCents = Number.isFinite(storedCurrentBidCents)
    ? storedCurrentBidCents
    : readNumber(vehicle, ["current_bid"], 0) * 100;
  const endTime = readEndTime(vehicle);

  return {
    id,
    year: readNumber(vehicle, ["year"], new Date().getFullYear()),
    make: readString(vehicle, ["make"], "Vehicle"),
    model: readString(vehicle, ["model"], "Listing"),
    trim: readString(vehicle, ["trim", "variant"], "Verified auction"),
    mileage: readNumber(vehicle, ["mileage", "odometer"], 0),
    location: readString(vehicle, ["location", "city_state", "city"], "Location pending"),
    currentBidCents,
    bidCount: readNumber(vehicle, ["bid_count", "bidCount"], 0),
    endsIn: endTime ? "" : "Ended",
    endTime,
    imageUrl: readString(vehicle, ["image_url", "imageUrl"], ""),
    nmvtisVerified: readBoolean(vehicle, ["nmvtis_verified", "nmvtisVerified"], true),
    inspectionAvailable: readBoolean(
      vehicle,
      ["inspection_available", "inspectionAvailable"],
      false,
    ),
  };
}

function logSupabaseEnvWarnings(context: string) {
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
    console.warn(
      `[${context}] NEXT_PUBLIC_SUPABASE_URL is undefined — Supabase requests will fail.`,
    );
  }

  if (!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    console.warn(
      `[${context}] NEXT_PUBLIC_SUPABASE_ANON_KEY is undefined — Supabase requests will fail.`,
    );
  }
}

function logSupabaseError(context: string, error: unknown) {
  logSupabaseEnvWarnings(context);

  if (error && typeof error === "object") {
    const err = error as {
      message?: string;
      details?: string;
      hint?: string;
      code?: string;
    };

    console.error(`[${context}]`, {
      message: err.message ?? "(no message)",
      details: err.details ?? "(no details)",
      hint: err.hint ?? "(no hint)",
      code: err.code ?? "(no code)",
      supabaseUrlConfigured: Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL),
      supabaseUrlHost: process.env.NEXT_PUBLIC_SUPABASE_URL
        ? (() => {
            try {
              return new URL(process.env.NEXT_PUBLIC_SUPABASE_URL).host;
            } catch {
              return "(invalid URL)";
            }
          })()
        : "(undefined)",
    });
    return;
  }

  console.error(`[${context}]`, String(error));
}

export async function fetchHomeAuctions(
  filters: HomeAuctionFilters = DEFAULT_HOME_AUCTION_FILTERS,
  options?: { excludeId?: string; limit?: number },
): Promise<TrendingAuction[]> {
  logSupabaseEnvWarnings("fetchHomeAuctions");

  const supabase = await createClient();
  let query = supabase
    .from("vehicles")
    .select(VEHICLE_AUCTION_SELECT)
    .eq("status", "live")
    .order("end_time", { ascending: true, nullsFirst: false });

  const search = filters.search.trim();

  if (search) {
    const pattern = `%${search.replace(/[%_]/g, "")}%`;
    query = query.or(`make.ilike.${pattern},model.ilike.${pattern},vin.ilike.${pattern}`);
  }

  if (filters.transmission === "Manual" || filters.transmission === "Automatic") {
    query = query.ilike("transmission", `%${filters.transmission}%`);
  }

  if (filters.minPrice > HOME_PRICE_MIN) {
    query = query.gte("current_bid", filters.minPrice);
  }

  if (filters.maxPrice < HOME_PRICE_MAX) {
    query = query.lte("current_bid", filters.maxPrice);
  }

  const { data, error } = await query.limit(options?.limit ?? 24);

  if (error) {
    logSupabaseError("Home auction fetch error", error);
    return [];
  }

  return (data ?? [])
    .map(vehicleToAuction)
    .filter((auction) => auction.id.length > 0 && auction.id !== options?.excludeId)
    .slice(0, options?.limit ?? 24);
}

export async function getFeaturedAuction() {
  logSupabaseEnvWarnings("getFeaturedAuction");

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("vehicles")
    .select(VEHICLE_AUCTION_SELECT)
    .eq("status", "live")
    .order("current_bid", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) {
    logSupabaseError("Featured auction fetch error", error);
    return null;
  }

  if (!data) {
    return null;
  }

  const auction = vehicleToAuction(data);

  return auction.id.length > 0 ? auction : null;
}
