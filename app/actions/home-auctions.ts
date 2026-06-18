"use server";

import type { HomeAuctionFilters } from "@/lib/data/home-auction-filters";
import { DEFAULT_HOME_AUCTION_FILTERS } from "@/lib/data/home-auction-filters";
import { fetchHomeAuctions } from "@/lib/data/home-auctions";
import type { TrendingAuction } from "@/lib/data/trending-auctions";

export async function searchHomeAuctions(
  filters: HomeAuctionFilters = DEFAULT_HOME_AUCTION_FILTERS,
  excludeId?: string,
): Promise<TrendingAuction[]> {
  return fetchHomeAuctions(filters, { excludeId, limit: 24 });
}
