import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { BiddingPanel } from "@/components/auctions/bidding-panel";
import { CardSetupHandler } from "@/components/auctions/card-setup-handler";
import { KeySavvyReturnHandler } from "@/components/auctions/keysavvy-return-handler";
import { ListingActionRow } from "@/components/auctions/listing-action-row";
import { ListingDetailMain } from "@/components/auctions/listing-detail-main";
import { ListingDetailTabs } from "@/components/auctions/listing-detail-tabs";
import { ListingQuickSpecs } from "@/components/auctions/listing-quick-specs";
import { SiteHeader } from "@/components/layout/site-header";
import { isAuctionLive } from "@/lib/auctions/vehicle-status";
import { fetchEscrowForVehicle } from "@/lib/data/escrow-transactions";
import type { ListingDetail, VehicleHistoryEntry } from "@/lib/data/listing-details";
import { isWatchingVehicle } from "@/app/auctions/[id]/watchlist-actions";
import { createClient } from "@/lib/supabase/server";
import { formatMileage } from "@/lib/utils/format";
import { ChevronRight, MapPin } from "lucide-react";

type AuctionDetailPageProps = {
  params: Promise<{ id: string }>;
};

type VehicleRow = Record<string, unknown>;
type BidRow = Record<string, unknown>;

const DEFAULT_FLAWS = [
  "Seller disclosures will be published after inspection review.",
];

const DEFAULT_SERVICE = [
  "Service records will appear here once the listing package is finalized.",
];

const DEFAULT_MODIFICATIONS = [
  "No modifications reported in the marketplace feed.",
];

