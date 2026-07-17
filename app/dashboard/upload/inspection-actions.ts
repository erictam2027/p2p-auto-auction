"use server";

import { canAccessDashboard } from "@/lib/auth/profile";
import { bookLemonSquadInspection } from "@/lib/trust/lemon-squad";
import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export type ScheduleInspectionResult =
  | { ok: true; orderId: string }
  | { ok: false; message: string };

export async function scheduleListingInspection(input: {
  vehicleId: string;
  address: string;
  preferredDate?: string;
}): Promise<ScheduleInspectionResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { ok: false, message: "You must be signed in." };
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("role, verification_status")
    .eq("id", user.id)
    .maybeSingle();

  if (!canAccessDashboard(profile)) {
    return { ok: false, message: "Only verified dealers can schedule inspections." };
  }

  const { data: vehicle } = await supabase
    .from("vehicles")
    .select("id, vin, seller_id")
    .eq("id", input.vehicleId)
    .maybeSingle();

  if (!vehicle || vehicle.seller_id !== user.id) {
    return { ok: false, message: "Listing not found." };
  }

  if (!vehicle.vin) {
    return { ok: false, message: "VIN is required before scheduling an inspection." };
  }

  const booking = await bookLemonSquadInspection({
    vin: vehicle.vin,
    vehicleId: vehicle.id,
    address: input.address,
    preferredDate: input.preferredDate,
  });

  if (!booking.ok) {
    return booking;
  }

  const { error } = await supabase
    .from("vehicles")
    .update({
      inspection_available: true,
      inspection_status: booking.status,
      lemon_squad_order_id: booking.orderId,
    })
    .eq("id", vehicle.id);

  if (error) {
    return { ok: false, message: error.message };
  }

  revalidatePath(`/auctions/${vehicle.id}`);
  revalidatePath("/dashboard");
  return { ok: true, orderId: booking.orderId };
}
