import { createAdminClient } from "@/lib/supabase/admin";
import type { EscrowStatus } from "@/lib/escrow/types";
import { NextResponse } from "next/server";

type KeySavvyWebhookEvent = {
  event?: string;
  type?: string;
  transaction_id?: string;
  external_reference_id?: string;
  vehicle_id?: string;
  status?: string;
};

function readWebhookSecret(request: Request): string | null {
  const authHeader = request.headers.get("authorization");

  if (authHeader?.startsWith("Bearer ")) {
    return authHeader.slice("Bearer ".length).trim();
  }

  return request.headers.get("x-keysavvy-signature");
}

function mapKeySavvyStatus(eventName: string, status?: string): EscrowStatus | null {
  const normalized = (status ?? eventName).toLowerCase();

  if (
    normalized.includes("completed") ||
    normalized.includes("transaction.completed")
  ) {
    return "completed";
  }

  if (
    normalized.includes("payment_received") ||
    normalized.includes("payment.received") ||
    normalized.includes("funded")
  ) {
    return "payment_received";
  }

  if (normalized.includes("cancel")) {
    return "cancelled";
  }

  if (normalized.includes("started") || normalized.includes("created")) {
    return "checkout_started";
  }

  return null;
}

export async function POST(request: Request) {
  const webhookSecret = process.env.KEYSAVVY_WEBHOOK_SECRET?.trim();

  if (webhookSecret) {
    const providedSecret = readWebhookSecret(request);

    if (providedSecret !== webhookSecret) {
      return NextResponse.json({ error: "Invalid webhook signature." }, { status: 401 });
    }
  }

  const supabase = createAdminClient();

  if (!supabase) {
    return NextResponse.json(
      { error: "Supabase admin client is not configured." },
      { status: 500 },
    );
  }

  let payload: KeySavvyWebhookEvent;

  try {
    payload = (await request.json()) as KeySavvyWebhookEvent;
  } catch {
    return NextResponse.json({ error: "Invalid JSON payload." }, { status: 400 });
  }

  const vehicleId = payload.external_reference_id ?? payload.vehicle_id;
  const eventName = payload.event ?? payload.type ?? payload.status ?? "";
  const nextStatus = mapKeySavvyStatus(eventName, payload.status);

  if (!vehicleId || !nextStatus) {
    return NextResponse.json({ received: true, skipped: true });
  }

  const updatePayload: Record<string, string | null> = {
    status: nextStatus,
    updated_at: new Date().toISOString(),
  };

  if (payload.transaction_id) {
    updatePayload.keysavvy_transaction_id = payload.transaction_id;
  }

  if (nextStatus === "completed") {
    updatePayload.completed_at = new Date().toISOString();
  }

  const { error } = await supabase
    .from("escrow_transactions")
    .update(updatePayload)
    .eq("vehicle_id", vehicleId);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ received: true });
}
