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
import { CheckCircle2 } from "lucide-react";
import { useEffect, useState } from "react";

type BiddingPanelProps = {
  listing: ListingDetail;
};

const SNIPE_THRESHOLD_SECONDS = 2 * 60;
const SNIPE_RESET_SECONDS = 2 * 60;
const SUCCESS_TOAST_MS = 4000;

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
  const minBid = listing.currentBidCents + 10000;
  const title = `${listing.year} ${listing.make} ${listing.model}`;

  const [secondsLeft, setSecondsLeft] = useState(listing.endsInSeconds);
  const [bidModalOpen, setBidModalOpen] = useState(false);
  const [maxBid, setMaxBid] = useState(String(Math.ceil(minBid / 100)));
  const [bidError, setBidError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [snipeExtended, setSnipeExtended] = useState(false);

  useEffect(() => {
    const interval = setInterval(() => {
      setSecondsLeft((current) => Math.max(0, current - 1));
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (!successMessage) return;

    const timeout = setTimeout(() => setSuccessMessage(null), SUCCESS_TOAST_MS);
    return () => clearTimeout(timeout);
  }, [successMessage]);

  function openBidModal() {
    setMaxBid(String(Math.ceil(minBid / 100)));
    setBidError(null);
    setBidModalOpen(true);
  }

  function handleConfirmBid() {
    const dollars = Number(maxBid);

    if (!maxBid.trim() || Number.isNaN(dollars) || dollars <= 0) {
      setBidError("Enter a valid max bid amount.");
      return;
    }

    if (dollars * 100 < minBid) {
      setBidError(`Max bid must be at least ${formatCurrency(minBid)}.`);
      return;
    }

    if (secondsLeft < SNIPE_THRESHOLD_SECONDS) {
      setSecondsLeft(SNIPE_RESET_SECONDS);
      setSnipeExtended(true);
    } else {
      setSnipeExtended(false);
    }

    setBidModalOpen(false);
    setBidError(null);
    setSuccessMessage(
      `Bid of ${formatCurrency(Math.round(dollars * 100))} submitted successfully.`,
    );
  }

  const inSnipeWindow = secondsLeft > 0 && secondsLeft <= SNIPE_THRESHOLD_SECONDS;

  return (
    <>
      {successMessage ? (
        <div
          role="status"
          aria-live="polite"
          className="fixed bottom-4 right-4 z-50 flex max-w-sm items-start gap-3 rounded-md border border-slate-200 bg-white px-4 py-3 shadow-lg"
        >
          <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-slate-700" />
          <div>
            <p className="text-sm font-medium text-slate-900">Bid confirmed</p>
            <p className="mt-0.5 text-sm text-slate-600">{successMessage}</p>
          </div>
        </div>
      ) : null}

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
            {snipeExtended ? (
              <p className="mt-2 text-xs font-medium text-slate-700">
                Auction extended to 2:00 remaining
              </p>
            ) : null}
          </div>

          <div className="mt-5 space-y-3">
            <Button
              type="button"
              onClick={openBidModal}
              className="h-11 w-full bg-slate-900 text-base text-white hover:bg-slate-800"
            >
              Place Bid
            </Button>

            <ListingTrustStrip />
          </div>
        </div>
      </aside>

      <Dialog open={bidModalOpen} onOpenChange={setBidModalOpen}>
        <DialogContent className="gap-0 overflow-hidden border-slate-200 bg-white p-0 sm:max-w-md">
          <DialogHeader className="border-b border-slate-200 px-5 py-4">
            <DialogTitle className="text-lg font-semibold text-slate-900">
              Confirm Your Bid
            </DialogTitle>
            <DialogDescription className="text-sm text-slate-600">
              {title} · {listing.trim}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-5 px-5 py-5">
            <div className="rounded-md border border-slate-200 bg-slate-50 px-4 py-3">
              <p className="text-xs font-medium uppercase tracking-wide text-slate-600">
                Current bid
              </p>
              <p className="mt-1 text-2xl font-semibold text-slate-900">
                {formatCurrency(listing.currentBidCents)}
              </p>
            </div>

            <div className="space-y-2">
              <label htmlFor="max-bid" className="text-sm font-medium text-slate-900">
                Max bid
              </label>
              <div className="relative">
                <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm text-slate-600">
                  $
                </span>
                <Input
                  id="max-bid"
                  type="number"
                  min={Math.ceil(minBid / 100)}
                  step={100}
                  value={maxBid}
                  onChange={(e) => {
                    setMaxBid(e.target.value);
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
            </div>

            <p className="text-xs leading-relaxed text-slate-600">
              Snipe protection: bids placed with under 2:00 remaining reset the auction
              clock to exactly 2:00.
            </p>
          </div>

          <DialogFooter className="border-t border-slate-200 bg-slate-50 px-5 py-4 sm:justify-between">
            <Button
              type="button"
              variant="outline"
              className="border-slate-300 bg-white text-slate-900 hover:bg-slate-100"
              onClick={() => setBidModalOpen(false)}
            >
              Cancel
            </Button>
            <Button
              type="button"
              className="bg-slate-900 text-white hover:bg-slate-800"
              onClick={handleConfirmBid}
            >
              Confirm Bid
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
