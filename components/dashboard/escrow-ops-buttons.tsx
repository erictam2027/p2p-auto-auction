"use client";

import { markEscrowCompleted, markEscrowPaymentReceived } from "@/app/dashboard/payouts/actions";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";

type EscrowOpsButtonsProps = {
  vehicleId: string;
  status: string;
};

export function EscrowOpsButtons({ vehicleId, status }: EscrowOpsButtonsProps) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  async function handlePaymentReceived() {
    setBusy(true);
    const result = await markEscrowPaymentReceived(vehicleId);
    setBusy(false);

    if (!result.ok) {
      toast.error(result.message);
      return;
    }

    toast.success("Marked payment received");
    router.refresh();
  }

  async function handleComplete() {
    setBusy(true);
    const result = await markEscrowCompleted(vehicleId);
    setBusy(false);

    if (!result.ok) {
      toast.error(result.message);
      return;
    }

    toast.success("Escrow marked complete");
    router.refresh();
  }

  if (status === "completed") {
    return null;
  }

  return (
    <div className="flex flex-wrap gap-2">
      {status === "checkout_started" ? (
        <Button
          type="button"
          size="sm"
          variant="outline"
          disabled={busy}
          onClick={() => void handlePaymentReceived()}
          className="border-slate-300"
        >
          Mark payment received
        </Button>
      ) : null}
      {status === "payment_received" || status === "checkout_started" ? (
        <Button
          type="button"
          size="sm"
          disabled={busy}
          onClick={() => void handleComplete()}
          className="bg-slate-900 text-white hover:bg-slate-800"
        >
          Mark escrow complete
        </Button>
      ) : null}
    </div>
  );
}
