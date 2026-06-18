"use client";

import { confirmKeySavvyReturn } from "@/app/auctions/[id]/checkout-actions";
import { confirmPlatformFeePayment } from "@/app/auctions/[id]/platform-fee-actions";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect } from "react";
import { toast } from "sonner";

export function KeySavvyReturnHandler() {
  const searchParams = useSearchParams();
  const router = useRouter();

  useEffect(() => {
    const keySavvyStatus = searchParams.get("keysavvy");
    const platformFeeStatus = searchParams.get("platform_fee");

    if (!keySavvyStatus && !platformFeeStatus) {
      return;
    }

    async function handleReturn() {
      const pathname = window.location.pathname;
      const vehicleId = pathname.split("/").pop() ?? "";

      if (keySavvyStatus === "return") {
        const result = await confirmKeySavvyReturn(vehicleId);

        if (!result.ok) {
          toast.error(result.message);
        } else {
          toast.success(
            "Welcome back from KeySavvy. Complete the platform fee when escrow payment is confirmed.",
          );
        }
      }

      if (keySavvyStatus === "cancelled") {
        toast.message("KeySavvy checkout was cancelled. You can resume anytime.");
      }

      if (platformFeeStatus === "success") {
        const result = await confirmPlatformFeePayment(vehicleId);

        if (!result.ok) {
          toast.error(result.message);
        } else {
          toast.success("Platform fee paid successfully.");
        }
      }

      if (platformFeeStatus === "cancelled") {
        toast.message("Platform fee checkout was cancelled.");
      }

      router.replace(pathname, { scroll: false });
    }

    void handleReturn();
  }, [router, searchParams]);

  return null;
}
