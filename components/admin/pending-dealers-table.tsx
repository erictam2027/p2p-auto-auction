"use client";

import { approveDealerApplication } from "@/app/admin/actions";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";

export type PendingDealer = {
  id: string;
  dealership_name: string | null;
  dealer_license: string | null;
  email: string | null;
};

type PendingDealersTableProps = {
  dealers: PendingDealer[];
};

export function PendingDealersTable({ dealers }: PendingDealersTableProps) {
  const router = useRouter();
  const [approvingId, setApprovingId] = useState<string | null>(null);

  async function handleApprove(profileId: string) {
    setApprovingId(profileId);

    const result = await approveDealerApplication(profileId);

    setApprovingId(null);

    if (!result.ok) {
      toast.error(result.message);
      return;
    }

    toast.success("Dealer application approved");
    router.refresh();
  }

  if (dealers.length === 0) {
    return (
      <div className="rounded-md border border-dashed border-slate-300 bg-white px-6 py-12 text-center">
        <p className="text-sm font-semibold text-slate-900">No pending applications</p>
        <p className="mx-auto mt-2 max-w-md text-sm text-slate-600">
          New dealer verification requests will appear here for review.
        </p>
      </div>
    );
  }

  return (
    <Table>
      <TableHeader>
        <TableRow className="border-slate-200 hover:bg-transparent">
          <TableHead>Dealership</TableHead>
          <TableHead>Dealer License</TableHead>
          <TableHead>Email</TableHead>
          <TableHead className="text-right">Action</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {dealers.map((dealer) => (
          <TableRow key={dealer.id} className="border-slate-200">
            <TableCell className="font-medium text-slate-900">
              {dealer.dealership_name ?? "—"}
            </TableCell>
            <TableCell className="font-mono text-sm text-slate-700">
              {dealer.dealer_license ?? "—"}
            </TableCell>
            <TableCell className="text-slate-700">
              {dealer.email ?? "—"}
            </TableCell>
            <TableCell className="text-right">
              <Button
                type="button"
                size="sm"
                disabled={approvingId === dealer.id}
                onClick={() => void handleApprove(dealer.id)}
                className="bg-slate-900 text-white hover:bg-slate-800"
              >
                {approvingId === dealer.id ? "Approving..." : "Approve"}
              </Button>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
