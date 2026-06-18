"use client";

import { placeQuickBid } from "@/app/auctions/[id]/actions";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/client";
import { formatCurrency } from "@/lib/utils/format";
import { Loader2 } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

type LiveBidTrackerProps = {
  vehicleId: string;
  initialCurrentBidCents: number;
  initialBidsCount: number;
  location?: string;
};

function readCurrentBidCents(row: Record<string, unknown>) {
  const value = row.current_bid;

  if (typeof value === "number" && Number.isFinite(value)) {
    return value * 100;
  }

  if (typeof value === "string") {
    const parsed = Number(value);
    if (Number.isFinite(parsed)) {
      return parsed * 100;
    }
  }

  return null;
}

export function LiveBidTracker({
  vehicleId,
  initialCurrentBidCents,
  initialBidsCount,
  location,
}: LiveBidTrackerProps) {
  const [currentBidCents, setCurrentBidCents] = useState(initialCurrentBidCents);
  const [bidsCount, setBidsCount] = useState(initialBidsCount);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const supabase = createClient();

    const channel = supabase
      .channel(`vehicle-${vehicleId}`)
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "vehicles",
          filter: `id=eq.${vehicleId}`,
        },
        (payload) => {
          const nextBidCents = readCurrentBidCents(
            payload.new as Record<string, unknown>,
          );

          if (nextBidCents !== null) {
            setCurrentBidCents(nextBidCents);
          }
        },
      )
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [vehicleId]);

  async function handlePlaceBid() {
    setIsSubmitting(true);

    const result = await placeQuickBid(vehicleId);

    setIsSubmitting(false);

    if (!result.ok) {
      toast.error(result.error);
      return;
    }

    setCurrentBidCents(result.newBidCents);
    setBidsCount((count) => count + 1);
    toast.success("Bid placed successfully");
  }

  return (
    <div className="space-y-5">
      <div>
        <p className="text-xs font-medium uppercase tracking-wide text-slate-600">
          Current bid
        </p>
        <p className="mt-1 text-3xl font-semibold text-slate-900">
          {formatCurrency(currentBidCents)}
        </p>
        <p className="mt-1 text-sm text-slate-600">
          {bidsCount} active bids
          {location ? ` · ${location}` : null}
        </p>
      </div>

      <Button
        type="button"
        onClick={() => void handlePlaceBid()}
        disabled={isSubmitting}
        className="h-11 w-full bg-slate-900 text-base text-white hover:bg-slate-800"
      >
        {isSubmitting ? (
          <>
            <Loader2 className="size-4 animate-spin" />
            Placing bid…
          </>
        ) : (
          "Place Bid"
        )}
      </Button>
    </div>
  );
}
