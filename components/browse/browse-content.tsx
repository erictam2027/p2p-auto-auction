"use client";

import { AuctionCard } from "@/components/auctions/auction-card";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import {
  BROWSE_YEAR_MAX,
  BROWSE_YEAR_MIN,
  browseAuctions,
  getModelsForMake,
  getUniqueMakes,
  parseEndsInMinutes,
} from "@/lib/data/browse-auctions";
import type { TrendingAuction } from "@/lib/data/trending-auctions";
import { cn } from "@/lib/utils";
import { SlidersHorizontal } from "lucide-react";
import { useMemo, useState } from "react";

type SortOption = "ending-soonest" | "lowest-mileage" | "highest-bid";

type FilterState = {
  search: string;
  make: string;
  model: string;
  yearMin: number;
  yearMax: number;
  nmvtisCleanTitle: boolean;
  dealerCertified: boolean;
};

const DEFAULT_FILTERS: FilterState = {
  search: "",
  make: "",
  model: "",
  yearMin: BROWSE_YEAR_MIN,
  yearMax: BROWSE_YEAR_MAX,
  nmvtisCleanTitle: false,
  dealerCertified: false,
};

const SORT_LABELS: Record<SortOption, string> = {
  "ending-soonest": "Ending Soonest",
  "lowest-mileage": "Lowest Mileage",
  "highest-bid": "Highest Bid",
};

function sortAuctions(
  auctions: TrendingAuction[],
  sort: SortOption,
): TrendingAuction[] {
  const sorted = [...auctions];

  switch (sort) {
    case "ending-soonest":
      return sorted.sort(
        (a, b) =>
          parseEndsInMinutes(a.endsIn) - parseEndsInMinutes(b.endsIn),
      );
    case "lowest-mileage":
      return sorted.sort((a, b) => a.mileage - b.mileage);
    case "highest-bid":
      return sorted.sort((a, b) => b.currentBidCents - a.currentBidCents);
    default:
      return sorted;
  }
}

function filterAuctions(
  auctions: TrendingAuction[],
  filters: FilterState,
): TrendingAuction[] {
  const query = filters.search.trim().toLowerCase();

  return auctions.filter((auction) => {
    if (filters.make && auction.make !== filters.make) return false;
    if (filters.model && auction.model !== filters.model) return false;
    if (auction.year < filters.yearMin || auction.year > filters.yearMax) {
      return false;
    }
    if (filters.nmvtisCleanTitle && !auction.nmvtisVerified) return false;
    if (filters.dealerCertified && !auction.inspectionAvailable) return false;

    if (query) {
      const haystack = [
        auction.make,
        auction.model,
        auction.trim,
        auction.location,
        String(auction.year),
      ]
        .join(" ")
        .toLowerCase();
      if (!haystack.includes(query)) return false;
    }

    return true;
  });
}

const selectClassName =
  "h-10 w-full rounded-md border border-slate-300 bg-white px-3 text-sm text-slate-900 focus:border-slate-400 focus:outline-none focus:ring-1 focus:ring-slate-400";

type FilterSidebarProps = {
  filters: FilterState;
  makes: string[];
  models: string[];
  onFiltersChange: (filters: FilterState) => void;
  onReset: () => void;
  className?: string;
};

function FilterSidebar({
  filters,
  makes,
  models,
  onFiltersChange,
  onReset,
  className,
}: FilterSidebarProps) {
  function update<K extends keyof FilterState>(key: K, value: FilterState[K]) {
    onFiltersChange({ ...filters, [key]: value });
  }

  return (
    <aside className={cn("space-y-6", className)}>
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold text-slate-900">Advanced Filters</h2>
        <button
          type="button"
          onClick={onReset}
          className="text-xs font-medium text-slate-600 hover:text-slate-900"
        >
          Reset all
        </button>
      </div>

      <div className="space-y-2">
        <label htmlFor="browse-search" className="text-sm font-medium text-slate-900">
          Search
        </label>
        <Input
          id="browse-search"
          type="search"
          value={filters.search}
          onChange={(e) => update("search", e.target.value)}
          placeholder="Make, model, location..."
          className="h-10 border-slate-300 bg-white text-slate-900"
        />
      </div>

      <div className="space-y-2">
        <label htmlFor="browse-make" className="text-sm font-medium text-slate-900">
          Make
        </label>
        <select
          id="browse-make"
          value={filters.make}
          onChange={(e) =>
            onFiltersChange({ ...filters, make: e.target.value, model: "" })
          }
          className={selectClassName}
        >
          <option value="">All Makes</option>
          {makes.map((make) => (
            <option key={make} value={make}>
              {make}
            </option>
          ))}
        </select>
      </div>

      <div className="space-y-2">
        <label htmlFor="browse-model" className="text-sm font-medium text-slate-900">
          Model
        </label>
        <select
          id="browse-model"
          value={filters.model}
          onChange={(e) => update("model", e.target.value)}
          className={selectClassName}
          disabled={models.length === 0}
        >
          <option value="">All Models</option>
          {models.map((model) => (
            <option key={model} value={model}>
              {model}
            </option>
          ))}
        </select>
      </div>

      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <p className="text-sm font-medium text-slate-900">Year range</p>
          <p className="text-xs text-slate-600">
            {filters.yearMin} – {filters.yearMax}
          </p>
        </div>
        <div className="space-y-4">
          <div className="space-y-1.5">
            <label htmlFor="year-min" className="text-xs text-slate-600">
              Minimum year
            </label>
            <input
              id="year-min"
              type="range"
              min={BROWSE_YEAR_MIN}
              max={BROWSE_YEAR_MAX}
              value={filters.yearMin}
              onChange={(e) => {
                const nextMin = Number(e.target.value);
                onFiltersChange({
                  ...filters,
                  yearMin: Math.min(nextMin, filters.yearMax),
                });
              }}
              className="w-full accent-slate-900"
            />
          </div>
          <div className="space-y-1.5">
            <label htmlFor="year-max" className="text-xs text-slate-600">
              Maximum year
            </label>
            <input
              id="year-max"
              type="range"
              min={BROWSE_YEAR_MIN}
              max={BROWSE_YEAR_MAX}
              value={filters.yearMax}
              onChange={(e) => {
                const nextMax = Number(e.target.value);
                onFiltersChange({
                  ...filters,
                  yearMax: Math.max(nextMax, filters.yearMin),
                });
              }}
              className="w-full accent-slate-900"
            />
          </div>
        </div>
      </div>

      <div className="space-y-3 border-t border-slate-200 pt-4">
        <p className="text-sm font-medium text-slate-900">Trust filters</p>
        <label className="flex cursor-pointer items-start gap-3">
          <input
            type="checkbox"
            checked={filters.nmvtisCleanTitle}
            onChange={(e) => update("nmvtisCleanTitle", e.target.checked)}
            className="mt-0.5 size-4 rounded border-slate-300 text-slate-900 focus:ring-slate-400"
          />
          <span>
            <span className="block text-sm text-slate-900">Clean Title Verified</span>
            <span className="block text-xs text-slate-600">
              NMVTIS title history with no salvage, flood, or total-loss brands
            </span>
          </span>
        </label>
        <label className="flex cursor-pointer items-start gap-3">
          <input
            type="checkbox"
            checked={filters.dealerCertified}
            onChange={(e) => update("dealerCertified", e.target.checked)}
            className="mt-0.5 size-4 rounded border-slate-300 text-slate-900 focus:ring-slate-400"
          />
          <span>
            <span className="block text-sm text-slate-900">Dealer Certified</span>
            <span className="block text-xs text-slate-600">
              Pre-listing inspection completed by a verified dealer partner
            </span>
          </span>
        </label>
      </div>
    </aside>
  );
}

