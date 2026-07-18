import {
  getEscrowStatusLabel,
  getPlatformFeeStatusLabel,
} from "@/lib/escrow/status-labels";
import type { EscrowStatus, PlatformFeeStatus } from "@/lib/escrow/types";
import { cn } from "@/lib/utils";
import { Check, Circle, X } from "lucide-react";

type EscrowProgressProps = {
  escrowStatus: EscrowStatus;
  platformFeeStatus: PlatformFeeStatus;
  compact?: boolean;
};

type ProgressStep = {
  label: string;
  description: string;
  complete: boolean;
  current: boolean;
  failed?: boolean;
};

function buildSteps(
  escrowStatus: EscrowStatus,
  platformFeeStatus: PlatformFeeStatus,
): ProgressStep[] {
  const checkoutStarted =
    escrowStatus === "checkout_started" ||
    escrowStatus === "payment_received" ||
    escrowStatus === "completed";
  const paymentReceived =
    escrowStatus === "payment_received" || escrowStatus === "completed";
  const platformFeeComplete =
    platformFeeStatus === "paid" || platformFeeStatus === "waived";
  const escrowComplete = escrowStatus === "completed";
  const cancelled = escrowStatus === "cancelled";

  return [
    {
      label: "Auction won",
      description: "Winning bidder confirmed",
      complete: !cancelled,
      current: escrowStatus === "pending" && !cancelled,
      failed: cancelled,
    },
    {
      label: "Escrow checkout",
      description: getEscrowStatusLabel(escrowStatus),
      complete: checkoutStarted || paymentReceived || escrowComplete,
      current: escrowStatus === "checkout_started",
      failed: cancelled,
    },
    {
      label: "Vehicle funds",
      description: paymentReceived ? "Funds received by escrow" : "Awaiting escrow payment",
      complete: paymentReceived || escrowComplete,
      current: escrowStatus === "payment_received",
      failed: cancelled,
    },
    {
      label: "Platform fee",
      description: getPlatformFeeStatusLabel(platformFeeStatus),
      complete: platformFeeComplete,
      current: checkoutStarted && !platformFeeComplete && !cancelled,
      failed: cancelled,
    },
    {
      label: "Title & payout",
      description: escrowComplete ? "Transaction complete" : "Final title and payout review",
      complete: escrowComplete,
      current: paymentReceived && platformFeeComplete && !escrowComplete,
      failed: cancelled,
    },
  ];
}

export function EscrowProgress({
  escrowStatus,
  platformFeeStatus,
  compact = false,
}: EscrowProgressProps) {
  const steps = buildSteps(escrowStatus, platformFeeStatus);

  return (
    <ol className={cn("space-y-3", compact && "space-y-2")}>
      {steps.map((step) => {
        const Icon = step.failed ? X : step.complete ? Check : Circle;

        return (
          <li key={step.label} className="flex gap-3">
            <span
              className={cn(
                "mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-full border",
                step.failed
                  ? "border-red-200 bg-red-50 text-red-700"
                  : step.complete
                    ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                    : step.current
                      ? "border-slate-900 bg-slate-900 text-white"
                      : "border-slate-200 bg-white text-slate-400",
              )}
            >
              <Icon className={step.complete || step.failed ? "size-3.5" : "size-2"} />
            </span>
            <span className="min-w-0">
              <span className="block text-sm font-medium text-slate-900">
                {step.label}
              </span>
              <span className="mt-0.5 block text-xs leading-5 text-slate-600">
                {step.description}
              </span>
            </span>
          </li>
        );
      })}
    </ol>
  );
}
