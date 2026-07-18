"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

type ActionResult = { ok: true } | { ok: false; message: string };

type ParticipantTransaction = {
  id: string;
  vehicle_id: string;
  buyer_id: string;
  seller_id: string;
  status: string;
  title_status: string;
  handoff_status: string;
  dispute_status: string;
};

async function getParticipantTransaction(transactionId: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { supabase, user: null, transaction: null as ParticipantTransaction | null };
  }

  const { data: transaction } = await supabase
    .from("escrow_transactions")
    .select("id, vehicle_id, buyer_id, seller_id, status, title_status, handoff_status, dispute_status")
    .eq("id", transactionId.trim())
    .maybeSingle();

  return { supabase, user, transaction: transaction as ParticipantTransaction | null };
}

async function recordEvent(
  supabase: Awaited<ReturnType<typeof createClient>>,
  transactionId: string,
  actorId: string,
  eventType: string,
  detail: string,
) {
  await supabase.from("transaction_events").insert({
    transaction_id: transactionId,
    actor_id: actorId,
    event_type: eventType,
    detail,
  });
}

function refreshTransaction(transactionId: string, vehicleId: string) {
  revalidatePath(`/transactions/${transactionId}`);
  revalidatePath(`/auctions/${vehicleId}`);
  revalidatePath("/profile");
  revalidatePath("/dashboard/payouts");
}

export async function registerTransactionDocument(input: {
  transactionId: string;
  documentType: "title" | "bill_of_sale" | "bill_of_lading" | "inspection" | "other";
  storagePath: string;
  fileName: string;
  contentType: string;
}): Promise<ActionResult> {
  const { supabase, user, transaction } = await getParticipantTransaction(input.transactionId);

  if (!user || !transaction) {
    return { ok: false, message: "You are not authorized to add documents to this transaction." };
  }

  const expectedPrefix = `${user.id}/${transaction.id}/`;
  if (!input.storagePath.startsWith(expectedPrefix)) {
    return { ok: false, message: "Document storage path is invalid." };
  }

  const { error } = await supabase.from("transaction_documents").insert({
    transaction_id: transaction.id,
    uploaded_by: user.id,
    document_type: input.documentType,
    storage_path: input.storagePath,
    file_name: input.fileName.slice(0, 180),
    content_type: input.contentType,
  });

  if (error) {
    return { ok: false, message: error.message };
  }

  await recordEvent(
    supabase,
    transaction.id,
    user.id,
    "document_uploaded",
    `${input.documentType.replaceAll("_", " ")} uploaded`,
  );
  refreshTransaction(transaction.id, transaction.vehicle_id);
  return { ok: true };
}

export async function submitTitlePackage(transactionId: string): Promise<ActionResult> {
  const { supabase, user, transaction } = await getParticipantTransaction(transactionId);

  if (!user || !transaction || transaction.seller_id !== user.id) {
    return { ok: false, message: "Only the selling dealer can submit the title package." };
  }

  if (transaction.status !== "payment_received" && transaction.status !== "completed") {
    return { ok: false, message: "Title submission unlocks after escrow confirms vehicle funds." };
  }

  const { data: titleDocument } = await supabase
    .from("transaction_documents")
    .select("id")
    .eq("transaction_id", transaction.id)
    .eq("document_type", "title")
    .maybeSingle();

  if (!titleDocument) {
    return { ok: false, message: "Upload the title document before submitting the package." };
  }

  const { error } = await supabase
    .from("escrow_transactions")
    .update({ title_status: "submitted", updated_at: new Date().toISOString() })
    .eq("id", transaction.id);

  if (error) return { ok: false, message: error.message };

  await recordEvent(supabase, transaction.id, user.id, "title_package_submitted", "Seller submitted the title package for verification.");
  refreshTransaction(transaction.id, transaction.vehicle_id);
  return { ok: true };
}

