import Link from "next/link";
import { notFound } from "next/navigation";
import { BiddingPanel } from "@/components/auctions/bidding-panel";
import { ListingDetailMain } from "@/components/auctions/listing-detail-main";
import { SiteHeader } from "@/components/layout/site-header";
import type { ListingDetail, VehicleHistoryEntry } from "@/lib/data/listing-details";
import { parseEndsInMinutes } from "@/lib/data/browse-auctions";
import { createClient } from "@/lib/supabase/server";
import { formatMileage } from "@/lib/utils/format";
import { ChevronRight, MapPin } from "lucide-react";

type AuctionDetailPageProps = {
  params: Promise<{ id: string }>;
};

type VehicleRow = Record<string, unknown>;
type BidRow = Record<string, unknown>;

const DEFAULT_HISTORY: VehicleHistoryEntry[] = [
  { label: "Title Status", value: "Clean title verification pending" },
  { label: "NMVTIS Report", value: "Marketplace verification in progress" },
  { label: "Odometer", value: "Seller-reported mileage pending" },
];

const DEFAULT_FLAWS = [
  "Seller disclosures will be published after inspection review.",
];

const DEFAULT_SERVICE = [
  "Service records will appear here once the listing package is finalized.",
];

const DEFAULT_MODIFICATIONS = [
  "No modifications reported in the marketplace feed.",
];

const DEFAULT_EQUIPMENT = [
  "Equipment details pending seller verification.",
];

const DEFAULT_DEALER_NOTES = [
  "This listing was synced from dealer inventory and is being prepared for public bidding.",
];

function readString(row: VehicleRow, keys: string[], fallback = "") {
  for (const key of keys) {
    const value = row[key];
    if (typeof value === "string" && value.trim().length > 0) {
      return value;
    }
  }

  return fallback;
}

function readNumber(row: VehicleRow | BidRow | null | undefined, keys: string[], fallback = 0) {
  if (!row) return fallback;

  for (const key of keys) {
    const value = row[key];
    if (typeof value === "number" && Number.isFinite(value)) {
      return value;
    }
    if (typeof value === "string") {
      const parsed = Number(value);
      if (Number.isFinite(parsed)) {
        return parsed;
      }
    }
  }

  return fallback;
}

function vehicleToListing(
  vehicle: VehicleRow,
  highestBid: number,
  bidCount: number,
): ListingDetail {
  const title = `${readNumber(vehicle, ["year"], new Date().getFullYear())} ${readString(
    vehicle,
    ["make"],
    "Vehicle",
  )} ${readString(vehicle, ["model"], "Listing")}`;
  const mileage = readNumber(vehicle, ["mileage", "odometer"], 0);
  const location = readString(vehicle, ["location", "city_state", "city"], "Location pending");
  const endsIn = readString(vehicle, ["time_left", "ends_in", "endsIn"], "Coming soon");

  return {
    id: readString(vehicle, ["id"]),
    year: readNumber(vehicle, ["year"], new Date().getFullYear()),
    make: readString(vehicle, ["make"], "Vehicle"),
    model: readString(vehicle, ["model"], "Listing"),
    trim: readString(vehicle, ["trim", "variant"], "Verified auction"),
    mileage,
    location,
    currentBidCents: highestBid * 100,
    bidCount,
    endsIn,
    imageUrl: readString(vehicle, ["image_url", "imageUrl"], ""),
    nmvtisVerified: true,
    inspectionAvailable: false,
    vin: readString(vehicle, ["vin"], "Pending"),
    imageCount: 1,
    vehicleHistory: [
      ...DEFAULT_HISTORY,
      { label: "Listing", value: title },
      { label: "Location", value: location },
      { label: "Mileage", value: mileage > 0 ? `${mileage.toLocaleString()} miles` : "Pending" },
    ],
    knownFlaws: DEFAULT_FLAWS,
    recentService: DEFAULT_SERVICE,
    modifications: DEFAULT_MODIFICATIONS,
    equipment: DEFAULT_EQUIPMENT,
    dealerNotes: DEFAULT_DEALER_NOTES,
    comments: [],
    endsInSeconds: parseEndsInMinutes(endsIn) * 60,
  };
}

async function getAuctionListing(id: string) {
  const supabase = await createClient();
  const { data: vehicle, error: vehicleError } = await supabase
    .from("vehicles")
    .select("*")
    .eq("id", id)
    .single();

  if (vehicleError || !vehicle) {
    return null;
  }

  const { data: bids, error: bidsError } = await supabase
    .from("bids")
    .select("*")
    .eq("vehicle_id", id);

  if (bidsError) {
    console.error("Supabase bids fetch error:", bidsError);
  }

  const highestBid = Math.max(
    readNumber(vehicle, ["current_bid"]),
    ...(bids ?? []).map((bid) => readNumber(bid, ["amount", "bid_amount", "current_bid"])),
  );

  return vehicleToListing(vehicle, highestBid, bids?.length ?? 0);
}

export async function generateMetadata({ params }: AuctionDetailPageProps) {
  const { id } = await params;
  const listing = await getAuctionListing(id);

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
  const listing = await getAuctionListing(id);

  if (!listing) {
    notFound();
  }

  const title = `${listing.year} ${listing.make} ${listing.model}`;

  return (
    <div className="flex min-h-full flex-1 flex-col bg-slate-50 text-slate-900">
      <SiteHeader />

      <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-6 sm:px-6 sm:py-8 lg:px-8">
        <nav className="mb-4 flex items-center gap-1.5 text-sm text-slate-600">
          <Link href="/browse" className="hover:text-slate-900">
            Browse
          </Link>
          <ChevronRight className="size-3.5" />
          <span className="text-slate-900">{title}</span>
        </nav>

        <header className="mb-6 rounded-md border border-slate-200 bg-white p-5 shadow-sm">
          <h1 className="text-2xl font-semibold tracking-tight text-slate-900 sm:text-3xl">
            {title}
          </h1>
          <p className="mt-1 text-base text-slate-600">{listing.trim}</p>
          <div className="mt-3 flex flex-wrap items-center gap-4 text-sm text-slate-600">
            <span>{formatMileage(listing.mileage)} miles</span>
            <span className="inline-flex items-center gap-1">
              <MapPin className="size-3.5 text-slate-500" />
              {listing.location}
            </span>
          </div>
        </header>

        <div className="grid gap-8 lg:grid-cols-[minmax(0,65fr)_minmax(0,35fr)] lg:gap-10">
          <div className="min-w-0">
            <ListingDetailMain listing={listing} title={title} />
          </div>

          <BiddingPanel listing={listing} />
        </div>
      </main>
    </div>
  );
}
