"use client";

import { MessageSheet } from "@/components/messaging/MessageSheet";
import { Button } from "@/components/ui/button";
import { Bell, MessageCircle } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

type ListingActionRowProps = {
  vehicleId: string;
  sellerId: string;
  sellerName?: string;
};

export function ListingActionRow({
  vehicleId,
  sellerId,
  sellerName,
}: ListingActionRowProps) {
  const [messageOpen, setMessageOpen] = useState(false);

  function handleWatchAuction() {
    toast.success("Auction added to your watchlist");
  }

  function handleMessageSeller() {
    if (!sellerId) {
      toast.error("Seller information is unavailable for this listing.");
      return;
    }

    setMessageOpen(true);
  }

  return (
    <>
      <div className="flex flex-col gap-3 sm:flex-row">
        <Button
          type="button"
          variant="outline"
          onClick={handleWatchAuction}
          className="h-11 flex-1 border-slate-300 bg-white text-slate-900 hover:bg-slate-50"
        >
          <Bell className="size-4" />
          Watch Auction
        </Button>
        <Button
          type="button"
          variant="outline"
          onClick={handleMessageSeller}
          className="h-11 flex-1 border-slate-300 bg-white text-slate-900 hover:bg-slate-50"
        >
          <MessageCircle className="size-4" />
          Message Seller
        </Button>
      </div>

      <MessageSheet
        open={messageOpen}
        onOpenChange={setMessageOpen}
        vehicleId={vehicleId}
        sellerId={sellerId}
        sellerName={sellerName}
      />
    </>
  );
}