const DEFAULT_HIGHLIGHTS = [
  "Equipment details pending seller verification.",
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

function readStringArray(row: VehicleRow, keys: string[], fallback: string[]) {
  for (const key of keys) {
    const value = row[key];

    if (Array.isArray(value)) {
      return value
        .filter((item): item is string => typeof item === "string" && item.trim().length > 0)
        .map((item) => item.trim());
    }

    if (typeof value === "string" && value.trim().length > 0) {
      return value
        .split(/\n|;|\|/)
        .map((item) => item.trim())
        .filter(Boolean);
    }
  }

  return fallback;
}

function readEndTime(row: VehicleRow): string {
  const value = row.end_time;

  if (typeof value !== "string" || value.trim().length === 0) {
    return "";
  }

  const parsed = Date.parse(value);

  if (!Number.isFinite(parsed)) {
    return "";
  }

  return new Date(parsed).toISOString();
}

function readBoolean(row: VehicleRow, keys: string[], fallback = false) {
  for (const key of keys) {
    const value = row[key];
    if (typeof value === "boolean") {
      return value;
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
  const endTime = readEndTime(vehicle);
  const status = readString(vehicle, ["status"], "live");
  const winnerId = readString(vehicle, ["winner_id", "winnerId"]);
  const live = isAuctionLive({
    status,
    end_time: endTime || (vehicle.end_time as string | null | undefined),
  });

  const titleStatus = readString(
    vehicle,
    ["title_status", "titleStatus"],
    "Clean title verification pending",
  );

  const nmvtisStatus = readString(vehicle, ["nmvtis_status", "nmvtisStatus"]);
  const nmvtisVerified = readBoolean(vehicle, ["nmvtis_verified", "nmvtisVerified"], false);
  const nmvtisReportUrl = readString(vehicle, ["nmvtis_report_url", "nmvtisReportUrl"]);

  const vehicleHistory: VehicleHistoryEntry[] = [
    { label: "Title Status", value: titleStatus },
    {
      label: "NMVTIS Report",
      value: nmvtisVerified
        ? "Verified clean"
        : nmvtisStatus
          ? nmvtisStatus.replaceAll("_", " ")
          : "Marketplace verification in progress",
    },
    ...(nmvtisReportUrl
      ? [{ label: "NMVTIS Link", value: nmvtisReportUrl }]
      : []),
    { label: "Listing", value: title },
    { label: "Location", value: location },
    {
      label: "Mileage",
      value: mileage > 0 ? `${mileage.toLocaleString()} miles` : "Pending",
    },
  ];

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
    endsIn: live ? "" : "Ended",
    endTime,
    status,
    winnerId,
    isLive: live,
    winnerLabel: "",
    imageUrl: readString(vehicle, ["image_url", "imageUrl"], ""),
    nmvtisVerified,
    inspectionAvailable: readBoolean(
      vehicle,
      ["inspection_available", "inspectionAvailable"],
      false,
    ),
    vin: readString(vehicle, ["vin"], "Pending"),
    sellerId: readString(vehicle, ["seller_id", "owner_id", "dealer_id", "user_id"]),
    sellerName: readString(vehicle, ["dealership_name", "seller_name"], "Seller"),
    carfaxUrl: readString(vehicle, ["carfax_url", "carfaxUrl"]),
    imageCount: 1,
    reservePriceCents: (() => {
      const reserve = readNumber(vehicle, ["reserve_price", "reservePrice"], 0);
      return reserve > 0 ? reserve * 100 : null;
    })(),
    engine: readString(vehicle, ["engine"], "Pending verification"),
    transmission: readString(vehicle, ["transmission"], "Pending verification"),
    drivetrain: readString(vehicle, ["drivetrain", "drive_train"], "Pending verification"),
    exteriorColor: readString(
      vehicle,
      ["exterior_color", "exteriorColor", "exterior"],
      "Pending verification",
    ),
    interiorColor: readString(
      vehicle,
      ["interior_color", "interiorColor", "interior"],
      "Pending verification",
    ),
    titleStatus,
    highlights: readStringArray(vehicle, ["highlights", "equipment"], DEFAULT_HIGHLIGHTS),
    vehicleHistory,
    knownFlaws: readStringArray(vehicle, ["known_flaws", "knownFlaws"], DEFAULT_FLAWS),
    recentService: readStringArray(
      vehicle,
      ["recent_service", "recentService"],
      DEFAULT_SERVICE,
    ),
    modifications: readStringArray(vehicle, ["modifications"], DEFAULT_MODIFICATIONS),
    equipment: readStringArray(vehicle, ["equipment"], DEFAULT_HIGHLIGHTS),
    dealerNotes: readStringArray(vehicle, ["dealer_notes", "dealerNotes"], [
      "This listing was synced from dealer inventory and is being prepared for public bidding.",
    ]),
    comments: [],
  };
}

async function getAuctionListing(id: string) {
  const supabase = await createClient();
  const { data: vehicle, error: vehicleError } = await supabase
    .from("vehicles")
    .select(
      "id, year, make, model, trim, mileage, location, city_state, vin, seller_id, winner_id, image_url, carfax_url, engine, transmission, drivetrain, exterior_color, interior_color, title_status, highlights, known_flaws, recent_service, modifications, equipment, dealer_notes, end_time, current_bid, status, reserve_price, nmvtis_verified, nmvtis_status, nmvtis_report_url, inspection_available, bid_count",
    )
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

  const listing = vehicleToListing(vehicle, highestBid, bids?.length ?? 0);

  if (listing.winnerId) {
    const { data: winnerProfile } = await supabase
      .from("profiles")
      .select("email, dealership_name")
      .eq("id", listing.winnerId)
      .maybeSingle();

    listing.winnerLabel =
      winnerProfile?.email ?? winnerProfile?.dealership_name ?? "Winning bidder";
  }

  return listing;
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
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const listing = await getAuctionListing(id);

  if (!listing) {
    notFound();
  }

  const escrow = await fetchEscrowForVehicle(id);
  const watching = user ? await isWatchingVehicle(id) : false;
  const title = `${listing.year} ${listing.make} ${listing.model}`;

  return (
    <div className="flex min-h-full flex-1 flex-col bg-slate-50 text-slate-900">
      <Suspense fallback={null}>
        <CardSetupHandler />
        <KeySavvyReturnHandler />
      </Suspense>
      <SiteHeader />

      <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-6 sm:px-6 sm:py-8 lg:px-8">
        <nav className="mb-4 flex items-center gap-1.5 text-sm text-slate-600">
          <Link href="/browse" className="hover:text-slate-900">
            Browse
          </Link>
          <ChevronRight className="size-3.5" />
          <span className="text-slate-900">{title}</span>
        </nav>

        <div className="grid gap-8 lg:grid-cols-[minmax(0,65fr)_minmax(0,35fr)] lg:gap-10">
          <div className="min-w-0">
            <ListingDetailMain listing={listing} title={title} />
          </div>

          <aside className="space-y-5 lg:sticky lg:top-20 lg:self-start">
            <header className="rounded-md border border-slate-200 bg-white p-5 shadow-sm">
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

            <BiddingPanel
              listing={listing}
              viewerUserId={user?.id ?? null}
              escrow={escrow}
            />
            <ListingQuickSpecs listing={listing} />
            <ListingActionRow
              vehicleId={listing.id}
              sellerId={listing.sellerId}
              sellerName={listing.sellerName}
              initiallyWatching={watching}
            />
          </aside>
        </div>

        <ListingDetailTabs listing={listing} />
      </main>
    </div>
  );
}
