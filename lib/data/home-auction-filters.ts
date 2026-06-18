export const HOME_PRICE_MIN = 0;
export const HOME_PRICE_MAX = 200_000;
export const HOME_PRICE_STEP = 5_000;

export type HomeAuctionFilters = {
  search: string;
  transmission: "" | "Manual" | "Automatic";
  minPrice: number;
  maxPrice: number;
};

export const DEFAULT_HOME_AUCTION_FILTERS: HomeAuctionFilters = {
  search: "",
  transmission: "",
  minPrice: HOME_PRICE_MIN,
  maxPrice: HOME_PRICE_MAX,
};

export function parseHomeAuctionFiltersFromSearchParams(
  searchParams: Record<string, string | string[] | undefined>,
): HomeAuctionFilters {
  const readParam = (key: string) => {
    const value = searchParams[key];
    return typeof value === "string" ? value : "";
  };

  const minPrice = Number(readParam("minPrice"));
  const maxPrice = Number(readParam("maxPrice"));
  const transmission = readParam("transmission");

  return {
    search: readParam("search"),
    transmission:
      transmission === "Manual" || transmission === "Automatic" ? transmission : "",
    minPrice: Number.isFinite(minPrice) ? minPrice : HOME_PRICE_MIN,
    maxPrice: Number.isFinite(maxPrice) ? maxPrice : HOME_PRICE_MAX,
  };
}
