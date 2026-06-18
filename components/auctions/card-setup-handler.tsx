"use client";

import { confirmCardOnFile } from "@/app/auctions/[id]/card-setup-actions";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect } from "react";
import { toast } from "sonner";

export function CardSetupHandler() {
  const searchParams = useSearchParams();
  const router = useRouter();

  useEffect(() => {
    const cardSetup = searchParams.get("card_setup");

    if (cardSetup !== "success") {
      return;
    }

    async function completeSetup() {
      const result = await confirmCardOnFile();

      if (!result.ok) {
        toast.error(result.message);
        return;
      }

      toast.success("Payment method saved. You can now place bids.");
      router.replace(window.location.pathname, { scroll: false });
    }

    void completeSetup();
  }, [router, searchParams]);

  return null;
}
