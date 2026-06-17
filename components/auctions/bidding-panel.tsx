"use client";

import { ListingTrustStrip } from "@/components/auctions/listing-trust-strip";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import type { ListingDetail } from "@/lib/data/listing-details";
import { formatCurrency } from "@/lib/utils/format";
import { ShieldCheck } from "lucide-react";
import { useEffect, useMemo, useState } from "react";

type BiddingPanelProps = {
  listing: ListingDetail;
};

const BUYERS_FEE_RATE = 0.045;

function formatEndingLabel(totalSeconds: number): string {
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  return `Ending in: ${String(hours).padStart(2, "0")}h ${String(minutes).padStart(2, "0")}m`;
}

export function BiddingPanel({ listing }: BiddingPanelProps) {
  const [secondsLeft, setSecondsLeft] = useState(listing.endsInSeconds);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [bidError, setBidError] = useState<string | null>(null);
  const minBid = listing.currentBidCents + 10000;
  const [bidAmount, setBidAmount] = useState(String(Math.ceil(minBid / 100)));

  const title = `${listing.year} ${listing.make} ${listing.model}`;

  const bidSummary = useMemo(() => {
    const bidCents = Math.round(Number(bidAmount) * 100);
    const buyersFeeCents = Math.round(bidCents * BUYERS_FEE_RATE);
    return {
      bidCents,
      buyersFeeCents,
      totalCents: bidCents + buyersFeeCents,
    };
  }, [bidAmount]);

  useEffect(() => {
    const interval = setInterval(() => {
      setSecondsLeft((current) => Math.max(0, current - 1));
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  function handlePlaceBidClick() {
    const dollars = Number(bidAmount);

    if (!bidAmount.trim() || Number.isNaN(dollars) || dollars <= 0) {
      setBidError("Enter a valid bid amount.");
      return;
    }

    if (dollars * 100 < minBid) {
      setBidError(`Minimum bid is ${formatCurrency(minBid)}.`);
      return;
    }

    setBidError(null);
    setConfirmOpen(true);
  }

  function handleConfirmBid() {
    setConfirmOpen(false);
  }

  return (
    <>
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
                onChange={(e) => {
                  setBidAmount(e.target.value);
                  if (bidError) setBidError(null);
                }}
                className="h-11 w-full border-slate-300 bg-white pl-7 text-slate-900"
              />
            </div>
            <p className="text-xs text-slate-600">
              Minimum bid: {formatCurrency(minBid)}
            </p>
            {bidError ? (
              <p className="text-xs font-medium text-red-600">{bidError}</p>
            ) : null}

            <Button
              type="button"
              onClick={handlePlaceBidClick}
              className="h-11 w-full bg-slate-900 text-base text-white hover:bg-slate-800"
            >
              Place Bid
            </Button>

            <ListingTrustStrip />
          </div>
        </div>
      </aside>

      <Dialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <DialogContent className="gap-0 overflow-hidden border-slate-200 bg-white p-0 sm:max-w-md">
          <DialogHeader className="border-b border-slate-200 px-5 py-4">
            <DialogTitle className="text-lg font-semibold text-slate-900">
              Confirm Your Bid
            </DialogTitle>
            <DialogDescription className="text-sm text-slate-600">
              {title} · {listing.trim}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 px-5 py-5">
            <dl className="space-y-3 text-sm">
              <div className="flex items-center justify-between">
                <dt className="text-slate-600">Your bid</dt>
                <dd className="font-semibold text-slate-900">
                  {formatCurrency(bidSummary.bidCents)}
                </dd>
              </div>
              <div className="flex items-center justify-between">
                <dt className="text-slate-600">Buyer&apos;s fee (4.5%)</dt>
                <dd className="font-semibold text-slate-900">
                  {formatCurrency(bidSummary.buyersFeeCents)}
                </dd>
              </div>
              <div className="flex items-center justify-between border-t border-slate-200 pt-3">
                <dt className="font-medium text-slate-900">Total due if you win</dt>
                <dd className="text-lg font-semibold text-slate-900">
                  {formatCurrency(bidSummary.totalCents)}
                </dd>
              </div>
            </dl>

            <div className="rounded-md border border-slate-200 bg-slate-50 p-4">
              <div className="flex gap-3">
                <ShieldCheck className="mt-0.5 size-4 shrink-0 text-slate-700" />
                <p className="text-xs leading-relaxed text-slate-600">
                  By confirming, you authorize ApexAuction to place this bid on your behalf.
                  If you win, funds will be held in a{" "}
                  <span className="font-medium text-slate-900">KeySavvy escrow account</span>{" "}
                  until title transfer and vehicle delivery are complete, subject to KeySavvy
                  escrow terms and platform buyer protection policies.
                </p>
              </div>
            </div>
          </div>

          <DialogFooter className="border-t border-slate-200 bg-slate-50 px-5 py-4 sm:justify-between">
            <Button
              type="button"
              variant="outline"
              className="border-slate-300 bg-white text-slate-900 hover:bg-slate-100"
              onClick={() => setConfirmOpen(false)}
            >
              Cancel
            </Button>
            <Button
              type="button"
              className="bg-slate-900 text-white hover:bg-slate-800"
              onClick={handleConfirmBid}
            >
              Confirm & Secure Bid
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
