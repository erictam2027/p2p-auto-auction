"use client";

import { LiveBidTracker } from "@/components/auction/LiveBidTracker";
import { CountdownTimer } from "@/components/auctions/CountdownTimer";
import { ListingTrustStrip } from "@/components/auctions/listing-trust-strip";
import type { ListingDetail } from "@/lib/data/listing-details";
import { useEffect, useState } from "react";

type BiddingPanelProps = {
  listing: ListingDetail;
};

const SNIPE_THRESHOLD_MS = 2 * 60 * 1000;

export function BiddingPanel({ listing }: BiddingPanelProps) {
  const [remainingMs, setRemainingMs] = useState(() => {
    if (!listing.endTime) {
      return 0;
    }

    return new Date(listing.endTime).getTime() - Date.now();
  });

  useEffect(() => {
    if (!listing.endTime) {
      return;
    }

    const endTimestamp = new Date(listing.endTime).getTime();

    if (!Number.isFinite(endTimestamp)) {
      return;
    }

    function updateRemaining() {
      setRemainingMs(endTimestamp - Date.now());
    }

    updateRemaining();
    const interval = setInterval(updateRemaining, 1000);

    return () => clearInterval(interval);
  }, [listing.endTime]);

  const inSnipeWindow = remainingMs > 0 && remainingMs <= SNIPE_THRESHOLD_MS;

  return (
    <div className="rounded-md border border-slate-200 bg-white p-5 shadow-sm">
      <LiveBidTracker
        key={`${listing.id}-${listing.currentBidCents}-${listing.bidCount}`}
        vehicleId={listing.id}
        initialCurrentBidCents={listing.currentBidCents}
        initialBidsCount={listing.bidCount}
        location={listing.location}
      />

      <div className="mt-5 rounded-md border border-slate-200 bg-slate-50 px-4 py-3 text-center">
        <p className="text-xs font-medium uppercase tracking-wide text-slate-600">
          Time remaining
        </p>
        {listing.endTime ? (
          <CountdownTimer
            endTime={listing.endTime}
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
