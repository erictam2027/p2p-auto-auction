"use client";

import { placeQuickBid } from "@/app/auctions/[id]/actions";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/client";
import { formatCurrency } from "@/lib/utils/format";
import { CreditCard, Loader2 } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { toast } from "sonner";

type LiveBidTrackerProps = {
  vehicleId: string;
  initialCurrentBidCents: number;
  initialBidsCount: number;
  location?: string;
  isLive?: boolean;
};

type BidAccessState = "loading" | "signed_out" | "needs_card" | "ready";

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
  isLive = true,
}: LiveBidTrackerProps) {
  const [currentBidCents, setCurrentBidCents] = useState(initialCurrentBidCents);
  const [bidsCount, setBidsCount] = useState(initialBidsCount);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [bidAccessState, setBidAccessState] = useState<BidAccessState>("loading");

  useEffect(() => {
    let cancelled = false;

    async function loadProfileState() {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (cancelled) {
        return;
      }

      if (!user) {
        setBidAccessState("signed_out");
        return;
      }

      const { data: profile } = await supabase
        .from("profiles")
        .select("has_card_on_file")
        .eq("id", user.id)
        .maybeSingle();

      if (!cancelled) {
        setBidAccessState(profile?.has_card_on_file ? "ready" : "needs_card");
      }
    }

    void loadProfileState();

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    function handleCardUpdate() {
      void (async () => {
        const supabase = createClient();
        const {
          data: { user },
        } = await supabase.auth.getUser();

        if (!user) {
          setBidAccessState("signed_out");
          return;
        }

        const { data: profile } = await supabase
          .from("profiles")
          .select("has_card_on_file")
          .eq("id", user.id)
          .maybeSingle();

        setBidAccessState(profile?.has_card_on_file ? "ready" : "needs_card");
      })();
    }

    window.addEventListener("apex:card-on-file-updated", handleCardUpdate);
    return () => window.removeEventListener("apex:card-on-file-updated", handleCardUpdate);
  }, []);

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

  async function handleAddCreditCard() {
    setIsSubmitting(true);

    try {
      const response = await fetch("/api/stripe/create-setup-session", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ vehicleId }),
      });

      const data = (await response.json()) as { url?: string; error?: string };

      if (!response.ok || !data.url) {
        toast.error(data.error ?? "Unable to start card setup.");
        setIsSubmitting(false);
        return;
      }

      window.location.href = data.url;
    } catch {
      toast.error("Unable to start card setup.");
      setIsSubmitting(false);
    }
  }

  async function handlePlaceBid() {
    if (!isLive) {
      toast.error("This auction has ended.");
      return;
    }

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

  const loginHref = `/login?next=${encodeURIComponent(`/auctions/${vehicleId}`)}`;

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

      <div className="rounded-md border border-slate-200 bg-slate-50 px-4 py-3">
        <p className="text-xs leading-relaxed text-slate-600">
          A hold of 5% will be placed on your card if you win. No charges are made
          just to bid.
        </p>
      </div>

      {bidAccessState === "loading" ? (
        <Button
          type="button"
          disabled
          className="h-11 w-full bg-slate-900 text-base text-white hover:bg-slate-800"
        >
          <Loader2 className="size-4 animate-spin" />
          Checking payment profile…
        </Button>
      ) : !isLive ? (
        <Button
          type="button"
          disabled
          className="h-11 w-full bg-slate-300 text-base text-slate-600"
        >
          Auction Ended
        </Button>
      ) : bidAccessState === "signed_out" ? (
        <Button
          type="button"
          nativeButton={false}
          render={<Link href={loginHref} />}
          className="h-11 w-full bg-slate-900 text-base text-white hover:bg-slate-800"
        >
          Sign in to bid
        </Button>
      ) : bidAccessState === "needs_card" ? (
        <Button
          type="button"
          onClick={() => void handleAddCreditCard()}
          disabled={isSubmitting}
          className="h-11 w-full bg-slate-900 text-base text-white hover:bg-slate-800"
        >
          {isSubmitting ? (
            <>
              <Loader2 className="size-4 animate-spin" />
              Redirecting to Stripe…
            </>
          ) : (
            <>
              <CreditCard className="size-4" />
              Add Credit Card to Bid
            </>
          )}
        </Button>
      ) : (
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
      )}
    </div>
  );
}
