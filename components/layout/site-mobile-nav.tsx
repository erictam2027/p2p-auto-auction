"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Menu } from "lucide-react";
import { useState } from "react";

type SiteMobileNavProps = {
  isAdminUser: boolean;
  isVerifiedDealerUser: boolean;
  showApplyAsDealer: boolean;
  isSignedIn: boolean;
};

export function SiteMobileNav({
  isAdminUser,
  isVerifiedDealerUser,
  showApplyAsDealer,
  isSignedIn,
}: SiteMobileNavProps) {
  const [open, setOpen] = useState(false);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        render={
          <Button
            variant="ghost"
            size="icon-sm"
            className="text-slate-700 hover:bg-slate-50 lg:hidden"
            aria-label="Open menu"
          />
        }
      >
        <Menu className="size-5" />
      </DialogTrigger>
      <DialogContent className="max-w-sm border-slate-200 bg-white">
        <DialogHeader>
          <DialogTitle className="text-slate-900">Menu</DialogTitle>
        </DialogHeader>
        <nav className="flex flex-col gap-1 pt-2">
          <Link
            href="/browse"
            onClick={() => setOpen(false)}
            className="rounded-md px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
          >
            Browse Auctions
          </Link>
          {isSignedIn ? (
            <>
              <Link
                href="/profile"
                onClick={() => setOpen(false)}
                className="rounded-md px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
              >
                Profile
              </Link>
              <Link
                href="/notifications"
                onClick={() => setOpen(false)}
                className="rounded-md px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
              >
                Notifications
              </Link>
            </>
          ) : (
            <Link
              href="/login"
              onClick={() => setOpen(false)}
              className="rounded-md px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
            >
              Sign In
            </Link>
          )}
          {isVerifiedDealerUser ? (
            <>
              <Link
                href="/dashboard"
                onClick={() => setOpen(false)}
                className="rounded-md px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
              >
                Dealer Dashboard
              </Link>
              <Link
                href="/dashboard/upload"
                onClick={() => setOpen(false)}
                className="rounded-md px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
              >
                Upload Inventory
              </Link>
            </>
          ) : null}
          {isAdminUser ? (
            <Link
              href="/admin"
              onClick={() => setOpen(false)}
              className="rounded-md px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
            >
              Admin Portal
            </Link>
          ) : null}
          {showApplyAsDealer ? (
            <Link
              href="/dealer-application"
              onClick={() => setOpen(false)}
              className="rounded-md px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
            >
              Apply as Dealer
            </Link>
          ) : null}
          <Link
            href="/sell"
            onClick={() => setOpen(false)}
            className="rounded-md px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
          >
            Sell on ApexAuction
          </Link>
        </nav>
      </DialogContent>
    </Dialog>
  );
}
