import { LiveAuctionsTable } from "@/components/dashboard/live-auctions-table";
import { MetricCards } from "@/components/dashboard/metric-cards";
import {
  dealerLiveAuctions,
  dealerMetrics,
} from "@/lib/data/dealer-dashboard";

export const metadata = {
  title: "Overview | Dealer Portal | ApexAuction",
  description: "Manage your dealership inventory, live auctions, and escrow payouts.",
};

export default function DashboardPage() {
  return (
    <div className="flex min-h-screen flex-col">
      {/* Top bar */}
      <header className="sticky top-0 z-30 flex h-16 items-center border-b border-slate-200 bg-white px-6 lg:px-8">
        <div>
          <h1 className="text-lg font-semibold text-slate-900">Overview</h1>
          <p className="text-xs text-slate-600">Pacific Coast Motors</p>
        </div>
      </header>

      <div className="flex-1 space-y-8 p-6 lg:p-8">
        <MetricCards metrics={dealerMetrics} />

        <section>
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h2 className="text-base font-semibold text-slate-900">
                Current Live Auctions
              </h2>
              <p className="mt-0.5 text-sm text-slate-600">
                {dealerLiveAuctions.length} vehicles currently accepting bids
              </p>
            </div>
          </div>

          <LiveAuctionsTable auctions={dealerLiveAuctions} />
        </section>
      </div>
    </div>
  );
}
