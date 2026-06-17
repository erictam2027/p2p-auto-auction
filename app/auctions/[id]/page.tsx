import Link from "next/link";
import { notFound } from "next/navigation";
import { BiddingPanel } from "@/components/auctions/bidding-panel";
import { ListingGallery } from "@/components/auctions/listing-gallery";
import { ListingTabs } from "@/components/auctions/listing-tabs";
import { SiteHeader } from "@/components/layout/site-header";
import {
  getAllListingIds,
  getListingById,
} from "@/lib/data/listing-details";
import { ChevronRight } from "lucide-react";

type AuctionDetailPageProps = {
  params: Promise<{ id: string }>;
};

export function generateStaticParams() {
  return getAllListingIds().map((id) => ({ id }));
}

export async function generateMetadata({ params }: AuctionDetailPageProps) {
  const { id } = await params;
  const listing = getListingById(id);

  if (!listing) {
    return { title: "Listing Not Found | ApexAuction" };
  }

  const title = `${listing.year} ${listing.make} ${listing.model}`;

  return {
    title: `${title} | ApexAuction`,
    description: `Bid on this ${title} ${listing.trim}. NMVTIS verified, escrow secured via KeySavvy.`,
  };
}

export default async function AuctionDetailPage({ params }: AuctionDetailPageProps) {
  const { id } = await params;
  const listing = getListingById(id);

  if (!listing) {
    notFound();
  }

  const title = `${listing.year} ${listing.make} ${listing.model}`;

  return (
    <div className="flex min-h-full flex-1 flex-col bg-white text-slate-900">
      <SiteHeader />

      <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-6 sm:px-6 sm:py-8 lg:px-8">
        <nav className="mb-6 flex items-center gap-1.5 text-sm text-slate-600">
          <Link href="/browse" className="hover:text-slate-900">
            Browse
          </Link>
          <ChevronRight className="size-3.5" />
          <span className="text-slate-900">{title}</span>
        </nav>

        <header className="mb-6">
          <h1 className="text-2xl font-semibold tracking-tight text-slate-900 sm:text-3xl">
            {title}
          </h1>
          <p className="mt-1 text-base text-slate-600">{listing.trim}</p>
        </header>

        <div className="grid gap-8 lg:grid-cols-[minmax(0,7fr)_minmax(280px,3fr)] lg:gap-10">
          <div className="min-w-0">
            <ListingGallery imageCount={listing.imageCount} title={title} />
            <ListingTabs listing={listing} />
          </div>

          <BiddingPanel listing={listing} />
        </div>
      </main>
    </div>
  );
}