export function BrowseContent() {
  const [filters, setFilters] = useState<FilterState>(DEFAULT_FILTERS);
  const [sort, setSort] = useState<SortOption>("ending-soonest");
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);

  const makes = useMemo(() => getUniqueMakes(browseAuctions), []);
  const models = useMemo(
    () => getModelsForMake(browseAuctions, filters.make),
    [filters.make],
  );

  const filteredAuctions = useMemo(() => {
    const filtered = filterAuctions(browseAuctions, filters);
    return sortAuctions(filtered, sort);
  }, [filters, sort]);

  function handleReset() {
    setFilters(DEFAULT_FILTERS);
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">Browse Auctions</h1>
          <p className="mt-1 text-sm text-slate-600">
            Search live inventory with verified title and dealer certification filters.
          </p>
        </div>

        <Dialog open={mobileFiltersOpen} onOpenChange={setMobileFiltersOpen}>
          <DialogTrigger
            render={
              <Button
                variant="outline"
                className="border-slate-300 bg-white text-slate-900 hover:bg-slate-50 lg:hidden"
              />
            }
          >
            <SlidersHorizontal className="size-4" />
            Advanced Filters
          </DialogTrigger>
          <DialogContent className="max-h-[85vh] overflow-y-auto border-slate-200 bg-white sm:max-w-md">
            <DialogHeader>
              <DialogTitle className="text-slate-900">Advanced Filters</DialogTitle>
            </DialogHeader>
            <FilterSidebar
              filters={filters}
              makes={makes}
              models={models}
              onFiltersChange={setFilters}
              onReset={handleReset}
            />
            <Button
              className="w-full bg-slate-900 text-white hover:bg-slate-800"
              onClick={() => setMobileFiltersOpen(false)}
            >
              Show {filteredAuctions.length} results
            </Button>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-8 lg:grid-cols-4">
        <div className="hidden lg:col-span-1 lg:block">
          <div className="sticky top-20 rounded-md border border-slate-200 bg-white p-5 shadow-sm">
            <FilterSidebar
              filters={filters}
              makes={makes}
              models={models}
              onFiltersChange={setFilters}
              onReset={handleReset}
            />
          </div>
        </div>

        <div className="min-w-0 lg:col-span-3">
          <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm text-slate-600">
              {filteredAuctions.length} listing
              {filteredAuctions.length === 1 ? "" : "s"} available
            </p>

            <div className="flex items-center gap-2 sm:justify-end">
              <label htmlFor="sort-by" className="text-sm text-slate-600">
                Sort by
              </label>
              <select
                id="sort-by"
                value={sort}
                onChange={(e) => setSort(e.target.value as SortOption)}
                className={cn(selectClassName, "w-auto min-w-[180px]")}
              >
                {(Object.keys(SORT_LABELS) as SortOption[]).map((option) => (
                  <option key={option} value={option}>
                    {SORT_LABELS[option]}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {filteredAuctions.length > 0 ? (
            <div className="grid gap-4 sm:grid-cols-2 sm:gap-5 xl:grid-cols-3">
              {filteredAuctions.map((auction) => (
                <AuctionCard key={auction.id} auction={auction} />
              ))}
            </div>
          ) : (
            <div className="rounded-md border border-slate-200 bg-white p-12 text-center shadow-sm">
              <p className="text-sm font-medium text-slate-900">No auctions match your filters</p>
              <p className="mt-1 text-sm text-slate-600">
                Try adjusting your search criteria or reset all filters.
              </p>
              <Button
                variant="outline"
                className="mt-4 border-slate-300 bg-white text-slate-900 hover:bg-slate-50"
                onClick={handleReset}
              >
                Reset filters
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
