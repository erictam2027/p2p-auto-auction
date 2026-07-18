import Link from "next/link";
import { redirect } from "next/navigation";
import { SiteHeader } from "@/components/layout/site-header";
import { Button } from "@/components/ui/button";
import { isVerifiedDealer } from "@/lib/auth/profile";
import { createClient } from "@/lib/supabase/server";
import {
  ArrowRight,
  BadgeCheck,
  Banknote,
  CarFront,
  ClipboardCheck,
  FileCheck2,
  Gavel,
  MessageSquareText,
  ShieldCheck,
  UploadCloud,
} from "lucide-react";

export const metadata = {
  title: "Sell Dealer Inventory | ApexAuction",
  description:
    "Advertise verified dealer inventory through online auctions with title checks, bidder gates, Stripe fees, and KeySavvy escrow.",
};

const dealerAdvantages = [
  {
    title: "Verified bidder demand",
    description:
      "Buyers can browse freely, but bidding is gated behind sign-in, card-on-file, and optional identity verification.",
    icon: BadgeCheck,
  },
  {
    title: "Escrow-led close",
    description:
      "Winning buyers are directed into KeySavvy checkout for funds, title handling, and transaction status tracking.",
    icon: ShieldCheck,
  },
  {
    title: "Auction-grade listing packets",
    description:
      "Listings support VIN details, reserve price, disclosures, history links, inspection status, and high-resolution media.",
    icon: FileCheck2,
  },
  {
    title: "Dealer workflow",
    description:
      "Upload a single vehicle, stage a CSV inventory feed, monitor live auctions, respond to buyers, and review payouts.",
    icon: Gavel,
  },
];

const launchSteps = [
  {
    title: "Apply",
    description:
      "Submit dealership name, license number, and a direct verification phone line.",
  },
  {
    title: "List",
    description:
      "Upload inventory with VIN, mileage, photos, reserve, disclosures, and optional vehicle history documents.",
  },
  {
    title: "Run",
    description:
      "Auctions run with live bidding, minimum increments, snipe protection, watchlists, and buyer-to-seller messaging.",
  },
  {
    title: "Close",
    description:
      "The winning bidder pays the platform fee through Stripe and completes vehicle payment through KeySavvy escrow.",
  },
];

const operations = [
  "Single VIN uploads and bulk CSV staging",
  "Dealer dashboard for active listings and bids",
  "Buyer messages, watchlists, and notifications",
  "Admin approval queue and force-close controls",
  "Escrow status and platform-fee tracking",
];

