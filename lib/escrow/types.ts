export const ESCROW_STATUSES = [
  "pending",
  "checkout_started",
  "payment_received",
  "completed",
  "cancelled",
] as const;

export type EscrowStatus = (typeof ESCROW_STATUSES)[number];

export const PLATFORM_FEE_STATUSES = ["pending", "paid", "waived"] as const;

export type PlatformFeeStatus = (typeof PLATFORM_FEE_STATUSES)[number];

export type EscrowTransactionRow = {
  id: string;
  vehicle_id: string;
  buyer_id: string;
  seller_id: string;
  sale_price: number;
  status: EscrowStatus;
  platform_fee_status: PlatformFeeStatus;
  platform_fee_cents: number;
  keysavvy_transaction_id: string | null;
  keysavvy_checkout_url: string | null;
  stripe_checkout_session_id: string | null;
  created_at: string;
  updated_at: string;
  completed_at: string | null;
};

export type EscrowTransactionSummary = {
  id: string;
  status: EscrowStatus;
  platformFeeStatus: PlatformFeeStatus;
  platformFeeCents: number;
  salePriceCents: number;
  keysavvyCheckoutUrl: string | null;
  keysavvyTransactionId: string | null;
};

export function toEscrowSummary(row: EscrowTransactionRow): EscrowTransactionSummary {
  return {
    id: row.id,
    status: row.status,
    platformFeeStatus: row.platform_fee_status,
    platformFeeCents: row.platform_fee_cents,
    salePriceCents: row.sale_price * 100,
    keysavvyCheckoutUrl: row.keysavvy_checkout_url,
    keysavvyTransactionId: row.keysavvy_transaction_id,
  };
}
