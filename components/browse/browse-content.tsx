"use client";

import { BrowseAuctionCard } from "@/components/browse/browse-auction-card";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Slider } from "@/components/ui/slider";
import {
  BROWSE_PRICE_MAX,
  BROWSE_PRICE_MIN,
  BROWSE_PRICE_STEP,
  getModelsForMake,
  getUniqueMakes,
} from "@/lib/data/browse-auctions";
import type { TrendingAuction } from "@/lib/data/trending-auctions";
import {
  filterBrowseAuctions,
  hasActiveBrowseFilters,
  sortBrowseAuctions,
  type BrowseFilterState,
  type BrowseSortOption,
} from "@/lib/utils/filter-browse-auctions";
import { formatCurrency } from "@/lib/utils/format";
import { cn } from "@/lib/utils";
import { SlidersHorizontal, X } from "lucide-react";
import { useMemo, useState } from "react";

const DEFAULT_FILTERS: BrowseFilterState = {
  search: "",
  make: "",
  model: "",
  maxPrice: BROWSE_PRICE_MAX,
  cleanTitle: false,
  dealerCertified: false,
};

const SORT_LABELS: Record<BrowseSortOption, string> = {
  "ending-soonest": "Ending Soonest",
  "lowest-mileage": "Lowest Mileage",
  "highest-bid": "Highest Bid",
};

const selectClassName =
  "h-10 w-full rounded-md border border-slate-300 bg-white px-3 text-sm text-slate-900 focus:border-slate-400 focus:outline-none focus:ring-1 focus:ring-slate-400";

type FilterSidebarProps = {
  filters: BrowseFilterState;
  makes: string[];
  models: string[];
  onFiltersChange: (filters: BrowseFilterState) => void;
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
  function update<K extends keyof BrowseFilterState>(
    key: K,
    value: BrowseFilterState[K],
  ) {
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
          <label htmlFor="max-price" className="text-sm font-medium text-slate-900">
            Max Price
          </label>
          <span className="text-xs font-medium text-slate-600">
            Up to {formatCurrency(filters.maxPrice * 100)}
          </span>
        </div>
        <Slider
          id="max-price"
          min={BROWSE_PRICE_MIN}
          max={BROWSE_PRICE_MAX}
          step={BROWSE_PRICE_STEP}
          value={[filters.maxPrice]}
          onValueChange={(value) => {
            const next = Array.isArray(value) ? value[0] : value;
            update("maxPrice", next);
          }}
        />
        <div className="flex justify-between text-xs text-slate-500">
          <span>{formatCurrency(BROWSE_PRICE_MIN * 100)}</span>
          <span>{formatCurrency(BROWSE_PRICE_MAX * 100)}</span>
        </div>
      </div>

      <div className="space-y-3 border-t border-slate-200 pt-4">
        <label className="flex cursor-pointer items-center gap-3">
          <input
            type="checkbox"
            checked={filters.cleanTitle}
            onChange={(e) => update("cleanTitle", e.target.checked)}
            className="size-4 rounded border-slate-300 text-slate-900 focus:ring-slate-400"
          />
          <span className="text-sm text-slate-900">Clean Title</span>
        </label>
        <label className="flex cursor-pointer items-center gap-3">
          <input
            type="checkbox"
            checked={filters.dealerCertified}
            onChange={(e) => update("dealerCertified", e.target.checked)}
            className="size-4 rounded border-slate-300 text-slate-900 focus:ring-slate-400"
          />
          <span className="text-sm text-slate-900">Dealer Certified</span>
        </label>
      </div>
    </aside>
  );
}

export function BrowseContent({
  initialAuctions,
  initialSearch = "",
}: {
  initialAuctions: TrendingAuction[];
  initialSearch?: string;
}) {
  const [filters, setFilters] = useState<BrowseFilterState>({
    ...DEFAULT_FILTERS,
    search: initialSearch,
  });
  const [sort, setSort] = useState<BrowseSortOption>("ending-soonest");
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);

  const makes = useMemo(() => getUniqueMakes(initialAuctions), [initialAuctions]);
  const models = useMemo(
    () => getModelsForMake(initialAuctions, filters.make),
    [initialAuctions, filters.make],
  );

  const filteredAuctions = useMemo(() => {
    const filtered = filterBrowseAuctions(initialAuctions, filters);
    return sortBrowseAuctions(filtered, sort);
  }, [initialAuctions, filters, sort]);

  const filtersActive = hasActiveBrowseFilters(filters, BROWSE_PRICE_MAX);

  function handleReset() {
    setFilters(DEFAULT_FILTERS);
  }

  function clearFilter(key: keyof BrowseFilterState) {
    setFilters((current) => {
      switch (key) {
        case "search":
          return { ...current, search: "" };
        case "make":
          return { ...current, make: "", model: "" };
        case "model":
          return { ...current, model: "" };
        case "maxPrice":
          return { ...current, maxPrice: BROWSE_PRICE_MAX };
        case "cleanTitle":
          return { ...current, cleanTitle: false };
        case "dealerCertified":
          return { ...current, dealerCertified: false };
        default:
          return current;
      }
    });
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
            <div className="space-y-2">
              <p className="text-sm text-slate-600">
                {filteredAuctions.length} of {initialAuctions.length} listing
                {filteredAuctions.length === 1 ? "" : "s"} shown
              </p>
              {filtersActive ? (
                <div className="flex flex-wrap items-center gap-2">
                  {filters.search ? (
                    <button
                      type="button"
                      onClick={() => clearFilter("search")}
                      className="inline-flex items-center gap-1 rounded-full border border-slate-200 bg-white px-2.5 py-1 text-xs text-slate-700 hover:bg-slate-50"
                    >
                      Search: {filters.search}
                      <X className="size-3" />
                    </button>
                  ) : null}
                  {filters.make ? (
                    <button
                      type="button"
                      onClick={() => clearFilter("make")}
                      className="inline-flex items-center gap-1 rounded-full border border-slate-200 bg-white px-2.5 py-1 text-xs text-slate-700 hover:bg-slate-50"
                    >
                      Make: {filters.make}
                      <X className="size-3" />
                    </button>
                  ) : null}
                  {filters.model ? (
                    <button
                      type="button"
                      onClick={() => clearFilter("model")}
                      className="inline-flex items-center gap-1 rounded-full border border-slate-200 bg-white px-2.5 py-1 text-xs text-slate-700 hover:bg-slate-50"
                    >
                      Model: {filters.model}
                      <X className="size-3" />
                    </button>
                  ) : null}
                </div>
              ) : null}
            </div>

            <div className="flex items-center gap-2 sm:justify-end">
              <label htmlFor="sort-by" className="text-sm text-slate-600">
                Sort by
              </label>
              <select
                id="sort-by"
                value={sort}
                onChange={(e) => setSort(e.target.value as BrowseSortOption)}
                className={cn(selectClassName, "w-auto min-w-[180px]")}
              >
                {(Object.keys(SORT_LABELS) as BrowseSortOption[]).map((option) => (
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
                <BrowseAuctionCard key={auction.id} auction={auction} />
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
