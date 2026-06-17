import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { DealerPayoutTransaction } from "@/lib/data/dealer-dashboard";
import { formatCurrency } from "@/lib/utils/format";

type PayoutsTransactionTableProps = {
  transactions: DealerPayoutTransaction[];
};

export function PayoutsTransactionTable({
  transactions,
}: PayoutsTransactionTableProps) {
  return (
    <div className="overflow-hidden rounded-md border border-slate-200 bg-white shadow-sm">
      <Table className="min-w-[800px]">
        <TableHeader>
          <TableRow className="border-slate-200 bg-slate-50 hover:bg-slate-50">
            <TableHead>Vehicle</TableHead>
            <TableHead>VIN</TableHead>
            <TableHead>Amount</TableHead>
            <TableHead>Completed</TableHead>
            <TableHead>KeySavvy Transfer</TableHead>
            <TableHead>Status</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {transactions.map((tx) => (
            <TableRow key={tx.id} className="border-slate-100">
              <TableCell className="font-medium text-slate-900">{tx.vehicle}</TableCell>
              <TableCell className="font-mono text-xs text-slate-600">{tx.vin}</TableCell>
              <TableCell className="font-semibold text-slate-900">
                {formatCurrency(tx.amountCents)}
              </TableCell>
              <TableCell className="text-slate-700">{tx.completedAt}</TableCell>
              <TableCell className="font-mono text-xs text-slate-600">
                {tx.keysavvyTransferId}
              </TableCell>
              <TableCell>
                <Badge
                  variant="outline"
                  className="border-slate-200 bg-slate-50 capitalize text-slate-700"
                >
                  {tx.status}
                </Badge>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
