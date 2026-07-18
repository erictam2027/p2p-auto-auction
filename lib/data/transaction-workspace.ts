import type { EscrowStatus, PlatformFeeStatus } from "@/lib/escrow/types";
import type {
  TransactionDocument,
  TransactionEvent,
  TransactionWorkspace,
} from "@/lib/transactions/types";
import { createClient } from "@/lib/supabase/server";

function readVehicle(value: unknown) {
  const row = Array.isArray(value) ? value[0] : value;

  if (!row || typeof row !== "object") {
    return null;
  }

  const vehicle = row as Record<string, unknown>;

  if (typeof vehicle.id !== "string") {
    return null;
  }

  return {
    id: vehicle.id,
    year: typeof vehicle.year === "number" ? vehicle.year : null,
    make: typeof vehicle.make === "string" ? vehicle.make : null,
    model: typeof vehicle.model === "string" ? vehicle.model : null,
    vin: typeof vehicle.vin === "string" ? vehicle.vin : null,
  };
}

export async function fetchTransactionWorkspace(
  transactionId: string,
): Promise<TransactionWorkspace | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return null;
  }

  const { data: transaction, error } = await supabase
    .from("escrow_transactions")
    .select(
      "id, vehicle_id, buyer_id, seller_id, sale_price, status, platform_fee_status, title_status, handoff_status, transport_status, dispute_status, delivery_method, delivery_address, seller_vehicle_ready_at, seller_handoff_confirmed_at, buyer_delivery_confirmed_at, dispute_reason, keysavvy_transaction_id, vehicles(id, year, make, model, vin)",
    )
    .eq("id", transactionId)
    .maybeSingle();

  if (error || !transaction) {
    return null;
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .maybeSingle();

  const viewerRole =
    profile?.role === "admin"
      ? "admin"
      : transaction.buyer_id === user.id
        ? "buyer"
        : transaction.seller_id === user.id
          ? "seller"
          : null;

  if (!viewerRole) {
    return null;
  }

  const [{ data: documents }, { data: events }] = await Promise.all([
    supabase
      .from("transaction_documents")
      .select("id, document_type, file_name, content_type, created_at, uploaded_by")
      .eq("transaction_id", transaction.id)
      .order("created_at", { ascending: false }),
    supabase
      .from("transaction_events")
      .select("id, event_type, detail, created_at, actor_id")
      .eq("transaction_id", transaction.id)
      .order("created_at", { ascending: false }),
  ]);

  const vehicle = readVehicle(transaction.vehicles);

  return {
    id: transaction.id,
    vehicleId: transaction.vehicle_id,
    title: `${vehicle?.year ?? ""} ${vehicle?.make ?? "Vehicle"} ${vehicle?.model ?? "Listing"}`.trim(),
    vin: vehicle?.vin ?? "—",
    salePriceCents: (transaction.sale_price ?? 0) * 100,
    escrowStatus: transaction.status as EscrowStatus,
    platformFeeStatus: transaction.platform_fee_status as PlatformFeeStatus,
    titleStatus: transaction.title_status as TransactionWorkspace["titleStatus"],
    handoffStatus: transaction.handoff_status as TransactionWorkspace["handoffStatus"],
    transportStatus: transaction.transport_status as TransactionWorkspace["transportStatus"],
    disputeStatus: transaction.dispute_status as TransactionWorkspace["disputeStatus"],
    deliveryMethod: transaction.delivery_method as TransactionWorkspace["deliveryMethod"],
    deliveryAddress: transaction.delivery_address,
    sellerVehicleReadyAt: transaction.seller_vehicle_ready_at,
    sellerHandoffConfirmedAt: transaction.seller_handoff_confirmed_at,
    buyerDeliveryConfirmedAt: transaction.buyer_delivery_confirmed_at,
    disputeReason: transaction.dispute_reason,
    providerTransactionId: transaction.keysavvy_transaction_id,
    viewerRole,
    documents: (documents ?? []).map(
      (document): TransactionDocument => ({
        id: document.id,
        documentType: document.document_type as TransactionDocument["documentType"],
        fileName: document.file_name,
        contentType: document.content_type,
        createdAt: document.created_at,
        uploadedBy: document.uploaded_by,
      }),
    ),
    events: (events ?? []).map(
      (event): TransactionEvent => ({
        id: event.id,
        eventType: event.event_type,
        detail: event.detail,
        createdAt: event.created_at,
        actorId: event.actor_id,
      }),
    ),
  };
}
