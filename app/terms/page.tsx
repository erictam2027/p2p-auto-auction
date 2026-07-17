import { SiteHeader } from "@/components/layout/site-header";

export const metadata = {
  title: "Terms of Service | ApexAuction",
  description: "Terms governing use of the ApexAuction marketplace.",
};

export default function TermsPage() {
  return (
    <div className="flex min-h-full flex-1 flex-col bg-slate-50 text-slate-900">
      <SiteHeader />
      <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-10 sm:px-6 lg:px-8">
        <h1 className="text-3xl font-semibold tracking-tight">Terms of Service</h1>
        <p className="mt-2 text-sm text-slate-600">Last updated: July 16, 2026</p>
        <div className="mt-8 space-y-4 text-sm leading-relaxed text-slate-700">
          <p>
            By creating an account, listing inventory, or placing a bid, you agree to these
            Terms of Service and all auction rules published on a listing.
          </p>
          <p>
            Bids are binding when accepted by the platform. Winning bidders must complete
            KeySavvy escrow checkout and pay the ApexAuction facilitation fee. Dealers must
            maintain valid licensing and accurate disclosures.
          </p>
          <p>
            ApexAuction may cancel auctions, reverse bids, or suspend accounts for fraud,
            title brands, or policy violations. Vehicles are sold as disclosed by the
            seller; inspections and history reports are provided for due diligence and do
            not create an implied warranty unless stated otherwise.
          </p>
        </div>
      </main>
    </div>
  );
}
