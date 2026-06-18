"use client";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Bell, MessageCircle } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

export function ListingActionRow() {
  const [messageOpen, setMessageOpen] = useState(false);

  function handleWatchAuction() {
    toast.success("Auction added to your watchlist");
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
          onClick={() => setMessageOpen(true)}
          className="h-11 flex-1 border-slate-300 bg-white text-slate-900 hover:bg-slate-50"
        >
          <MessageCircle className="size-4" />
          Message Seller
        </Button>
      </div>

      <Dialog open={messageOpen} onOpenChange={setMessageOpen}>
        <DialogContent className="border-slate-200 bg-white sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-lg font-semibold text-slate-900">
              Message Seller
            </DialogTitle>
            <DialogDescription className="text-slate-600">
              In-app messaging coming soon
            </DialogDescription>
          </DialogHeader>
        </DialogContent>
      </Dialog>
    </>
  );
}
