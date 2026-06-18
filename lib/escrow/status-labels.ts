import type { EscrowStatus, PlatformFeeStatus } from "@/lib/escrow/types";

export function getEscrowStatusLabel(status: EscrowStatus): string {
  switch (status) {
    case "pending":
      return "Awaiting checkout";
    case "checkout_started":
      return "KeySavvy checkout started";
    case "payment_received":
      return "Payment received";
    case "completed":
      return "Escrow complete";
    case "cancelled":
      return "Cancelled";
    default:
      return status;
  }
}

export function getPlatformFeeStatusLabel(status: PlatformFeeStatus): string {
  switch (status) {
    case "pending":
      return "Platform fee due";
    case "paid":
      return "Platform fee paid";
    case "waived":
      return "Platform fee waived";
    default:
      return status;
  }
}

export function isEscrowCheckoutComplete(status: EscrowStatus): boolean {
  return status === "payment_received" || status === "completed";
}
