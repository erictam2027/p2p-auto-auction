import Link from "next/link";
import type { TrendingAuction } from "@/lib/data/trending-auctions";
import { formatCurrency } from "@/lib/utils/format";
import { Clock } from "lucide-react";

type BrowseAuctionCardProps = {
  auction: TrendingAuction;
};

export function BrowseAuctionCard({ auction }: BrowseAuctionCardProps) {
  const title = `${auction.year} ${auction.make} ${auction.model}`;

  return (
    <article className="flex flex-col overflow-hidden rounded-md border border-slate-200 bg-white shadow-sm transition-shadow hover:shadow-md">
      <Link
        href={`/auctions/${auction.id}`}
        className="relative block aspect-[16/10] bg-slate-100"
      >
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
      </Link>

      <div className="flex flex-1 flex-col gap-3 p-4">
        <Link href={`/auctions/${auction.id}`} className="hover:opacity-90">
          <h3 className="text-sm font-semibold text-slate-900">{title}</h3>
        </Link>

        <dl className="mt-auto grid grid-cols-2 gap-3 border-t border-slate-100 pt-3 text-sm">
          <div>
            <dt className="text-xs text-slate-600">Current bid</dt>
            <dd className="mt-0.5 font-semibold text-slate-900">
              {formatCurrency(auction.currentBidCents)}
            </dd>
          </div>
          <div>
            <dt className="text-xs text-slate-600">Time left</dt>
            <dd className="mt-0.5 inline-flex items-center gap-1 font-semibold text-slate-900">
              <Clock className="size-3 text-slate-500" />
              {auction.endsIn}
            </dd>
          </div>
        </dl>
      </div>
    </article>
  );
}
