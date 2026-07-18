import type { EscrowStatus, PlatformFeeStatus } from "@/lib/escrow/types";

export const TITLE_STATUSES = [
  "not_requested",
  "requested",
  "submitted",
  "verified",
  "released",
] as const;

export const HANDOFF_STATUSES = [
  "not_ready",
  "ready",
  "seller_confirmed",
  "buyer_confirmed",
] as const;

export const TRANSPORT_STATUSES = [
  "not_requested",
  "requested",
  "scheduled",
  "in_transit",
  "delivered",
] as const;

export const DISPUTE_STATUSES = ["none", "open", "resolved"] as const;

export type TitleStatus = (typeof TITLE_STATUSES)[number];
export type HandoffStatus = (typeof HANDOFF_STATUSES)[number];
export type TransportStatus = (typeof TRANSPORT_STATUSES)[number];
export type DisputeStatus = (typeof DISPUTE_STATUSES)[number];
export type DeliveryMethod = "pickup" | "transport" | null;

export type TransactionDocument = {
  id: string;
  documentType: "title" | "bill_of_sale" | "bill_of_lading" | "inspection" | "other";
  fileName: string;
  contentType: string;
  createdAt: string;
  uploadedBy: string;
};

export type TransactionEvent = {
  id: string;
  eventType: string;
  detail: string | null;
  createdAt: string;
  actorId: string | null;
};

export type TransactionWorkspace = {
  id: string;
  vehicleId: string;
  title: string;
  vin: string;
  salePriceCents: number;
  escrowStatus: EscrowStatus;
  platformFeeStatus: PlatformFeeStatus;
  titleStatus: TitleStatus;
  handoffStatus: HandoffStatus;
  transportStatus: TransportStatus;
  disputeStatus: DisputeStatus;
  deliveryMethod: DeliveryMethod;
  deliveryAddress: string | null;
  sellerVehicleReadyAt: string | null;
  sellerHandoffConfirmedAt: string | null;
  buyerDeliveryConfirmedAt: string | null;
  disputeReason: string | null;
  providerTransactionId: string | null;
  viewerRole: "buyer" | "seller" | "admin";
  documents: TransactionDocument[];
  events: TransactionEvent[];
};
