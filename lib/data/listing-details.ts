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
  sellerId: string;
  sellerName: string;
  imageCount: number;
  engine: string;
  transmission: string;
  drivetrain: string;
  exteriorColor: string;
  interiorColor: string;
  titleStatus: string;
  highlights: string[];
  vehicleHistory: VehicleHistoryEntry[];
  knownFlaws: string[];
  recentService: string[];
  modifications: string[];
  equipment: string[];
  dealerNotes: string[];
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

const DEFAULT_DEALER_NOTES = [
  "One-owner vehicle purchased new from authorized dealer. Full service records available upon request.",
  "Vehicle has been reconditioned through our certified pre-owned program prior to listing.",
  "Remote buyers welcome — we will coordinate transport and KeySavvy escrow closing at no additional dealer fee.",
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
  const base: ListingDetail = {
    ...auction,
    vin: "WP0AB2A91NS2" + auction.id.slice(-4).toUpperCase().padStart(4, "0"),
    sellerId: "",
    sellerName: "Seller",
    imageCount: 6,
    engine: "Pending verification",
    transmission: "Pending verification",
    drivetrain: "Pending verification",
    exteriorColor: "Pending verification",
    interiorColor: "Pending verification",
    titleStatus: "Clean title verification pending",
    highlights: DEFAULT_EQUIPMENT,
    vehicleHistory: [
      ...DEFAULT_HISTORY,
      { label: "Location", value: auction.location },
      { label: "Mileage", value: `${auction.mileage.toLocaleString()} miles` },
    ],
    knownFlaws: DEFAULT_FLAWS,
    recentService: DEFAULT_SERVICE,
    modifications: DEFAULT_MODIFICATIONS,
    equipment: DEFAULT_EQUIPMENT,
    dealerNotes: DEFAULT_DEALER_NOTES,
    comments: DEFAULT_COMMENTS,
    endsInSeconds: parseEndsInMinutes(auction.endsIn) * 60,
  };

  if (auction.id === "auc-001") {
    return {
      ...base,
      vin: "WBS8M9C59MA123456",
      vehicleHistory: [
        { label: "Title Status", value: "Clean — no salvage, flood, or total-loss brands" },
        { label: "NMVTIS Report", value: "Verified — federal database pull completed" },
        { label: "Odometer", value: "Verified — 18,200 miles matches NMVTIS records" },
        { label: "Previous Owners", value: "1 registered owner" },
        { label: "Accident History", value: "No accidents reported to NMVTIS" },
        { label: "Exterior", value: "Isle of Man Green Metallic" },
        { label: "Interior", value: "Black Merino leather" },
        { label: "Location", value: "Austin, TX" },
      ],
      knownFlaws: [
        "Light rock chips on lower front fascia",
        "Minor curb rash on one wheel (documented in inspection photos)",
        "Small wear mark on driver seat bolster",
      ],
      recentService: [
        "BMW dealer oil service at 17,400 miles",
        "Brake fluid flush at 15,200 miles",
        "Legit Check 78-point inspection completed prior to listing",
      ],
      modifications: [
        "Stock configuration — no aftermarket engine or suspension modifications reported",
      ],
      equipment: [
        "M Carbon exterior package",
        "Harman Kardon surround sound",
        "Driving Assistant Professional",
        "Heated front seats and steering wheel",
        "Head-up display",
      ],
      dealerNotes: [
        "2021 BMW M3 Competition finished in Isle of Man Green over Black Merino leather.",
        "Single-owner Texas vehicle with full dealer service history available upon request.",
        "Remote buyers welcome — KeySavvy escrow and nationwide transport coordination available.",
      ],
    };
  }

  return base;
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
