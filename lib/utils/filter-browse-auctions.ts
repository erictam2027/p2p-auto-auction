import type { TrendingAuction } from "@/lib/data/trending-auctions";

export type BrowseFilterState = {
  search: string;
  make: string;
  model: string;
  maxPrice: number;
  cleanTitle: boolean;
  dealerCertified: boolean;
};

export type BrowseSortOption = "ending-soonest" | "lowest-mileage" | "highest-bid";

function normalize(value: string): string {
  return value.trim().toLowerCase();
}

function auctionSearchText(auction: TrendingAuction): string {
  return [
    auction.make,
    auction.model,
    auction.trim,
    `${auction.year} ${auction.make} ${auction.model}`,
    auction.location,
    String(auction.year),
  ]
    .join(" ")
    .toLowerCase();
}

function matchesSearchQuery(auction: TrendingAuction, query: string): boolean {
  if (!query) return true;

  const tokens = query.split(/\s+/).filter(Boolean);
  const haystack = auctionSearchText(auction);

  return tokens.every((token) => {
    if (haystack.includes(token)) return true;

    // Allow partial make matches, e.g. "mercedes" -> "Mercedes-Benz"
    if (normalize(auction.make).includes(token)) return true;
    if (normalize(auction.model).includes(token)) return true;

    return false;
  });
}

export function filterBrowseAuctions(
  auctions: TrendingAuction[],
  filters: BrowseFilterState,
): TrendingAuction[] {
  const query = normalize(filters.search);
  const maxPriceCents = filters.maxPrice * 100;

  return auctions.filter((auction) => {
    if (filters.make && auction.make !== filters.make) return false;
    if (filters.model && auction.model !== filters.model) return false;
    if (auction.currentBidCents > maxPriceCents) return false;
    if (filters.cleanTitle && !auction.nmvtisVerified) return false;
    if (filters.dealerCertified && !auction.inspectionAvailable) return false;
    if (!matchesSearchQuery(auction, query)) return false;

    return true;
  });
}

function getEndTimestamp(auction: TrendingAuction): number {
  if (!auction.endTime) {
    return Number.POSITIVE_INFINITY;
  }

  const parsed = Date.parse(auction.endTime);
  return Number.isFinite(parsed) ? parsed : Number.POSITIVE_INFINITY;
}

export function sortBrowseAuctions(
  auctions: TrendingAuction[],
  sort: BrowseSortOption,
): TrendingAuction[] {
  const sorted = [...auctions];

  switch (sort) {
    case "ending-soonest":
      return sorted.sort((a, b) => getEndTimestamp(a) - getEndTimestamp(b));
    case "lowest-mileage":
      return sorted.sort((a, b) => a.mileage - b.mileage);
    case "highest-bid":
      return sorted.sort((a, b) => b.currentBidCents - a.currentBidCents);
    default:
      return sorted;
  }
}

export function hasActiveBrowseFilters(
  filters: BrowseFilterState,
  maxPriceDefault: number,
): boolean {
  return (
    filters.search.trim().length > 0 ||
    filters.make.length > 0 ||
    filters.model.length > 0 ||
    filters.maxPrice < maxPriceDefault ||
    filters.cleanTitle ||
    filters.dealerCertified
  );
}
