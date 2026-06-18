"use server";

import { createKeySavvyTransaction } from "@/lib/keysavvy/create-transaction";
import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

const PLATFORM_FEE_RATE = 0.05;

export type StartKeySavvyCheckoutResult =
  | { ok: true; url: string }
  | { ok: false; message: string };

export type ConfirmKeySavvyReturnResult =
  | { ok: true }
  | { ok: false; message: string };

function computePlatformFeeCents(salePriceDollars: number): number {
  return Math.round(salePriceDollars * 100 * PLATFORM_FEE_RATE);
}

export async function startKeySavvyCheckout(
  vehicleId: string,
): Promise<StartKeySavvyCheckoutResult> {
  const trimmedVehicleId = vehicleId.trim();

  if (!trimmedVehicleId) {
    return { ok: false, message: "Vehicle ID is required." };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user?.email) {
    return { ok: false, message: "You must be signed in to complete checkout." };
  }

  const { data: vehicle, error: vehicleError } = await supabase
    .from("vehicles")
    .select("id, vin, current_bid, status, winner_id, seller_id")
    .eq("id", trimmedVehicleId)
    .single();

  if (vehicleError || !vehicle) {
    return { ok: false, message: "Listing not found." };
  }

  if (vehicle.status !== "ended") {
    return { ok: false, message: "Checkout is only available after the auction ends." };
  }

  if (vehicle.winner_id !== user.id) {
    return { ok: false, message: "Only the winning bidder can start escrow checkout." };
  }

  if (!vehicle.seller_id) {
    return { ok: false, message: "This listing is missing seller information." };
  }

  const salePriceDollars = vehicle.current_bid ?? 0;

  if (salePriceDollars <= 0) {
    return { ok: false, message: "A valid winning bid is required before checkout." };
  }

  const { data: sellerProfile } = await supabase
    .from("profiles")
    .select("email")
    .eq("id", vehicle.seller_id)
    .maybeSingle();

  const origin = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
  const returnUrl = `${origin}/auctions/${trimmedVehicleId}?keysavvy=return`;
  const webhookUrl = `${origin}/api/keysavvy/webhook`;

  const keySavvy = await createKeySavvyTransaction({
    vehicleId: trimmedVehicleId,
    vin: vehicle.vin ?? "",
    salePriceDollars,
    buyerEmail: user.email,
    sellerEmail: sellerProfile?.email ?? "",
    returnUrl,
    webhookUrl,
  });

  const platformFeeCents = computePlatformFeeCents(salePriceDollars);

  const { data: existingEscrow } = await supabase
    .from("escrow_transactions")
    .select("id")
    .eq("vehicle_id", trimmedVehicleId)
    .maybeSingle();

  const escrowPayload = {
    vehicle_id: trimmedVehicleId,
    buyer_id: user.id,
    seller_id: vehicle.seller_id,
    sale_price: salePriceDollars,
    status: "checkout_started" as const,
    platform_fee_cents: platformFeeCents,
    keysavvy_transaction_id: keySavvy.transactionId,
    keysavvy_checkout_url: keySavvy.checkoutUrl,
    updated_at: new Date().toISOString(),
  };

  if (existingEscrow) {
    const { error: updateError } = await supabase
      .from("escrow_transactions")
      .update(escrowPayload)
      .eq("id", existingEscrow.id);

    if (updateError) {
      return { ok: false, message: updateError.message };
    }
  } else {
    const { error: insertError } = await supabase.from("escrow_transactions").insert({
      ...escrowPayload,
      platform_fee_status: "pending",
    });

    if (insertError) {
      return { ok: false, message: insertError.message };
    }
  }

  revalidatePath(`/auctions/${trimmedVehicleId}`);
  revalidatePath("/profile");
  revalidatePath("/dashboard/payouts");

  return { ok: true, url: keySavvy.checkoutUrl };
}

export async function confirmKeySavvyReturn(
  vehicleId: string,
): Promise<ConfirmKeySavvyReturnResult> {
  const trimmedVehicleId = vehicleId.trim();

  if (!trimmedVehicleId) {
    return { ok: false, message: "Vehicle ID is required." };
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
    .select("id, buyer_id, status")
    .eq("vehicle_id", trimmedVehicleId)
    .maybeSingle();

  if (error || !escrow) {
    return { ok: false, message: "Escrow record not found." };
  }

  if (escrow.buyer_id !== user.id) {
    return { ok: false, message: "You are not authorized to update this checkout." };
  }

  if (escrow.status === "pending") {
    const { error: updateError } = await supabase
      .from("escrow_transactions")
      .update({
        status: "checkout_started",
        updated_at: new Date().toISOString(),
      })
      .eq("id", escrow.id);

    if (updateError) {
      return { ok: false, message: updateError.message };
    }
  }

  revalidatePath(`/auctions/${trimmedVehicleId}`);
  revalidatePath("/profile");

  return { ok: true };
}
