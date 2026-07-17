import Link from "next/link";
import { CountdownTimer } from "@/components/auctions/CountdownTimer";
import { ScheduleInspectionButton } from "@/components/dashboard/schedule-inspection-button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatCurrency } from "@/lib/utils/format";

export type DealerLiveAuctionRow = {
  id: string;
  vin: string;
  year: number;
  make: string;
  model: string;
  currentBidCents: number;
  endTime: string;
  location?: string;
  inspectionAvailable?: boolean;
};

type ActiveAuctionsTableProps = {
  auctions: DealerLiveAuctionRow[];
};

export function ActiveAuctionsTable({ auctions }: ActiveAuctionsTableProps) {
  return (
    <div className="overflow-hidden rounded-md border border-slate-200 bg-white shadow-sm">
      <Table className="min-w-[960px]">
        <TableHeader>
          <TableRow className="border-slate-200 bg-slate-50 hover:bg-slate-50">
            <TableHead>Vehicle</TableHead>
            <TableHead>VIN</TableHead>
            <TableHead>Current Bid</TableHead>
            <TableHead>Time Left</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Inspection</TableHead>
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
                  {auction.endTime ? (
                    <CountdownTimer endTime={auction.endTime} />
                  ) : (
                    <span className="text-sm text-slate-500">—</span>
                  )}
                </TableCell>
                <TableCell>
                  <Badge
                    variant="outline"
                    className="border-emerald-200 bg-emerald-50 text-emerald-700"
                  >
                    Live
                  </Badge>
                </TableCell>
                <TableCell>
                  {auction.inspectionAvailable ? (
                    <Badge
                      variant="outline"
                      className="border-slate-200 bg-slate-50 text-slate-700"
                    >
                      Available
                    </Badge>
                  ) : (
                    <ScheduleInspectionButton
                      vehicleId={auction.id}
                      locationHint={auction.location}
                    />
                  )}
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}
