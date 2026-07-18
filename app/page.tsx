import Link from "next/link";
import { Suspense } from "react";
import { CountdownTimer } from "@/components/auctions/CountdownTimer";
import { HomeAuctionGrid } from "@/components/auctions/home-auction-grid";
import { SeedTestVehicleButton } from "@/components/dev/seed-test-vehicle-button";
import { SiteHeader } from "@/components/layout/site-header";
import { MarketplaceSignup } from "@/components/marketing/marketplace-signup";
import { TrustBadgeGroup } from "@/components/trust/trust-badge";
import { Button } from "@/components/ui/button";
import {
  fetchHomeAuctions,
  getFeaturedAuction,
} from "@/lib/data/home-auctions";
import { parseHomeAuctionFiltersFromSearchParams } from "@/lib/data/home-auction-filters";
import { formatCurrency, formatMileage } from "@/lib/utils/format";
import { ArrowRight, MapPin } from "lucide-react";

type HomePageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export default async function Home({ searchParams }: HomePageProps) {
  const params = await searchParams;
  const filters = parseHomeAuctionFiltersFromSearchParams(params);
  const featuredVehicle = await getFeaturedAuction();
  const closingSoonVehicles = await fetchHomeAuctions(filters, {
    excludeId: featuredVehicle?.id,
    limit: 24,
  });
  const featuredTitle = featuredVehicle
    ? `${featuredVehicle.year} ${featuredVehicle.make} ${featuredVehicle.model}`
    : "";

  return (
    <div className="flex min-h-full flex-1 flex-col bg-slate-50 text-slate-900">
      <SiteHeader />
      {process.env.NODE_ENV === "development" ? <SeedTestVehicleButton /> : null}

      <main className="flex-1">
        {featuredVehicle ? (
          <section className="border-b border-slate-200 bg-white">
            <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 sm:py-10 lg:px-8 lg:py-12">
              <p className="text-xs font-medium uppercase tracking-wide text-slate-600">
                Featured Auction
              </p>

              <div className="mt-6 grid gap-8 lg:grid-cols-2 lg:items-start lg:gap-12">
                <Link
                  href={`/auctions/${featuredVehicle.id}`}
                  className="group block overflow-hidden rounded-md border border-slate-200 bg-slate-100"
                >
                  <div className="aspect-[4/3] overflow-hidden">
                    {featuredVehicle.imageUrl ? (
                      <div
                        aria-label={featuredTitle}
                        role="img"
                        className="h-full w-full bg-cover bg-center transition-transform duration-500 group-hover:scale-105"
                        style={{ backgroundImage: `url(${featuredVehicle.imageUrl})` }}
                      />
                    ) : (
                      <div className="flex h-full flex-col items-center justify-center gap-3 p-8">
                        <svg
                          viewBox="0 0 200 80"
                          className="h-14 w-36 text-slate-300"
                          fill="currentColor"
                          aria-hidden
                        >
                          <path d="M12 52h14l6-18h96l6 18h14l-10-28H22L12 52zm22-12h112l-4-12H38l-4 12z" />
                          <circle cx="44" cy="58" r="10" />
                          <circle cx="156" cy="58" r="10" />
                        </svg>
                        <p className="text-sm text-slate-600">Featured vehicle photo</p>
                      </div>
                    )}
                  </div>
                </Link>

                <div className="flex flex-col gap-6">
                  <div>
                    <h1 className="text-2xl font-semibold tracking-tight text-slate-900 sm:text-3xl">
                      {featuredTitle}
                    </h1>
                    <p className="mt-1 text-lg text-slate-600">{featuredVehicle.trim}</p>
                    <p className="mt-4 text-sm leading-relaxed text-slate-600">
                      Licensed-dealer escrow, federal title verification, and structured
                      seller disclosures on every listing.
                    </p>
                  </div>

                  <dl className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-2">
                    <div className="rounded-md border border-slate-200 bg-white px-4 py-3">
                      <dt className="text-xs text-slate-600">Current bid</dt>
                      <dd className="mt-1 text-lg font-semibold text-slate-900">
                        {formatCurrency(featuredVehicle.currentBidCents)}
                      </dd>
                    </div>
                    <div className="rounded-md border border-slate-200 bg-white px-4 py-3">
                      <dt className="text-xs text-slate-600">Active bids</dt>
                      <dd className="mt-1 text-lg font-semibold text-slate-900">
                        {featuredVehicle.bidCount}
                      </dd>
                    </div>
                    <div className="rounded-md border border-slate-200 bg-white px-4 py-3">
                      <dt className="text-xs text-slate-600">Mileage</dt>
                      <dd className="mt-1 text-lg font-semibold text-slate-900">
                        {formatMileage(featuredVehicle.mileage)} mi
                      </dd>
                    </div>
                    <div className="rounded-md border border-slate-200 bg-white px-4 py-3">
                      <dt className="text-xs text-slate-600">Time remaining</dt>
                      <dd className="mt-1 flex items-center gap-2 text-lg font-semibold text-slate-900">
                        {featuredVehicle.endTime ? (
                          <>
                            <span
                              className="size-2 animate-pulse rounded-full bg-red-500"
                              aria-hidden
                            />
                            <CountdownTimer
                              endTime={featuredVehicle.endTime}
                              className="text-lg font-semibold"
                            />
                          </>
                        ) : (
                          "Ended"
                        )}
                      </dd>
                    </div>
                  </dl>

                  <div className="flex items-center gap-1.5 text-sm text-slate-600">
                    <MapPin className="size-4 shrink-0 text-slate-500" />
                    {featuredVehicle.location}
                  </div>

                  <TrustBadgeGroup
                    nmvtisVerified={featuredVehicle.nmvtisVerified}
                    inspectionAvailable={featuredVehicle.inspectionAvailable}
                  />

                  <div className="flex flex-col gap-3 border-t border-slate-200 pt-6 sm:flex-row">
                    <Link href={`/auctions/${featuredVehicle.id}`}>
                      <Button
                        size="lg"
                        className="h-11 w-full bg-slate-900 px-6 text-white hover:bg-slate-800 sm:w-auto"
                      >
                        Place Bid
                      </Button>
                    </Link>
                    <Link href={`/auctions/${featuredVehicle.id}`}>
                      <Button
                        variant="outline"
                        size="lg"
                        className="h-11 w-full border-slate-300 bg-white px-6 text-slate-900 hover:bg-slate-50 sm:w-auto"
                      >
                        View Listing
                      </Button>
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          </section>
        ) : null}

        <section className="border-b border-slate-200 bg-white">
          <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-center gap-6 px-4 py-4 sm:px-6 lg:px-8">
            <p className="text-xs font-medium uppercase tracking-wide text-slate-600">
              Verified marketplace
            </p>
            <TrustBadgeGroup nmvtisVerified inspectionAvailable />
          </div>
        </section>

        <section className="mx-auto max-w-7xl px-4 py-10 sm:px-6 sm:py-12 lg:px-8">
          <div className="flex flex-col gap-3 border-b border-slate-200 pb-6 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h2 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
                Closing Soon
              </h2>
              <p className="mt-2 text-sm text-slate-600">
                Live auctions ending soonest — bid before the hammer drops.
              </p>
            </div>
            <Link
              href="/browse"
              className="inline-flex items-center gap-1 text-sm font-medium text-slate-900 underline-offset-4 hover:underline"
            >
              View all auctions
              <ArrowRight className="size-4" />
            </Link>
          </div>

          <div className="mt-8">
            <Suspense
              fallback={
                <div className="rounded-md border border-slate-200 bg-white px-6 py-12 text-center text-sm text-slate-600 shadow-sm">
                  Loading listings…
                </div>
              }
            >
              <HomeAuctionGrid
                initialAuctions={closingSoonVehicles}
                excludeId={featuredVehicle?.id}
                initialFilters={filters}
              />
            </Suspense>
          </div>
        </section>
      </main>

      <MarketplaceSignup />

      <footer className="mt-auto border-t border-slate-200 bg-white">
        <div className="mx-auto flex max-w-7xl flex-col gap-4 px-4 py-8 sm:flex-row sm:items-center sm:justify-between sm:px-6 lg:px-8">
          <p className="text-sm text-slate-600">
            © {new Date().getFullYear()} ApexAuction. Escrow via KeySavvy. Titles verified via NMVTIS.
          </p>
          <div className="flex gap-6 text-sm text-slate-600">
            <Link href="/privacy" className="hover:text-slate-900">
              Privacy
            </Link>
            <Link href="/terms" className="hover:text-slate-900">
              Terms
            </Link>
            <Link href="/trust-safety" className="hover:text-slate-900">
              Trust & Safety
            </Link>
            <Link href="/contact" className="hover:text-slate-900">
              Contact
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
