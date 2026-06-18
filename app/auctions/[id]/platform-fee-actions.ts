"use server";

import { verifyCompletedPaymentSession } from "@/lib/stripe/verify-session";
import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export type ConfirmPlatformFeeResult =
  | { ok: true }
  | { ok: false; message: string };

export async function confirmPlatformFeePayment(
  vehicleId: string,
  sessionId?: string,
): Promise<ConfirmPlatformFeeResult> {
  const trimmedVehicleId = vehicleId.trim();
  const trimmedSessionId = sessionId?.trim();

  if (!trimmedVehicleId) {
    return { ok: false, message: "Vehicle ID is required." };
  }

  if (!trimmedSessionId) {
    return { ok: false, message: "Missing Stripe checkout session." };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { ok: false, message: "You must be signed in." };
  }

  const { data: escrow, error } = await supabase
    .from("escrow_transactions")
    .select("id, buyer_id, platform_fee_status")
    .eq("vehicle_id", trimmedVehicleId)
    .maybeSingle();

  if (error || !escrow) {
    return { ok: false, message: "Escrow record not found." };
  }

  if (escrow.buyer_id !== user.id) {
    return { ok: false, message: "You are not authorized to update this payment." };
  }

  if (escrow.platform_fee_status === "paid") {
    return { ok: true };
  }

  const verification = await verifyCompletedPaymentSession(
    trimmedSessionId,
    user.id,
    escrow.id,
  );

  if (!verification.ok) {
    return verification;
  }

  const { error: updateError } = await supabase
    .from("escrow_transactions")
    .update({
      platform_fee_status: "paid",
      updated_at: new Date().toISOString(),
    })
    .eq("id", escrow.id);

  if (updateError) {
    return { ok: false, message: updateError.message };
  }

  revalidatePath(`/auctions/${trimmedVehicleId}`);
  revalidatePath("/profile");
  revalidatePath("/dashboard/payouts");

  return { ok: true };
}
