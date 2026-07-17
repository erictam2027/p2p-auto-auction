"use client";

import { placeBid, placeQuickBid } from "@/app/auctions/[id]/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
  reservePriceCents?: number | null;
};

type BidAccessState =
  | "loading"
  | "signed_out"
  | "needs_card"
  | "needs_identity"
  | "ready";

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
  reservePriceCents = null,
}: LiveBidTrackerProps) {
  const [currentBidCents, setCurrentBidCents] = useState(initialCurrentBidCents);
  const [bidsCount, setBidsCount] = useState(initialBidsCount);
  const [customBid, setCustomBid] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [bidAccessState, setBidAccessState] = useState<BidAccessState>("loading");

  const minNextBidDollars = Math.floor(currentBidCents / 100) + 100;
  const reserveMet =
    reservePriceCents == null || currentBidCents >= reservePriceCents;

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
        .select("has_card_on_file, identity_status")
        .eq("id", user.id)
        .maybeSingle();

      if (cancelled) {
        return;
      }

      if (!profile?.has_card_on_file) {
        setBidAccessState("needs_card");
        return;
      }

      if (
        process.env.NEXT_PUBLIC_REQUIRE_PERSONA_FOR_BIDDING === "true" &&
        profile.identity_status !== "verified"
      ) {
        setBidAccessState("needs_identity");
        return;
      }

      setBidAccessState("ready");
    }

    void loadProfileState();

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    function handleCardUpdate() {
      setBidAccessState("ready");
    }

    window.addEventListener("apex:card-on-file-updated", handleCardUpdate);
    return () => window.removeEventListener("apex:card-on-file-updated", handleCardUpdate);
  }, []);

  useEffect(() => {
    const supabase = createClient();

    const channel = supabase
      .channel(`vehicle-bids-${vehicleId}`)
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
          const nextCount = (payload.new as Record<string, unknown>).bid_count;

          if (nextBidCents !== null) {
            setCurrentBidCents(nextBidCents);
          }

          if (typeof nextCount === "number" && Number.isFinite(nextCount)) {
            setBidsCount(nextCount);
          }
        },
      )
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "bids",
          filter: `vehicle_id=eq.${vehicleId}`,
        },
        (payload) => {
          const amount = (payload.new as Record<string, unknown>).amount;
          if (typeof amount === "number" && Number.isFinite(amount)) {
            setCurrentBidCents((current) => Math.max(current, amount * 100));
          }
          setBidsCount((count) => count + 1);
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
        headers: { "Content-Type": "application/json" },
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

  async function handleQuickBid() {
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

  async function handleCustomBid() {
    if (!isLive) {
      toast.error("This auction has ended.");
      return;
    }

    setIsSubmitting(true);
    const result = await placeBid(vehicleId, customBid);
    setIsSubmitting(false);

    if (!result.ok) {
      toast.error(result.error);
      return;
    }

    setCurrentBidCents(result.newBidCents);
    setBidsCount((count) => count + 1);
    setCustomBid("");
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
        {reservePriceCents != null ? (
          <p
            className={`mt-2 text-xs font-medium ${
              reserveMet ? "text-emerald-700" : "text-amber-700"
            }`}
          >
            {reserveMet
              ? "Reserve met"
              : `Reserve not met (${formatCurrency(reservePriceCents)})`}
          </p>
        ) : null}
      </div>

      <div className="rounded-md border border-slate-200 bg-slate-50 px-4 py-3">
        <p className="text-xs leading-relaxed text-slate-600">
          A hold of 5% will be placed on your card if you win. No charges are made
          just to bid. Minimum next bid: {formatCurrency(minNextBidDollars * 100)}.
        </p>
      </div>

      {bidAccessState === "loading" ? (
        <Button type="button" disabled className="h-11 w-full bg-slate-900 text-white">
          <Loader2 className="size-4 animate-spin" />
          Checking payment profile…
        </Button>
      ) : !isLive ? (
        <Button type="button" disabled className="h-11 w-full bg-slate-300 text-slate-600">
          Auction Ended
        </Button>
      ) : bidAccessState === "signed_out" ? (
        <Button
          type="button"
          nativeButton={false}
          render={<Link href={loginHref} />}
          className="h-11 w-full bg-slate-900 text-white hover:bg-slate-800"
        >
          Sign in to bid
        </Button>
      ) : bidAccessState === "needs_identity" ? (
        <Button
          type="button"
          nativeButton={false}
          render={<Link href="/profile?tab=settings" />}
          className="h-11 w-full bg-slate-900 text-white hover:bg-slate-800"
        >
          Verify identity to bid
        </Button>
      ) : bidAccessState === "needs_card" ? (
        <Button
          type="button"
          onClick={() => void handleAddCreditCard()}
          disabled={isSubmitting}
          className="h-11 w-full bg-slate-900 text-white hover:bg-slate-800"
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
        <div className="space-y-3">
          <div className="flex gap-2">
            <Input
              type="text"
              inputMode="numeric"
              value={customBid}
              onChange={(event) => setCustomBid(event.target.value)}
              placeholder={String(minNextBidDollars)}
              className="h-11 border-slate-300 bg-white"
              aria-label="Custom bid amount"
            />
            <Button
              type="button"
              onClick={() => void handleCustomBid()}
              disabled={isSubmitting || customBid.trim().length === 0}
              className="h-11 shrink-0 bg-slate-900 text-white hover:bg-slate-800"
            >
              Bid
            </Button>
          </div>
          <Button
            type="button"
            variant="outline"
            onClick={() => void handleQuickBid()}
            disabled={isSubmitting}
            className="h-11 w-full border-slate-300 bg-white text-slate-900 hover:bg-slate-50"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="size-4 animate-spin" />
                Placing bid…
              </>
            ) : (
              `Quick bid ${formatCurrency(minNextBidDollars * 100)}`
            )}
          </Button>
        </div>
      )}
    </div>
  );
}
