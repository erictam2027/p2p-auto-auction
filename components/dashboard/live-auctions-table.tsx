import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import type { DealerLiveAuction } from "@/lib/data/dealer-dashboard";
import { formatCurrency } from "@/lib/utils/format";
import { Clock } from "lucide-react";

type LiveAuctionsTableProps = {
  auctions: DealerLiveAuction[];
};

export function LiveAuctionsTable({ auctions }: LiveAuctionsTableProps) {
  return (
    <div className="overflow-hidden rounded-md border border-slate-200 bg-white shadow-sm">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[720px] text-left text-sm">
          <thead>
            <tr className="border-b border-slate-200 bg-slate-50">
              <th className="px-4 py-3 font-medium text-slate-600">Vehicle</th>
              <th className="px-4 py-3 font-medium text-slate-600">Current Bid</th>
              <th className="px-4 py-3 font-medium text-slate-600">Time Remaining</th>
              <th className="px-4 py-3 font-medium text-slate-600">Watchers</th>
              <th className="px-4 py-3 font-medium text-slate-600">Reserve Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {auctions.map((auction) => {
              const title = `${auction.year} ${auction.make} ${auction.model}`;

              return (
                <tr
                  key={auction.id}
                  className="transition-colors hover:bg-slate-50/80"
                >
                  <td className="px-4 py-3">
                    <Link
                      href={`/auctions/${auction.id}`}
                      className="flex items-center gap-3"
                    >
                      <div className="flex size-12 shrink-0 items-center justify-center overflow-hidden rounded border border-slate-200 bg-slate-100">
                        <svg
                          viewBox="0 0 120 48"
                          className="h-5 w-10 text-slate-300"
                          fill="currentColor"
                          aria-hidden
                        >
                          <path d="M8 32h8l4-12h56l4 12h8l-6-18H14L8 32z" />
                        </svg>
                      </div>
                      <span className="font-medium text-slate-900">{title}</span>
                    </Link>
                  </td>
                  <td className="px-4 py-3 font-semibold text-slate-900">
                    {formatCurrency(auction.currentBidCents)}
                  </td>
                  <td className="px-4 py-3">
                    <span className="inline-flex items-center gap-1.5 text-slate-700">
                      <Clock className="size-3.5 text-slate-400" />
                      {auction.endsIn}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-slate-700">
                    {auction.watchers.toLocaleString()}
                  </td>
                  <td className="px-4 py-3">
                    <Badge
                      variant="outline"
                      className={
                        auction.reserveMet
                          ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                          : "border-slate-200 bg-slate-50 text-slate-600"
                      }
                    >
                      {auction.reserveMet ? "Met" : "Not Met"}
                    </Badge>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
