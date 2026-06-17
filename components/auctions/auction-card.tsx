import Link from "next/link";
import { TrustBadgeGroup } from "@/components/trust/trust-badge";
import { Button } from "@/components/ui/button";
import type { TrendingAuction } from "@/lib/data/trending-auctions";
import { formatCurrency, formatMileage } from "@/lib/utils/format";
import { Clock, MapPin } from "lucide-react";

type AuctionCardProps = {
  auction: TrendingAuction;
};

export function AuctionCard({ auction }: AuctionCardProps) {
  const title = `${auction.year} ${auction.make} ${auction.model}`;

  return (
    <article className="flex flex-col overflow-hidden rounded-md border border-slate-200 bg-white shadow-sm">
      <div className="relative aspect-[16/10] bg-slate-100">
        <div className="flex h-full flex-col items-center justify-center gap-2 text-slate-400">
          <svg
            viewBox="0 0 120 48"
            className="h-8 w-20"
            fill="currentColor"
            aria-hidden
          >
            <path d="M8 32h8l4-12h56l4 12h8l-6-18H14L8 32zm14-8h76l-3-8H25l-3 8z" />
            <circle cx="28" cy="36" r="6" />
            <circle cx="92" cy="36" r="6" />
          </svg>
          <span className="text-xs text-slate-500">Photo pending</span>
        </div>

        <div className="absolute left-2 top-2 flex items-center gap-1 rounded border border-slate-200 bg-white px-2 py-0.5 text-xs font-medium text-slate-700">
          <Clock className="size-3 text-slate-500" />
          {auction.endsIn}
        </div>
      </div>

      <div className="flex flex-1 flex-col gap-3 p-4">
        <div>
          <h3 className="text-sm font-semibold text-slate-900">{title}</h3>
          <p className="mt-0.5 text-sm text-slate-600">{auction.trim}</p>
        </div>

        <dl className="grid grid-cols-2 gap-3 border-t border-slate-100 pt-3 text-sm">
          <div>
            <dt className="text-xs text-slate-600">Current bid</dt>
            <dd className="mt-0.5 font-semibold text-slate-900">
              {formatCurrency(auction.currentBidCents)}
            </dd>
          </div>
          <div>
            <dt className="text-xs text-slate-600">Bids</dt>
            <dd className="mt-0.5 font-semibold text-slate-900">{auction.bidCount}</dd>
          </div>
        </dl>

        <div className="flex items-center gap-3 text-xs text-slate-600">
          <span className="inline-flex items-center gap-1">
            <MapPin className="size-3 shrink-0" />
            {auction.location}
          </span>
          <span>{formatMileage(auction.mileage)} mi</span>
        </div>

        <TrustBadgeGroup
          nmvtisVerified={auction.nmvtisVerified}
          inspectionAvailable={auction.inspectionAvailable}
          compact
        />

        <Link href={`/auctions/${auction.id}`} className="mt-auto">
          <Button className="w-full bg-slate-900 text-white hover:bg-slate-800">
            Place Bid
          </Button>
        </Link>
      </div>
    </article>
  );
}
