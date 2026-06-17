import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { DealerLiveAuction } from "@/lib/data/dealer-dashboard";
import { formatCurrency } from "@/lib/utils/format";
import { Clock } from "lucide-react";

type ActiveAuctionsTableProps = {
  auctions: DealerLiveAuction[];
};

export function ActiveAuctionsTable({ auctions }: ActiveAuctionsTableProps) {
  return (
    <div className="overflow-hidden rounded-md border border-slate-200 bg-white shadow-sm">
      <Table className="min-w-[860px]">
        <TableHeader>
          <TableRow className="border-slate-200 bg-slate-50 hover:bg-slate-50">
            <TableHead>Vehicle</TableHead>
            <TableHead>VIN</TableHead>
            <TableHead>Current Bid</TableHead>
            <TableHead>Time Left</TableHead>
            <TableHead>Reserve Status</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {auctions.map((auction) => {
            const title = `${auction.year} ${auction.make} ${auction.model}`;

            return (
              <TableRow key={auction.id} className="border-slate-100">
                <TableCell>
                  <Link
                    href={`/auctions/${auction.id}`}
                    className="font-medium text-slate-900 hover:underline"
                  >
                    {title}
                  </Link>
                </TableCell>
                <TableCell className="font-mono text-xs text-slate-600">
                  {auction.vin}
                </TableCell>
                <TableCell className="font-semibold text-slate-900">
                  {formatCurrency(auction.currentBidCents)}
                </TableCell>
                <TableCell>
                  <span className="inline-flex items-center gap-1.5 text-slate-700">
                    <Clock className="size-3.5 text-slate-400" />
                    {auction.endsIn}
                  </span>
                </TableCell>
                <TableCell>
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
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}