export default async function SellPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("role, verification_status")
      .eq("id", user.id)
      .maybeSingle();

    if (isVerifiedDealer(profile)) {
      redirect("/dashboard/upload");
    }

    if (profile?.role === "dealer") {
      redirect("/dealer-application");
    }
  }

  return (
    <div className="flex min-h-full flex-1 flex-col bg-slate-50 text-slate-900">
      <SiteHeader />

      <main className="flex-1">
        <section className="border-b border-slate-200 bg-white">
          <div className="mx-auto grid max-w-7xl gap-8 px-4 py-10 sm:px-6 sm:py-14 lg:grid-cols-[minmax(0,1.05fr)_minmax(360px,0.95fr)] lg:px-8 lg:py-16">
            <div className="max-w-3xl">
              <p className="text-xs font-medium uppercase tracking-wide text-slate-600">
                Dealer Marketplace
              </p>
              <h1 className="mt-3 max-w-2xl text-3xl font-semibold tracking-tight text-slate-950 sm:text-4xl lg:text-5xl">
                Turn verified inventory into live online auctions.
              </h1>
              <p className="mt-5 max-w-2xl text-base leading-7 text-slate-600">
                ApexAuction gives licensed dealers a clean way to advertise select
                vehicles, collect real bids, and close with payment, title, and escrow
                controls that buyers can understand before they bid.
              </p>

              <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                <Button
                  size="lg"
                  className="h-11 bg-slate-900 px-5 text-white hover:bg-slate-800"
                  nativeButton={false}
                  render={<Link href="/dealer-application" />}
                >
                  Apply as Dealer
                  <ArrowRight className="size-4" />
                </Button>
                <Button
                  variant="outline"
                  size="lg"
                  className="h-11 border-slate-300 bg-white px-5 text-slate-900 hover:bg-slate-50"
                  nativeButton={false}
                  render={<Link href="/browse" />}
                >
                  View Marketplace
                </Button>
              </div>

              <dl className="mt-8 grid gap-3 sm:grid-cols-3">
                <div className="rounded-md border border-slate-200 bg-slate-50 px-4 py-3">
                  <dt className="text-xs font-medium uppercase tracking-wide text-slate-500">
                    Default run
                  </dt>
                  <dd className="mt-1 text-lg font-semibold text-slate-900">7 days</dd>
                </div>
                <div className="rounded-md border border-slate-200 bg-slate-50 px-4 py-3">
                  <dt className="text-xs font-medium uppercase tracking-wide text-slate-500">
                    Platform fee
                  </dt>
                  <dd className="mt-1 text-lg font-semibold text-slate-900">5%</dd>
                </div>
                <div className="rounded-md border border-slate-200 bg-slate-50 px-4 py-3">
                  <dt className="text-xs font-medium uppercase tracking-wide text-slate-500">
                    Close path
                  </dt>
                  <dd className="mt-1 text-lg font-semibold text-slate-900">Escrow</dd>
                </div>
              </dl>
            </div>

            <aside className="rounded-md border border-slate-200 bg-slate-950 p-5 text-white shadow-sm">
              <div className="flex items-center justify-between border-b border-white/10 pb-4">
                <div>
                  <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
                    Dealer Command Center
                  </p>
                  <h2 className="mt-1 text-lg font-semibold">Launch checklist</h2>
                </div>
                <div className="flex size-10 items-center justify-center rounded-md bg-white/10">
                  <CarFront className="size-5 text-white" />
                </div>
              </div>

              <div className="mt-5 grid gap-3">
                {[
                  ["VIN gate", "NMVTIS status reviewed before listing confidence badges appear"],
                  ["Bidder gate", "Card-on-file and optional identity verification before bid entry"],
                  ["Close gate", "Stripe platform fee plus KeySavvy escrow handoff after win"],
                ].map(([label, value]) => (
                  <div
                    key={label}
                    className="rounded-md border border-white/10 bg-white/[0.03] px-4 py-3"
                  >
                    <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
                      {label}
                    </p>
                    <p className="mt-1 text-sm leading-6 text-slate-200">{value}</p>
                  </div>
                ))}
              </div>

              <div className="mt-5 rounded-md border border-emerald-400/30 bg-emerald-400/10 px-4 py-3">
                <div className="flex items-center gap-2 text-sm font-medium text-emerald-100">
                  <Banknote className="size-4" />
                  Buyer funds and title flow through escrow, not an informal handoff.
                </div>
              </div>
            </aside>
          </div>
        </section>

        <section className="border-b border-slate-200 bg-slate-50">
          <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
            <div className="max-w-2xl">
              <p className="text-xs font-medium uppercase tracking-wide text-slate-600">
                Why Dealers Use It
              </p>
              <h2 className="mt-2 text-2xl font-semibold tracking-tight text-slate-900">
                Built around the parts of online wholesale that create trust.
              </h2>
            </div>

            <div className="mt-7 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
              {dealerAdvantages.map(({ title, description, icon: Icon }) => (
                <article
                  key={title}
                  className="rounded-md border border-slate-200 bg-white p-5 shadow-sm"
                >
                  <div className="flex size-10 items-center justify-center rounded-md border border-slate-200 bg-slate-50">
                    <Icon className="size-5 text-slate-700" />
                  </div>
                  <h3 className="mt-4 text-base font-semibold text-slate-900">{title}</h3>
                  <p className="mt-2 text-sm leading-6 text-slate-600">{description}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="border-b border-slate-200 bg-white">
          <div className="mx-auto grid max-w-7xl gap-8 px-4 py-10 sm:px-6 lg:grid-cols-[0.9fr_1.1fr] lg:px-8">
            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-slate-600">
                Launch Flow
              </p>
              <h2 className="mt-2 text-2xl font-semibold tracking-tight text-slate-900">
                From license review to post-auction checkout.
              </h2>
              <p className="mt-3 text-sm leading-6 text-slate-600">
                Dealers get a focused path for publishing inventory while buyers see the
                auction, disclosure, fee, and escrow expectations before committing.
              </p>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              {launchSteps.map((step, index) => (
                <article
                  key={step.title}
                  className="rounded-md border border-slate-200 bg-slate-50 p-5"
                >
                  <div className="flex items-center gap-3">
                    <span className="flex size-8 items-center justify-center rounded-md bg-slate-900 text-sm font-semibold text-white">
                      {index + 1}
                    </span>
                    <h3 className="text-base font-semibold text-slate-900">{step.title}</h3>
                  </div>
                  <p className="mt-3 text-sm leading-6 text-slate-600">
                    {step.description}
                  </p>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="bg-slate-50">
          <div className="mx-auto grid max-w-7xl gap-6 px-4 py-10 sm:px-6 lg:grid-cols-2 lg:px-8">
            <div className="rounded-md border border-slate-200 bg-white p-6 shadow-sm">
              <div className="flex items-start gap-3">
                <div className="flex size-10 shrink-0 items-center justify-center rounded-md border border-slate-200 bg-slate-50">
                  <UploadCloud className="size-5 text-slate-700" />
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-slate-900">
                    What is ready to advertise
                  </h2>
                  <p className="mt-1 text-sm leading-6 text-slate-600">
                    The current product supports the core marketplace workflow dealers
                    need before outreach begins.
                  </p>
                </div>
              </div>
              <ul className="mt-5 space-y-3">
                {operations.map((item) => (
                  <li key={item} className="flex gap-3 text-sm text-slate-700">
                    <ClipboardCheck className="mt-0.5 size-4 shrink-0 text-emerald-700" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="rounded-md border border-slate-200 bg-white p-6 shadow-sm">
              <div className="flex items-start gap-3">
                <div className="flex size-10 shrink-0 items-center justify-center rounded-md border border-slate-200 bg-slate-50">
                  <MessageSquareText className="size-5 text-slate-700" />
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-slate-900">
                    Dealer compliance note
                  </h2>
                  <p className="mt-1 text-sm leading-6 text-slate-600">
                    Dealers remain responsible for federal and state disclosures,
                    including required Buyers Guides, warranty terms, odometer/title
                    disclosures, and any state-specific advertising rules.
                  </p>
                </div>
              </div>
              <div className="mt-5 rounded-md border border-amber-200 bg-amber-50 px-4 py-3 text-sm leading-6 text-amber-900">
                Auctions that are open to consumers should be treated differently from
                dealer-only wholesale channels. Keep listing terms, warranty status, and
                escrow responsibilities explicit before launch.
              </div>
            </div>
          </div>
        </section>
      </main>

      <footer className="mt-auto w-full border-t border-slate-200 bg-white">
        <div className="mx-auto flex max-w-7xl flex-col gap-4 px-4 py-8 sm:flex-row sm:items-center sm:justify-between sm:px-6 lg:px-8">
          <p className="text-sm text-slate-600">
            Ready to list inventory?{" "}
            <Link
              href="/dealer-application"
              className="font-medium text-slate-900 underline-offset-4 hover:underline"
            >
              Start dealer verification
            </Link>
          </p>
          <p className="text-xs text-slate-600">
            NMVTIS / Stripe / KeySavvy / Lemon Squad ready
          </p>
        </div>
      </footer>
    </div>
  );
}
