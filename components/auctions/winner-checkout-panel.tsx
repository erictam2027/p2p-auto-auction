"use client";

import { startKeySavvyCheckout } from "@/app/auctions/[id]/checkout-actions";
import { TrustBadge } from "@/components/trust/trust-badge";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  getEscrowStatusLabel,
  getPlatformFeeStatusLabel,
  isEscrowCheckoutComplete,
} from "@/lib/escrow/status-labels";
import type { EscrowTransactionSummary } from "@/lib/escrow/types";
import { formatCurrency } from "@/lib/utils/format";
import { ExternalLink, Loader2, ShieldCheck } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

type WinnerCheckoutPanelProps = {
  vehicleId: string;
  salePriceCents: number;
  escrow: EscrowTransactionSummary | null;
};

export function WinnerCheckoutPanel({
  vehicleId,
  salePriceCents,
  escrow,
}: WinnerCheckoutPanelProps) {
  const [isStartingCheckout, setIsStartingCheckout] = useState(false);
  const [isPayingPlatformFee, setIsPayingPlatformFee] = useState(false);

  const escrowStatus = escrow?.status ?? "pending";
  const platformFeeStatus = escrow?.platformFeeStatus ?? "pending";
  const platformFeeCents =
    escrow?.platformFeeCents ?? Math.round(salePriceCents * 0.05);
  const checkoutComplete = isEscrowCheckoutComplete(escrowStatus);

  async function handleStartCheckout() {
    setIsStartingCheckout(true);

    const result = await startKeySavvyCheckout(vehicleId);

    setIsStartingCheckout(false);

    if (!result.ok) {
      toast.error(result.message);
      return;
    }

    window.location.assign(result.url);
  }

  async function handlePayPlatformFee() {
    setIsPayingPlatformFee(true);

    try {
      const response = await fetch("/api/stripe/create-platform-fee-session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ vehicleId }),
      });

      const payload = (await response.json()) as { url?: string; error?: string };

      if (!response.ok || !payload.url) {
        toast.error(payload.error ?? "Unable to start platform fee checkout.");
        return;
      }

      window.location.assign(payload.url);
    } catch {
      toast.error("Unable to start platform fee checkout.");
    } finally {
      setIsPayingPlatformFee(false);
    }
  }

  return (
    <div className="mt-5 space-y-4 rounded-md border border-emerald-200 bg-emerald-50/60 p-4">
      <div className="flex items-start gap-3">
        <ShieldCheck className="mt-0.5 size-5 shrink-0 text-emerald-700" />
        <div className="min-w-0">
          <p className="text-sm font-semibold text-slate-900">You won this auction</p>
          <p className="mt-1 text-sm text-slate-700">
            Complete KeySavvy escrow checkout to secure title transfer and vehicle pickup.
          </p>
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        <Badge variant="outline" className="border-emerald-200 bg-white text-emerald-800">
          {getEscrowStatusLabel(escrowStatus)}
        </Badge>
        <Badge variant="outline" className="border-slate-200 bg-white text-slate-700">
          {getPlatformFeeStatusLabel(platformFeeStatus)}
        </Badge>
      </div>

      <div className="rounded-md border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700">
        <div className="flex items-center justify-between gap-3">
          <span>Winning bid</span>
          <span className="font-semibold text-slate-900">
            {formatCurrency(salePriceCents)}
          </span>
        </div>
        <div className="mt-2 flex items-center justify-between gap-3">
          <span>Platform fee (5%)</span>
          <span className="font-semibold text-slate-900">
            {formatCurrency(platformFeeCents)}
          </span>
        </div>
      </div>

      {!checkoutComplete ? (
        <Button
          type="button"
          disabled={isStartingCheckout}
          onClick={() => void handleStartCheckout()}
          className="w-full bg-slate-900 text-white hover:bg-slate-800"
        >
          {isStartingCheckout ? (
            <>
              <Loader2 className="animate-spin" />
              Starting KeySavvy checkout…
            </>
          ) : (
            <>
              <ExternalLink className="size-4" />
              Complete purchase via KeySavvy
            </>
          )}
        </Button>
      ) : null}

      {checkoutComplete && platformFeeStatus === "pending" ? (
        <Button
          type="button"
          variant="outline"
          disabled={isPayingPlatformFee}
          onClick={() => void handlePayPlatformFee()}
          className="w-full border-slate-300 bg-white text-slate-900 hover:bg-slate-50"
        >
          {isPayingPlatformFee ? (
            <>
              <Loader2 className="animate-spin" />
              Opening Stripe checkout…
            </>
          ) : (
            `Pay ${formatCurrency(platformFeeCents)} platform fee`
          )}
        </Button>
      ) : null}

      {checkoutComplete && platformFeeStatus === "paid" ? (
        <p className="text-sm text-emerald-800">
          Escrow checkout and platform fee are complete. KeySavvy will coordinate title
          transfer and vehicle pickup.
        </p>
      ) : null}

      <TrustBadge variant="escrow" compact />
    </div>
  );
}
