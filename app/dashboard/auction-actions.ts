"use server";

import { canAccessDashboard } from "@/lib/auth/profile";
import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

type PublishListingResult =
  | { ok: true; message: string }
  | { ok: false; message: string };

const AUCTION_DURATION_MS = 7 * 24 * 60 * 60 * 1000;

export async function publishListing(vehicleId: string): Promise<PublishListingResult> {
  const id = vehicleId.trim();

  if (!id) {
    return { ok: false, message: "Choose a valid vehicle to publish." };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { ok: false, message: "Sign in to publish inventory." };
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("role, verification_status")
    .eq("id", user.id)
    .maybeSingle();

  if (!canAccessDashboard(profile)) {
    return { ok: false, message: "You are not authorized to publish inventory." };
  }

  const endTime = new Date(Date.now() + AUCTION_DURATION_MS).toISOString();
  const { data: vehicle, error } = await supabase
    .from("vehicles")
    .update({ status: "live", end_time: endTime })
    .eq("id", id)
    .eq("seller_id", user.id)
    .eq("status", "draft")
    .select("year, make, model")
    .maybeSingle();

  if (error) {
    return { ok: false, message: error.message };
  }

  if (!vehicle) {
    return {
      ok: false,
      message: "This listing is no longer a draft or is not part of your inventory.",
    };
  }

  revalidatePath("/");
  revalidatePath("/browse");
  revalidatePath("/dashboard");
  revalidatePath("/dashboard/auctions");
  revalidatePath(`/auctions/${id}`);

  return {
    ok: true,
    message: `${vehicle.year} ${vehicle.make} ${vehicle.model} is live for seven days.`,
  };
}
