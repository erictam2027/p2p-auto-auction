"use client";

import { searchHomeAuctions } from "@/app/actions/home-auctions";
import { AuctionCard } from "@/components/auctions/auction-card";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import {
  DEFAULT_HOME_AUCTION_FILTERS,
  HOME_PRICE_MAX,
  HOME_PRICE_MIN,
  HOME_PRICE_STEP,
  type HomeAuctionFilters,
} from "@/lib/data/home-auction-filters";
import type { TrendingAuction } from "@/lib/data/trending-auctions";
import { formatCurrency } from "@/lib/utils/format";
import { Loader2, Search, X } from "lucide-react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState, useTransition } from "react";

type HomeAuctionGridProps = {
  initialAuctions: TrendingAuction[];
  excludeId?: string;
  initialFilters?: HomeAuctionFilters;
};

function filtersFromSearchParams(searchParams: URLSearchParams): HomeAuctionFilters {
  const minPrice = Number(searchParams.get("minPrice"));
  const maxPrice = Number(searchParams.get("maxPrice"));
  const transmission = searchParams.get("transmission") ?? "";

  return {
    search: searchParams.get("search") ?? "",
    transmission:
      transmission === "Manual" || transmission === "Automatic" ? transmission : "",
    minPrice: Number.isFinite(minPrice) ? minPrice : HOME_PRICE_MIN,
    maxPrice: Number.isFinite(maxPrice) ? maxPrice : HOME_PRICE_MAX,
  };
}

function buildSearchParams(filters: HomeAuctionFilters) {
  const params = new URLSearchParams();

  if (filters.search.trim()) {
    params.set("search", filters.search.trim());
  }

  if (filters.transmission) {
    params.set("transmission", filters.transmission);
  }

  if (filters.minPrice > HOME_PRICE_MIN) {
    params.set("minPrice", String(filters.minPrice));
  }

  if (filters.maxPrice < HOME_PRICE_MAX) {
    params.set("maxPrice", String(filters.maxPrice));
  }

  return params;
}

function hasActiveFilters(filters: HomeAuctionFilters) {
  return (
    filters.search.trim().length > 0 ||
    filters.transmission !== "" ||
    filters.minPrice > HOME_PRICE_MIN ||
    filters.maxPrice < HOME_PRICE_MAX
  );
}

export function HomeAuctionGrid({
  initialAuctions,
  excludeId,
  initialFilters = DEFAULT_HOME_AUCTION_FILTERS,
}: HomeAuctionGridProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const [filters, setFilters] = useState<HomeAuctionFilters>(() =>
    searchParams.size > 0 ? filtersFromSearchParams(searchParams) : initialFilters,
  );
  const [auctions, setAuctions] = useState(initialAuctions);
  const [isPending, startTransition] = useTransition();

  const filtersActive = useMemo(() => hasActiveFilters(filters), [filters]);
  const priceRange: [number, number] = [filters.minPrice, filters.maxPrice];

  useEffect(() => {
    const nextParams = buildSearchParams(filters);
    const query = nextParams.toString();
    const nextUrl = query ? `${pathname}?${query}` : pathname;

    router.replace(nextUrl, { scroll: false });

    const timer = window.setTimeout(() => {
      startTransition(async () => {
        const results = await searchHomeAuctions(filters, excludeId);
        setAuctions(results);
      });
    }, 250);

    return () => window.clearTimeout(timer);
  }, [filters, excludeId, pathname, router]);

  function updateFilters(next: HomeAuctionFilters) {
    setFilters(next);
  }

  function handleResetFilters() {
    updateFilters({ ...DEFAULT_HOME_AUCTION_FILTERS });
  }

  return (
    <div className="space-y-6">
      <div className="rounded-md border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div className="grid flex-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
            <div className="space-y-2 sm:col-span-2 xl:col-span-1">
              <label htmlFor="home-search" className="text-sm font-medium text-slate-900">
                Search
              </label>
              <div className="relative">
                <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
                <Input
                  id="home-search"
                  value={filters.search}
                  onChange={(event) =>
                    updateFilters({ ...filters, search: event.target.value })
                  }
                  placeholder="Make, model, or VIN"
                  className="h-10 border-slate-300 bg-white pl-10 text-slate-900"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label htmlFor="home-transmission" className="text-sm font-medium text-slate-900">
                Transmission
              </label>
              <Select
                id="home-transmission"
                value={filters.transmission}
                onChange={(event) =>
                  updateFilters({
                    ...filters,
                    transmission: event.target.value as HomeAuctionFilters["transmission"],
                  })
                }
              >
                <option value="">Any transmission</option>
                <option value="Manual">Manual</option>
                <option value="Automatic">Automatic</option>
              </Select>
            </div>

            <div className="space-y-3 sm:col-span-2 xl:col-span-1">
              <div className="flex items-center justify-between gap-3">
                <label htmlFor="home-price-range" className="text-sm font-medium text-slate-900">
                  Price range
                </label>
                <p className="text-xs text-slate-600">
                  {formatCurrency(priceRange[0] * 100)} –{" "}
                  {formatCurrency(priceRange[1] * 100)}
                </p>
              </div>
              <Slider
                id="home-price-range"
                min={HOME_PRICE_MIN}
                max={HOME_PRICE_MAX}
                step={HOME_PRICE_STEP}
                value={priceRange}
                onValueChange={(value) => {
                  if (!Array.isArray(value) || value.length < 2) {
                    return;
                  }

                  updateFilters({
                    ...filters,
                    minPrice: value[0],
                    maxPrice: value[1],
                  });
                }}
              />
            </div>
          </div>

          {filtersActive ? (
            <button
              type="button"
              onClick={handleResetFilters}
              className="inline-flex h-10 items-center gap-2 rounded-md border border-slate-300 bg-white px-3 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50"
            >
              <X className="size-4" />
              Clear filters
            </button>
          ) : null}
        </div>
      </div>

      {isPending ? (
        <div className="flex items-center justify-center py-8 text-sm text-slate-600">
          <Loader2 className="mr-2 size-4 animate-spin" />
          Updating results…
        </div>
      ) : null}

      {auctions.length > 0 ? (
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          {auctions.map((auction) => (
            <AuctionCard key={auction.id} auction={auction} />
          ))}
        </div>
      ) : (
        <div className="rounded-md border border-dashed border-slate-300 bg-white px-6 py-12 text-center shadow-sm">
          <p className="text-sm font-medium text-slate-900">No listings match your filters.</p>
          <p className="mt-2 text-sm text-slate-600">
            Try widening your price range or clearing the search terms.
          </p>
        </div>
      )}
    </div>
  );
}
