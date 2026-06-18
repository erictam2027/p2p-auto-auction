"use client";

import { LiveBidTracker } from "@/components/auction/LiveBidTracker";
import { ListingTrustStrip } from "@/components/auctions/listing-trust-strip";
import type { ListingDetail } from "@/lib/data/listing-details";
import { useEffect, useState } from "react";

type BiddingPanelProps = {
  listing: ListingDetail;
};

const SNIPE_THRESHOLD_SECONDS = 2 * 60;

function formatCountdown(totalSeconds: number): string {
  if (totalSeconds >= 3600) {
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    return `${hours}h ${minutes}m`;
  }

  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${String(seconds).padStart(2, "0")}`;
}

export function BiddingPanel({ listing }: BiddingPanelProps) {
  const [secondsLeft, setSecondsLeft] = useState(listing.endsInSeconds);

  useEffect(() => {
    const interval = setInterval(() => {
      setSecondsLeft((current) => Math.max(0, current - 1));
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const inSnipeWindow = secondsLeft > 0 && secondsLeft <= SNIPE_THRESHOLD_SECONDS;

  return (
    <aside className="lg:sticky lg:top-20 lg:self-start">
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
          <p
            className={`mt-1 text-2xl font-semibold tabular-nums ${
              inSnipeWindow ? "text-orange-600" : "text-slate-900"
            }`}
          >
            {secondsLeft > 0 ? formatCountdown(secondsLeft) : "Ended"}
          </p>
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
    </aside>
  );
}
