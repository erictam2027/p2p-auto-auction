import { ActiveAuctionsTable } from "@/components/dashboard/active-auctions-table";
import { dealerLiveAuctions } from "@/lib/data/dealer-dashboard";

export const metadata = {
  title: "Active Auctions | Dealer Portal | ApexAuction",
  description: "Monitor live dealer auctions, bids, and reserve status.",
};

export default function ActiveAuctionsPage() {
  return (
    <div className="flex min-h-screen flex-col">
      <header className="sticky top-0 z-30 border-b border-slate-200 bg-white px-6 py-5 lg:px-8">
        <h1 className="text-lg font-semibold text-slate-900">Active Auctions</h1>
        <p className="mt-1 text-sm text-slate-600">
          {dealerLiveAuctions.length} vehicles currently live on the marketplace.
        </p>
      </header>

      <div className="flex-1 p-6 lg:p-8">
        <ActiveAuctionsTable auctions={dealerLiveAuctions} />
      </div>
    </div>
  );
}