export async function setDeliveryPlan(input: {
  transactionId: string;
  method: "pickup" | "transport";
  deliveryAddress: string;
}): Promise<ActionResult> {
  const { supabase, user, transaction } = await getParticipantTransaction(input.transactionId);

  if (!user || !transaction || transaction.buyer_id !== user.id) {
    return { ok: false, message: "Only the buyer can set the delivery plan." };
  }

  if (transaction.dispute_status === "open") {
    return { ok: false, message: "Delivery changes are paused while a dispute is open." };
  }

  const address = input.deliveryAddress.trim();
  if (input.method === "transport" && address.length < 8) {
    return { ok: false, message: "Enter the full delivery address for transport." };
  }

  const { error } = await supabase
    .from("escrow_transactions")
    .update({
      delivery_method: input.method,
      delivery_address: address || null,
      transport_status: input.method === "transport" ? "requested" : "not_requested",
      updated_at: new Date().toISOString(),
    })
    .eq("id", transaction.id);

  if (error) return { ok: false, message: error.message };

  await recordEvent(
    supabase,
    transaction.id,
    user.id,
    "delivery_plan_set",
    input.method === "transport" ? "Buyer requested transport." : "Buyer selected dealer pickup.",
  );
  refreshTransaction(transaction.id, transaction.vehicle_id);
  return { ok: true };
}

export async function markVehicleReady(transactionId: string): Promise<ActionResult> {
  const { supabase, user, transaction } = await getParticipantTransaction(transactionId);

  if (!user || !transaction || transaction.seller_id !== user.id) {
    return { ok: false, message: "Only the selling dealer can mark the vehicle ready." };
  }

  if (transaction.status !== "payment_received" && transaction.status !== "completed") {
    return { ok: false, message: "Vehicle release stays locked until escrow confirms funds." };
  }

  const { error } = await supabase
    .from("escrow_transactions")
    .update({
      handoff_status: "ready",
      seller_vehicle_ready_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq("id", transaction.id);

  if (error) return { ok: false, message: error.message };

  await recordEvent(supabase, transaction.id, user.id, "vehicle_ready", "Seller marked the vehicle ready for release.");
  refreshTransaction(transaction.id, transaction.vehicle_id);
  return { ok: true };
}

export async function confirmVehicleHandoff(transactionId: string): Promise<ActionResult> {
  const { supabase, user, transaction } = await getParticipantTransaction(transactionId);

  if (!user || !transaction || transaction.seller_id !== user.id) {
    return { ok: false, message: "Only the selling dealer can confirm vehicle handoff." };
  }

  if (transaction.handoff_status !== "ready") {
    return { ok: false, message: "Mark the vehicle ready before confirming handoff." };
  }

  const { error } = await supabase
    .from("escrow_transactions")
    .update({
      handoff_status: "seller_confirmed",
      seller_handoff_confirmed_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq("id", transaction.id);

  if (error) return { ok: false, message: error.message };

  await recordEvent(supabase, transaction.id, user.id, "vehicle_handoff_confirmed", "Seller confirmed the vehicle handoff.");
  refreshTransaction(transaction.id, transaction.vehicle_id);
  return { ok: true };
}

export async function confirmDelivery(transactionId: string): Promise<ActionResult> {
  const { supabase, user, transaction } = await getParticipantTransaction(transactionId);

  if (!user || !transaction || transaction.buyer_id !== user.id) {
    return { ok: false, message: "Only the buyer can confirm delivery." };
  }

  if (transaction.handoff_status !== "seller_confirmed") {
    return { ok: false, message: "The seller must confirm handoff before delivery can be confirmed." };
  }

  const { error } = await supabase
    .from("escrow_transactions")
    .update({
      handoff_status: "buyer_confirmed",
      transport_status: "delivered",
      buyer_delivery_confirmed_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq("id", transaction.id);

  if (error) return { ok: false, message: error.message };

  await recordEvent(supabase, transaction.id, user.id, "delivery_confirmed", "Buyer confirmed vehicle delivery.");
  refreshTransaction(transaction.id, transaction.vehicle_id);
  return { ok: true };
}

export async function openTransactionDispute(
  transactionId: string,
  reason: string,
): Promise<ActionResult> {
  const { supabase, user, transaction } = await getParticipantTransaction(transactionId);
  const detail = reason.trim();

  if (!user || !transaction) {
    return { ok: false, message: "You are not authorized to open a dispute." };
  }

  if (transaction.dispute_status === "open") {
    return { ok: false, message: "A dispute is already open for this transaction." };
  }

  if (detail.length < 10) {
    return { ok: false, message: "Please provide a short description of the issue." };
  }

  const { error } = await supabase
    .from("escrow_transactions")
    .update({
      dispute_status: "open",
      dispute_reason: detail.slice(0, 2000),
      dispute_opened_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq("id", transaction.id);

  if (error) return { ok: false, message: error.message };

  await recordEvent(supabase, transaction.id, user.id, "dispute_opened", detail.slice(0, 300));
  refreshTransaction(transaction.id, transaction.vehicle_id);
  return { ok: true };
}
