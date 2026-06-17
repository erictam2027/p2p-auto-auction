"use client";

import { ListingTrustStrip } from "@/components/auctions/listing-trust-strip";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { ListingDetail } from "@/lib/data/listing-details";
import { formatCurrency, formatMileage } from "@/lib/utils/format";
import { Clock, MapPin } from "lucide-react";
import { useEffect, useState } from "react";

type BiddingPanelProps = {
  listing: ListingDetail;
};

function formatCountdown(totalSeconds: number): string {
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  return `${hours}:${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
}

export function BiddingPanel({ listing }: BiddingPanelProps) {
  const [secondsLeft, setSecondsLeft] = useState(listing.endsInSeconds);
  const minBid = listing.currentBidCents + 10000;
  const [bidAmount, setBidAmount] = useState(
    String(Math.ceil(minBid / 100)),
  );

  useEffect(() => {
    const interval = setInterval(() => {
      setSecondsLeft((current) => Math.max(0, current - 1));
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const title = `${listing.year} ${listing.make} ${listing.model}`;

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
            {listing.bidCount} bids · Reserve not met
          </p>
        </div>

        <div className="mt-6 rounded-md border border-slate-200 bg-slate-50 px-4 py-5 text-center">
          <div className="flex items-center justify-center gap-2 text-xs font-medium uppercase tracking-wide text-slate-600">
            <Clock className="size-3.5" />
            Time remaining
          </div>
          <p className="mt-2 font-mono text-4xl font-semibold tabular-nums text-orange-600">
            {formatCountdown(secondsLeft)}
          </p>
        </div>

        <div className="mt-6 space-y-4">
          <div className="space-y-2">
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
                className="h-12 border-slate-300 bg-white pl-7 text-lg text-slate-900"
              />
            </div>
            <p className="text-xs text-slate-600">
              Minimum bid: {formatCurrency(minBid)}
            </p>
          </div>

          <Button className="h-12 w-full bg-slate-900 text-base text-white hover:bg-slate-800">
            Place Bid
          </Button>

          <ListingTrustStrip />
        </div>

        <dl className="mt-6 space-y-3 border-t border-slate-200 pt-5 text-sm">
          <div className="flex justify-between gap-4">
            <dt className="text-slate-600">Vehicle</dt>
            <dd className="text-right font-medium text-slate-900">{title}</dd>
          </div>
          <div className="flex justify-between gap-4">
            <dt className="text-slate-600">Trim</dt>
            <dd className="text-right text-slate-900">{listing.trim}</dd>
          </div>
          <div className="flex justify-between gap-4">
            <dt className="text-slate-600">Mileage</dt>
            <dd className="text-right text-slate-900">
              {formatMileage(listing.mileage)} mi
            </dd>
          </div>
          <div className="flex justify-between gap-4">
            <dt className="text-slate-600">Location</dt>
            <dd className="flex items-center justify-end gap-1 text-right text-slate-900">
              <MapPin className="size-3.5 shrink-0 text-slate-500" />
              {listing.location}
            </dd>
          </div>
          <div className="flex justify-between gap-4">
            <dt className="text-slate-600">VIN</dt>
            <dd className="font-mono text-xs text-slate-900">{listing.vin}</dd>
          </div>
        </dl>
      </div>
    </aside>
  );
}
