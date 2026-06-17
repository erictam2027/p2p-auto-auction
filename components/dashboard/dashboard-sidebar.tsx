"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  Car,
  Gavel,
  LayoutDashboard,
  Settings,
  Wallet,
} from "lucide-react";

const NAV_ITEMS = [
  { href: "/dashboard", label: "Overview", icon: LayoutDashboard },
  { href: "/dashboard/inventory", label: "Inventory", icon: Car },
  { href: "/dashboard/auctions", label: "Active Auctions", icon: Gavel },
  { href: "/dashboard/payouts", label: "Payouts", icon: Wallet },
  { href: "/dashboard/settings", label: "Settings", icon: Settings },
] as const;

export function DashboardSidebar() {
  const pathname = usePathname();

  return (
    <aside className="fixed inset-y-0 left-0 z-40 flex w-64 flex-col border-r border-slate-200 bg-white">
      <div className="flex h-16 items-center border-b border-slate-200 px-5">
        <Link href="/dashboard" className="flex items-center gap-2.5">
          <span className="flex size-8 items-center justify-center rounded-md border border-slate-200 bg-slate-50">
            <Gavel className="size-4 text-slate-700" />
          </span>
          <div>
            <p className="text-sm font-semibold text-slate-900">ApexAuction</p>
            <p className="text-[10px] font-medium uppercase tracking-wide text-slate-500">
              Dealer Portal
            </p>
          </div>
        </Link>
      </div>

      <nav className="flex-1 space-y-1 px-3 py-4">
        {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
          const isActive =
            href === "/dashboard"
              ? pathname === "/dashboard"
              : pathname.startsWith(href);

          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                isActive
                  ? "bg-slate-900 text-white"
                  : "text-slate-600 hover:bg-slate-50 hover:text-slate-900",
              )}
            >
              <Icon className="size-4 shrink-0" />
              {label}
            </Link>
          );
        })}
      </nav>

      <div className="border-t border-slate-200 p-4">
        <div className="rounded-md border border-slate-200 bg-slate-50 px-3 py-2.5">
          <p className="text-xs font-medium text-slate-900">Pacific Coast Motors</p>
          <p className="text-[11px] text-slate-600">Licensed Dealer · CA</p>
        </div>
      </div>
    </aside>
  );
}
