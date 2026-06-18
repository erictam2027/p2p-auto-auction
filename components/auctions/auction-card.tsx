import Link from "next/link";
import { CountdownTimer } from "@/components/auctions/CountdownTimer";
import {
  Card,
  CardContent,
  CardFooter,
} from "@/components/ui/card";
import type { TrendingAuction } from "@/lib/data/trending-auctions";
import { formatCurrency } from "@/lib/utils/format";
import { Car } from "lucide-react";

type AuctionCardProps = {
  auction: TrendingAuction;
};

export function AuctionCard({ auction }: AuctionCardProps) {
  const title = `${auction.year} ${auction.make} ${auction.model}`;

  return (
    <Card className="group overflow-hidden border-slate-200 bg-white py-0 shadow-sm transition-shadow hover:shadow-md">
      <Link href={`/auctions/${auction.id}`} className="block">
        <div className="overflow-hidden bg-slate-100">
          <div className="relative aspect-video">
            {auction.imageUrl ? (
              <div
                aria-label={title}
                role="img"
                className="h-full w-full bg-cover bg-center transition-transform duration-500 group-hover:scale-105"
                style={{ backgroundImage: `url(${auction.imageUrl})` }}
              />
            ) : (
              <div className="flex h-full flex-col items-center justify-center gap-2 text-slate-400">
                <Car className="size-8" />
                <span className="text-xs text-slate-500">Photo pending</span>
              </div>
            )}
          </div>
        </div>
      </Link>

      <CardContent className="px-5 pt-5 pb-4">
        <Link href={`/auctions/${auction.id}`} className="block hover:opacity-90">
          <h3 className="text-base font-semibold tracking-tight text-slate-900">
            {title}
          </h3>
          <p className="mt-1 text-sm text-slate-600">{auction.trim}</p>
        </Link>
      </CardContent>

      <CardFooter className="flex items-center justify-between border-t border-slate-200 bg-slate-50 px-5 py-4">
        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
            Current Bid
          </p>
          <p className="mt-0.5 text-base font-bold text-slate-900">
            {formatCurrency(auction.currentBidCents)}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span
            className="size-2 animate-pulse rounded-full bg-red-500"
            aria-hidden
          />
          <CountdownTimer endTime={auction.endTime} />
        </div>
      </CardFooter>
    </Card>
  );
}
