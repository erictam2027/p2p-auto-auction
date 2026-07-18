import Link from "next/link";
import { CountdownTimer } from "@/components/auctions/CountdownTimer";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  getEscrowStatusLabel,
  getPlatformFeeStatusLabel,
} from "@/lib/escrow/status-labels";
import type { EscrowStatus, PlatformFeeStatus } from "@/lib/escrow/types";
import { formatCurrency } from "@/lib/utils/format";

export type ProfileBidRow = {
  id: string;
  vehicleId: string;
  title: string;
  amountCents: number;
  endTime: string;
  isLeading: boolean;
};

type ProfileBidsTableProps = {
  bids: ProfileBidRow[];
};

export function ProfileBidsTable({ bids }: ProfileBidsTableProps) {
  return (
    <div className="overflow-hidden rounded-md border border-slate-200 bg-white shadow-sm">
      <Table className="min-w-[720px]">
        <TableHeader>
          <TableRow className="border-slate-200 bg-slate-50 hover:bg-slate-50">
            <TableHead>Vehicle</TableHead>
            <TableHead>Your Bid</TableHead>
            <TableHead>Time Left</TableHead>
            <TableHead>Status</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {bids.map((bid) => (
            <TableRow key={bid.id} className="border-slate-100">
              <TableCell>
                <Link
                  href={`/auctions/${bid.vehicleId}`}
                  className="font-medium text-slate-900 hover:underline"
                >
                  {bid.title}
                </Link>
              </TableCell>
              <TableCell className="font-semibold text-slate-900">
                {formatCurrency(bid.amountCents)}
              </TableCell>
              <TableCell>
                {bid.endTime ? (
                  <CountdownTimer endTime={bid.endTime} />
                ) : (
                  <span className="text-sm text-slate-500">—</span>
                )}
              </TableCell>
              <TableCell>
                <Badge
                  variant="outline"
                  className={
                    bid.isLeading
                      ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                      : "border-amber-200 bg-amber-50 text-amber-700"
                  }
                >
                  {bid.isLeading ? "Leading" : "Outbid"}
                </Badge>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

export type ProfileWonAuctionRow = {
  id: string;
  transactionId: string | null;
  title: string;
  amountCents: number;
  endedAt: string;
  escrowStatus: EscrowStatus;
  platformFeeStatus: PlatformFeeStatus;
};

type ProfileWonAuctionsTableProps = {
  auctions: ProfileWonAuctionRow[];
};

export function ProfileWonAuctionsTable({ auctions }: ProfileWonAuctionsTableProps) {
  return (
    <div className="overflow-hidden rounded-md border border-slate-200 bg-white shadow-sm">
      <Table className="min-w-[640px]">
        <TableHeader>
          <TableRow className="border-slate-200 bg-slate-50 hover:bg-slate-50">
            <TableHead>Vehicle</TableHead>
            <TableHead>Winning Bid</TableHead>
            <TableHead>Ended</TableHead>
            <TableHead>Escrow</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {auctions.map((auction) => (
            <TableRow key={auction.id} className="border-slate-100">
              <TableCell>
                <Link
                  href={`/auctions/${auction.id}`}
                  className="font-medium text-slate-900 hover:underline"
                >
                  {auction.title}
                </Link>
              </TableCell>
              <TableCell className="font-semibold text-slate-900">
                {formatCurrency(auction.amountCents)}
              </TableCell>
              <TableCell className="text-slate-700">{auction.endedAt}</TableCell>
              <TableCell>
                <div className="flex flex-col gap-1.5">
                  <Badge
                    variant="outline"
                    className="w-fit border-slate-200 bg-slate-50 text-slate-700"
                  >
                    {getEscrowStatusLabel(auction.escrowStatus)}
                  </Badge>
                  <Badge
                    variant="outline"
                    className="w-fit border-slate-200 bg-slate-50 text-slate-600"
                  >
                    {getPlatformFeeStatusLabel(auction.platformFeeStatus)}
                  </Badge>
                  <Link
                    href={auction.transactionId ? `/transactions/${auction.transactionId}` : `/auctions/${auction.id}`}
                    className="text-xs font-medium text-slate-900 underline-offset-4 hover:underline"
                  >
                    {auction.transactionId ? "Open workspace" : "Complete checkout"}
                  </Link>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
