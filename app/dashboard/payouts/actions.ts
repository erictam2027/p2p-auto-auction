"use server";

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { revalidatePath } from "next/cache";

export type EscrowSellerActionResult =
  | { ok: true }
  | { ok: false; message: string };

async function assertAdmin() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { supabase, user: null, isAdmin: false };
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .maybeSingle();

  return { supabase, user, isAdmin: profile?.role === "admin" };
}

export async function markEscrowCompleted(
  vehicleId: string,
): Promise<EscrowSellerActionResult> {
  const { isAdmin } = await assertAdmin();

  if (!isAdmin) {
    return { ok: false, message: "Only marketplace operations can complete escrow." };
  }

  const supabase = createAdminClient();
  if (!supabase) {
    return { ok: false, message: "Marketplace operations are not configured." };
  }

  const { data: escrow, error } = await supabase
    .from("escrow_transactions")
    .select("id, seller_id, status")
    .eq("vehicle_id", vehicleId)
    .maybeSingle();

  if (error || !escrow) {
    return { ok: false, message: "Escrow record not found." };
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
  const { isAdmin } = await assertAdmin();

  if (!isAdmin) {
    return { ok: false, message: "Only marketplace operations can confirm escrow funds." };
  }

  const supabase = createAdminClient();
  if (!supabase) {
    return { ok: false, message: "Marketplace operations are not configured." };
  }

  const { data: escrow } = await supabase
    .from("escrow_transactions")
    .select("id, seller_id, buyer_id, status")
    .eq("vehicle_id", vehicleId)
    .maybeSingle();

  if (!escrow) {
    return { ok: false, message: "Escrow record not found." };
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
