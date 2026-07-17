"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export type WatchlistResult =
  | { ok: true; watching: boolean }
  | { ok: false; message: string };

export async function toggleWatchlist(vehicleId: string): Promise<WatchlistResult> {
  const trimmed = vehicleId.trim();

  if (!trimmed) {
    return { ok: false, message: "Vehicle ID is required." };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { ok: false, message: "Sign in to watch auctions." };
  }

  const { data: existing } = await supabase
    .from("watchlist")
    .select("id")
    .eq("user_id", user.id)
    .eq("vehicle_id", trimmed)
    .maybeSingle();

  if (existing) {
    const { error } = await supabase.from("watchlist").delete().eq("id", existing.id);

    if (error) {
      return { ok: false, message: error.message };
    }

    revalidatePath(`/auctions/${trimmed}`);
    revalidatePath("/profile");
    return { ok: true, watching: false };
  }

  const { error } = await supabase.from("watchlist").insert({
    user_id: user.id,
    vehicle_id: trimmed,
  });

  if (error) {
    return { ok: false, message: error.message };
  }

  revalidatePath(`/auctions/${trimmed}`);
  revalidatePath("/profile");
  return { ok: true, watching: true };
}

export async function isWatchingVehicle(vehicleId: string): Promise<boolean> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return false;
  }

  const { data } = await supabase
    .from("watchlist")
    .select("id")
    .eq("user_id", user.id)
    .eq("vehicle_id", vehicleId)
    .maybeSingle();

  return Boolean(data);
}
