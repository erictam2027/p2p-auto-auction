import type { TrendingAuction } from "@/lib/data/trending-auctions";
import {
  featuredAuction,
  trendingAuctions,
} from "@/lib/data/trending-auctions";

export const browseAuctions: TrendingAuction[] = [
  featuredAuction,
  ...trendingAuctions,
  {
    id: "auc-007",
    year: 2018,
    make: "Audi",
    model: "RS5",
    trim: "Sportback",
    mileage: 42100,
    location: "Portland, OR",
    currentBidCents: 4580000,
    bidCount: 12,
    endsIn: "12h 30m",
    nmvtisVerified: true,
    inspectionAvailable: false,
  },
  {
    id: "auc-008",
    year: 2023,
    make: "Toyota",
    model: "GR86",
    trim: "Premium",
    mileage: 5100,
    location: "Nashville, TN",
    currentBidCents: 3120000,
    bidCount: 22,
    endsIn: "45m",
    nmvtisVerified: false,
    inspectionAvailable: true,
  },
  {
    id: "auc-009",
    year: 2017,
    make: "BMW",
    model: "M2",
    trim: "Competition",
    mileage: 38900,
    location: "Atlanta, GA",
    currentBidCents: 5240000,
    bidCount: 28,
    endsIn: "7h 10m",
    nmvtisVerified: true,
    inspectionAvailable: true,
  },
];

export const BROWSE_PRICE_MIN = 25_000;
export const BROWSE_PRICE_MAX = 150_000;
export const BROWSE_PRICE_STEP = 5_000;

export const BROWSE_YEAR_MIN = 2015;
export const BROWSE_YEAR_MAX = 2024;

export function parseEndsInMinutes(endsIn: string): number {
  const hoursMatch = endsIn.match(/(\d+)h/);
  const minutesMatch = endsIn.match(/(\d+)m/);
  const hours = hoursMatch ? Number(hoursMatch[1]) : 0;
  const minutes = minutesMatch ? Number(minutesMatch[1]) : 0;
  return hours * 60 + minutes;
}

export function getUniqueMakes(auctions: TrendingAuction[]): string[] {
  return [...new Set(auctions.map((a) => a.make))].sort();
}

export function getModelsForMake(
  auctions: TrendingAuction[],
  make: string,
): string[] {
  if (!make) {
    return [...new Set(auctions.map((a) => a.model))].sort();
  }
  return [
    ...new Set(
      auctions.filter((a) => a.make === make).map((a) => a.model),
    ),
  ].sort();
}
