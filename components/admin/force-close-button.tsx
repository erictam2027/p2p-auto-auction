"use client";

import { forceCloseAuction } from "@/app/admin/actions";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";

export function ForceCloseButton({ vehicleId }: { vehicleId: string }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  async function handleClose() {
    setBusy(true);
    try {
      await forceCloseAuction(vehicleId);
      toast.success("Auction closed");
      router.refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Unable to close auction.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <Button
      type="button"
      size="sm"
      variant="outline"
      disabled={busy}
      onClick={() => void handleClose()}
      className="border-slate-300"
    >
      Force close
    </Button>
  );
}
