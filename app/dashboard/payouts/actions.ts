"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export type EscrowSellerActionResult =
  | { ok: true }
  | { ok: false; message: string };

export async function markEscrowCompleted(
  vehicleId: string,
): Promise<EscrowSellerActionResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { ok: false, message: "You must be signed in." };
  }

  const { data: escrow, error } = await supabase
    .from("escrow_transactions")
    .select("id, seller_id, status")
    .eq("vehicle_id", vehicleId)
    .maybeSingle();

  if (error || !escrow) {
    return { ok: false, message: "Escrow record not found." };
  }

  if (escrow.seller_id !== user.id) {
    return { ok: false, message: "Only the seller can mark escrow complete." };
  }

  if (escrow.status !== "payment_received" && escrow.status !== "checkout_started") {
    return {
      ok: false,
      message: "Escrow must be in progress before it can be marked complete.",
    };
  }

  const { error: updateError } = await supabase
    .from("escrow_transactions")
    .update({
      status: "completed",
      completed_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq("id", escrow.id);

  if (updateError) {
    return { ok: false, message: updateError.message };
  }

  revalidatePath("/dashboard/payouts");
  revalidatePath(`/auctions/${vehicleId}`);
  return { ok: true };
}

export async function markEscrowPaymentReceived(
  vehicleId: string,
): Promise<EscrowSellerActionResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { ok: false, message: "You must be signed in." };
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .maybeSingle();

  const { data: escrow } = await supabase
    .from("escrow_transactions")
    .select("id, seller_id, buyer_id, status")
    .eq("vehicle_id", vehicleId)
    .maybeSingle();

  if (!escrow) {
    return { ok: false, message: "Escrow record not found." };
  }

  const isParticipant =
    escrow.seller_id === user.id ||
    escrow.buyer_id === user.id ||
    profile?.role === "admin";

  if (!isParticipant) {
    return { ok: false, message: "Not authorized." };
  }

  const { error } = await supabase
    .from("escrow_transactions")
    .update({
      status: "payment_received",
      updated_at: new Date().toISOString(),
    })
    .eq("id", escrow.id);

  if (error) {
    return { ok: false, message: error.message };
  }

  revalidatePath("/dashboard/payouts");
  revalidatePath(`/auctions/${vehicleId}`);
  return { ok: true };
}
