"use client";

import { toggleWatchlist } from "@/app/auctions/[id]/watchlist-actions";
import { MessageSheet } from "@/components/messaging/MessageSheet";
import { Button } from "@/components/ui/button";
import { Bell, BellOff, MessageCircle } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

type ListingActionRowProps = {
  vehicleId: string;
  sellerId: string;
  sellerName?: string;
  initiallyWatching?: boolean;
};

export function ListingActionRow({
  vehicleId,
  sellerId,
  sellerName,
  initiallyWatching = false,
}: ListingActionRowProps) {
  const [messageOpen, setMessageOpen] = useState(false);
  const [watching, setWatching] = useState(initiallyWatching);
  const [isToggling, setIsToggling] = useState(false);

  async function handleWatchAuction() {
    setIsToggling(true);
    const result = await toggleWatchlist(vehicleId);
    setIsToggling(false);

    if (!result.ok) {
      toast.error(result.message);
      return;
    }

    setWatching(result.watching);
    toast.success(result.watching ? "Added to watchlist" : "Removed from watchlist");
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
          onClick={() => void handleWatchAuction()}
          disabled={isToggling}
          className="h-11 flex-1 border-slate-300 bg-white text-slate-900 hover:bg-slate-50"
        >
          {watching ? <BellOff className="size-4" /> : <Bell className="size-4" />}
          {watching ? "Watching" : "Watch Auction"}
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
