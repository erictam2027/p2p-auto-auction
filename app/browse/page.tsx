import { BrowseContent } from "@/components/browse/browse-content";
import { SiteHeader } from "@/components/layout/site-header";

export const metadata = {
  title: "Browse Auctions | ApexAuction",
  description:
    "Search and filter live vehicle auctions by make, model, max price, clean title, and dealer certification.",
};

export default function BrowsePage() {
  return (
    <div className="flex min-h-full flex-1 flex-col bg-slate-50 text-slate-900">
      <SiteHeader />
      <main className="flex-1">
        <BrowseContent />
      </main>
    </div>
  );
}
