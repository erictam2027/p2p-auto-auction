import { browseAuctions, parseEndsInMinutes } from "@/lib/data/browse-auctions";
import type { TrendingAuction } from "@/lib/data/trending-auctions";

export type ListingComment = {
  id: string;
  author: string;
  postedAt: string;
  body: string;
};

export type VehicleHistoryEntry = {
  label: string;
  value: string;
};

export type ListingDetail = TrendingAuction & {
  vin: string;
  imageCount: number;
  vehicleHistory: VehicleHistoryEntry[];
  knownFlaws: string[];
  recentService: string[];
  modifications: string[];
  equipment: string[];
  comments: ListingComment[];
  endsInSeconds: number;
};

const DEFAULT_HISTORY: VehicleHistoryEntry[] = [
  { label: "Title Status", value: "Clean — no salvage, flood, or total-loss brands" },
  { label: "NMVTIS Report", value: "Verified — federal database pull completed" },
  { label: "Odometer", value: "Verified — matches NMVTIS records" },
  { label: "Previous Owners", value: "2 registered owners" },
  { label: "Accident History", value: "No accidents reported to NMVTIS" },
];

const DEFAULT_FLAWS = [
  "Light stone chips on front bumper and hood leading edge",
  "Minor wear on driver seat bolsters consistent with mileage",
  "Small parking lot scuff on rear passenger door (documented in inspection)",
];

const DEFAULT_SERVICE = [
  "Full synthetic oil change at 11,800 miles",
  "Brake fluid flush at 10,500 miles",
  "Annual dealer inspection completed",
];

const DEFAULT_MODIFICATIONS = [
  "None reported — vehicle appears stock per inspection",
];

const DEFAULT_EQUIPMENT = [
  "Premium audio system",
  "Heated front seats",
  "Adaptive cruise control",
  "Parking sensors front and rear",
];

const DEFAULT_COMMENTS: ListingComment[] = [
  {
    id: "c1",
    author: "Verified Buyer",
    postedAt: "2 days ago",
    body: "Inspection report looks thorough. Appreciate the documented flaw photos — builds confidence in the listing.",
  },
  {
    id: "c2",
    author: "Community Member",
    postedAt: "1 day ago",
    body: "Clean Carfax equivalent via NMVTIS is a huge plus. Watching this one closely.",
  },
];

function buildListing(auction: TrendingAuction): ListingDetail {
  return {
    ...auction,
    vin: "WP0AB2A91NS2" + auction.id.slice(-4).toUpperCase().padStart(4, "0"),
    imageCount: 6,
    vehicleHistory: [
      ...DEFAULT_HISTORY,
      { label: "Location", value: auction.location },
      { label: "Mileage", value: `${auction.mileage.toLocaleString()} miles` },
    ],
    knownFlaws: DEFAULT_FLAWS,
    recentService: DEFAULT_SERVICE,
    modifications: DEFAULT_MODIFICATIONS,
    equipment: DEFAULT_EQUIPMENT,
    comments: DEFAULT_COMMENTS,
    endsInSeconds: parseEndsInMinutes(auction.endsIn) * 60,
  };
}

const listingMap = new Map(
  browseAuctions.map((auction) => [auction.id, buildListing(auction)]),
);

export function getListingById(id: string): ListingDetail | undefined {
  return listingMap.get(id);
}

export function getAllListingIds(): string[] {
  return browseAuctions.map((auction) => auction.id);
}
