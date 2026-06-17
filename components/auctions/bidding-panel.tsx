"use client";

import { ListingTrustStrip } from "@/components/auctions/listing-trust-strip";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { ListingDetail } from "@/lib/data/listing-details";
import { formatCurrency } from "@/lib/utils/format";
import { useEffect, useState } from "react";

type BiddingPanelProps = {
  listing: ListingDetail;
};

function formatEndingLabel(totalSeconds: number): string {
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  return `Ending in: ${String(hours).padStart(2, "0")}h ${String(minutes).padStart(2, "0")}m`;
}

export function BiddingPanel({ listing }: BiddingPanelProps) {
  const [secondsLeft, setSecondsLeft] = useState(listing.endsInSeconds);
  const minBid = listing.currentBidCents + 10000;
  const [bidAmount, setBidAmount] = useState(String(Math.ceil(minBid / 100)));

  useEffect(() => {
    const interval = setInterval(() => {
      setSecondsLeft((current) => Math.max(0, current - 1));
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <aside className="lg:sticky lg:top-20 lg:self-start">
      <div className="rounded-md border border-slate-200 bg-white p-5 shadow-sm">
        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-slate-600">
            Current bid
          </p>
          <p className="mt-1 text-3xl font-semibold text-slate-900">
            {formatCurrency(listing.currentBidCents)}
          </p>
          <p className="mt-1 text-sm text-slate-600">
            {listing.bidCount} bids · {listing.location}
          </p>
        </div>

        <p className="mt-5 text-center text-lg font-semibold tabular-nums text-orange-600">
          {formatEndingLabel(secondsLeft)}
        </p>

        <div className="mt-5 space-y-3">
          <label htmlFor="bid-amount" className="text-sm font-medium text-slate-900">
            Place bid
          </label>
          <div className="relative">
            <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm text-slate-600">
              $
            </span>
            <Input
              id="bid-amount"
              type="number"
              min={Math.ceil(minBid / 100)}
              step={100}
              value={bidAmount}
              onChange={(e) => setBidAmount(e.target.value)}
              className="h-11 w-full border-slate-300 bg-white pl-7 text-slate-900"
            />
          </div>
          <p className="text-xs text-slate-600">
            Minimum bid: {formatCurrency(minBid)}
          </p>

          <Button className="h-11 w-full bg-slate-900 text-base text-white hover:bg-slate-800">
            Place Bid
          </Button>

          <ListingTrustStrip />
        </div>
      </div>
    </aside>
  );
}
