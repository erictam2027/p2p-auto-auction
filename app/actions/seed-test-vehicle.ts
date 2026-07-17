"use server";

import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export type SeedTestVehicleResult =
  | { ok: true; vehicleId: string }
  | { ok: false; message: string };

/**
 * Temporary helper for local Stripe/bidding tests.
 * Inserts a live 2023 Land Rover Defender so the homepage has inventory.
 */
export async function seedTestLandRover(): Promise<SeedTestVehicleResult> {
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
    return {
      ok: false,
      message: "NEXT_PUBLIC_SUPABASE_URL is undefined in your environment.",
    };
  }

  const admin = createAdminClient();
  const supabase = admin ?? (await createClient());

  const {
    data: { user },
  } = await (await createClient()).auth.getUser();

  let sellerId = user?.id ?? null;

  if (!sellerId) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("id")
      .limit(1)
      .maybeSingle();

    sellerId = profile?.id ?? null;
  }

  if (!sellerId) {
    return {
      ok: false,
      message:
        "No seller profile found. Sign in once (or create a profile) so the test vehicle can be attributed.",
    };
  }

  const endTime = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();

  const { data, error } = await supabase
    .from("vehicles")
    .insert({
      year: 2023,
      make: "Land Rover",
      model: "Defender",
      trim: "110 X-Dynamic SE",
      vin: `TESTDEF${Date.now().toString().slice(-8)}`,
      mileage: 18400,
      location: "Los Angeles, CA",
      transmission: "Automatic",
      current_bid: 65000,
      status: "live",
      end_time: endTime,
      seller_id: sellerId,
      image_url:
        "https://images.unsplash.com/photo-1606664515524-ed2f786a0bd6?auto=format&fit=crop&w=1200&q=80",
      highlights: ["Test vehicle for Stripe bidding flow", "Seven-day live auction"],
      known_flaws: ["Seeded for local development only"],
      title_status: "Clean",
    })
    .select("id")
    .single();

  if (error) {
    return {
      ok: false,
      message: error.message || error.details || "Failed to insert test vehicle.",
    };
  }

  revalidatePath("/");
  revalidatePath("/browse");

  return { ok: true, vehicleId: data.id };
}
