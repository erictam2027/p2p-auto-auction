"use client";

import { approveDealer, rejectDealer } from "@/app/admin/actions";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";

export type PendingDealerProfile = {
  id: string;
  dealership_name: string | null;
  email: string | null;
  phone: string | null;
};

type DealerTableProps = {
  profiles: PendingDealerProfile[];
};

type PendingAction = {
  userId: string;
  type: "approve" | "reject";
};

export function DealerTable({ profiles }: DealerTableProps) {
  const router = useRouter();
  const [pendingAction, setPendingAction] = useState<PendingAction | null>(null);

  async function handleApprove(userId: string) {
    setPendingAction({ userId, type: "approve" });

    try {
      await approveDealer(userId);
      toast.success("Dealer application approved");
      router.refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Unable to approve dealer");
    } finally {
      setPendingAction(null);
    }
  }

  async function handleReject(userId: string) {
    setPendingAction({ userId, type: "reject" });

    try {
      await rejectDealer(userId);
      toast.success("Dealer application rejected");
      router.refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Unable to reject dealer");
    } finally {
      setPendingAction(null);
    }
  }

  if (profiles.length === 0) {
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
          <TableHead>Dealership Name</TableHead>
          <TableHead>Email</TableHead>
          <TableHead>Phone</TableHead>
          <TableHead className="text-right">Actions</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {profiles.map((profile) => {
          const isApproving =
            pendingAction?.userId === profile.id && pendingAction.type === "approve";
          const isRejecting =
            pendingAction?.userId === profile.id && pendingAction.type === "reject";
          const isBusy = isApproving || isRejecting;

          return (
            <TableRow key={profile.id} className="border-slate-200">
              <TableCell className="font-medium text-slate-900">
                {profile.dealership_name ?? "—"}
              </TableCell>
              <TableCell className="text-slate-700">{profile.email ?? "—"}</TableCell>
              <TableCell className="text-slate-700">{profile.phone ?? "—"}</TableCell>
              <TableCell className="text-right">
                <div className="flex justify-end gap-2">
                  <Button
                    type="button"
                    size="sm"
                    disabled={isBusy}
                    onClick={() => void handleApprove(profile.id)}
                    className="bg-emerald-600 text-white hover:bg-emerald-700"
                  >
                    {isApproving ? (
                      <>
                        <Loader2 className="animate-spin" />
                        Approving...
                      </>
                    ) : (
                      "Approve"
                    )}
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    variant="destructive"
                    disabled={isBusy}
                    onClick={() => void handleReject(profile.id)}
                  >
                    {isRejecting ? (
                      <>
                        <Loader2 className="animate-spin" />
                        Rejecting...
                      </>
                    ) : (
                      "Reject"
                    )}
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          );
        })}
      </TableBody>
    </Table>
  );
}
