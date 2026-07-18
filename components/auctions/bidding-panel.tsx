"use client";

import { LiveBidTracker } from "@/components/auction/LiveBidTracker";
import { CountdownTimer } from "@/components/auctions/CountdownTimer";
import { ListingTrustStrip } from "@/components/auctions/listing-trust-strip";
import { WinnerCheckoutPanel } from "@/components/auctions/winner-checkout-panel";
import type { EscrowTransactionSummary } from "@/lib/escrow/types";
import type { ListingDetail } from "@/lib/data/listing-details";
import { createClient } from "@/lib/supabase/client";
import { formatCurrency } from "@/lib/utils/format";
import { useEffect, useState } from "react";

type BiddingPanelProps = {
  listing: ListingDetail;
  viewerUserId?: string | null;
  escrow?: EscrowTransactionSummary | null;
};

const SNIPE_THRESHOLD_MS = 2 * 60 * 1000;

function normalizeEndTime(value: unknown) {
  if (typeof value !== "string" || value.trim().length === 0) {
    return "";
  }

  const parsed = Date.parse(value);

  if (!Number.isFinite(parsed)) {
    return "";
  }

  return new Date(parsed).toISOString();
}

export function BiddingPanel({ listing, viewerUserId, escrow }: BiddingPanelProps) {
  const [liveEndTime, setLiveEndTime] = useState(listing.endTime);
  const [liveStatus, setLiveStatus] = useState(listing.status);
  const [remainingMs, setRemainingMs] = useState(() => {
    if (!listing.endTime) {
      return 0;
    }

    return new Date(listing.endTime).getTime() - Date.now();
  });

  const auctionIsLive = listing.isLive && liveStatus.toLowerCase() === "live";

  useEffect(() => {
    if (!auctionIsLive || !liveEndTime) {
      return;
    }

    const endTimestamp = new Date(liveEndTime).getTime();

    if (!Number.isFinite(endTimestamp)) {
      return;
    }

    function updateRemaining() {
      setRemainingMs(endTimestamp - Date.now());
    }

    updateRemaining();
    const interval = setInterval(updateRemaining, 1000);

    return () => clearInterval(interval);
  }, [auctionIsLive, liveEndTime]);

  useEffect(() => {
    if (!listing.isLive) {
      return;
    }

    const supabase = createClient();
    const channel = supabase
      .channel(`vehicle-timing-${listing.id}`)
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "vehicles",
          filter: `id=eq.${listing.id}`,
        },
        (payload) => {
          const row = payload.new as Record<string, unknown>;
          const nextEndTime = normalizeEndTime(row.end_time);
          const nextStatus = row.status;

          if (nextEndTime) {
            setLiveEndTime(nextEndTime);
          }

          if (typeof nextStatus === "string" && nextStatus.trim().length > 0) {
            setLiveStatus(nextStatus);
          }
        },
      )
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [listing.id, listing.isLive]);

  const inSnipeWindow =
    auctionIsLive && remainingMs > 0 && remainingMs <= SNIPE_THRESHOLD_MS;

  const isWinner =
    Boolean(viewerUserId) &&
    Boolean(listing.winnerId) &&
    viewerUserId === listing.winnerId;

  if (!auctionIsLive) {
    return (
      <div className="rounded-md border border-slate-200 bg-white p-5 shadow-sm">
        <div className="rounded-md border border-slate-200 bg-slate-50 px-4 py-6 text-center">
          <p className="text-xs font-medium uppercase tracking-wide text-slate-600">
            Auction ended
          </p>
          <p className="mt-2 text-2xl font-semibold text-slate-900">
            {formatCurrency(listing.currentBidCents)}
          </p>
          <p className="mt-1 text-sm text-slate-600">Final bid</p>
          {listing.winnerLabel ? (
            <p className="mt-4 text-sm text-slate-700">
              Winning bidder:{" "}
              <span className="font-medium text-slate-900">{listing.winnerLabel}</span>
            </p>
          ) : (
            <p className="mt-4 text-sm text-slate-600">No winning bids were recorded.</p>
          )}
          <p className="mt-3 text-xs text-slate-500">
            Escrow and title transfer will be coordinated through KeySavvy.
          </p>
          {isWinner ? (
            <WinnerCheckoutPanel
              vehicleId={listing.id}
              salePriceCents={listing.currentBidCents}
              escrow={escrow ?? null}
            />
          ) : null}
        </div>
        <div className="mt-5">
          <ListingTrustStrip />
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-md border border-slate-200 bg-white p-5 shadow-sm">
      <LiveBidTracker
        key={`${listing.id}-${listing.currentBidCents}-${listing.bidCount}`}
        vehicleId={listing.id}
        initialCurrentBidCents={listing.currentBidCents}
        initialBidsCount={listing.bidCount}
        location={listing.location}
        isLive={auctionIsLive}
        reservePriceCents={listing.reservePriceCents ?? null}
      />

      <div className="mt-5 rounded-md border border-slate-200 bg-slate-50 px-4 py-3 text-center">
        <p className="text-xs font-medium uppercase tracking-wide text-slate-600">
          Time remaining
        </p>
        {liveEndTime ? (
          <CountdownTimer
            endTime={liveEndTime}
            className={
              inSnipeWindow
                ? "mt-1 block text-2xl font-semibold text-orange-600"
                : "mt-1 block text-2xl font-semibold text-slate-900"
            }
          />
        ) : (
          <p className="mt-1 text-2xl font-semibold tabular-nums text-slate-900">Ended</p>
        )}
        {inSnipeWindow ? (
          <p className="mt-1 text-xs text-slate-600">
            Snipe protection active — new bids extend to 2:00
          </p>
        ) : null}
      </div>

      <div className="mt-5">
        <ListingTrustStrip />
      </div>
    </div>
  );
}
