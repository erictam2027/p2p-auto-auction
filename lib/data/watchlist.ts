import type { SupabaseClient } from "@supabase/supabase-js";

export type WatchlistItem = {
  id: string;
  vehicleId: string;
  year: number | null;
  make: string | null;
  model: string | null;
  trim: string | null;
  currentBid: number | null;
  status: string | null;
  endTime: string | null;
  imageUrl: string | null;
  createdAt: string;
};

type VehicleEmbed = {
  id: string;
  year: number | null;
  make: string | null;
  model: string | null;
  trim: string | null;
  current_bid: number | null;
  status: string | null;
  end_time: string | null;
  image_url: string | null;
};

type WatchlistRow = {
  id: string;
  created_at: string;
  vehicle: VehicleEmbed | VehicleEmbed[] | null;
};

export async function fetchWatchlistItems(
  supabase: SupabaseClient,
  userId: string,
): Promise<WatchlistItem[]> {
  const { data, error } = await supabase
    .from("watchlist")
    .select(
      `
      id,
      created_at,
      vehicle:vehicles (
        id,
        year,
        make,
        model,
        trim,
        current_bid,
        status,
        end_time,
        image_url
      )
    `,
    )
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  if (error || !data) {
    return [];
  }

  return (data as WatchlistRow[])
    .map((row) => {
      const vehicle = Array.isArray(row.vehicle) ? row.vehicle[0] : row.vehicle;
      if (!vehicle) {
        return null;
      }

      return {
        id: row.id,
        vehicleId: vehicle.id,
        year: vehicle.year,
        make: vehicle.make,
        model: vehicle.model,
        trim: vehicle.trim,
        currentBid: vehicle.current_bid,
        status: vehicle.status,
        endTime: vehicle.end_time,
        imageUrl: vehicle.image_url,
        createdAt: row.created_at,
      } satisfies WatchlistItem;
    })
    .filter((item): item is WatchlistItem => item !== null);
}
