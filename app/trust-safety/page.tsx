import Link from "next/link";
import { SiteHeader } from "@/components/layout/site-header";
import {
  BadgeCheck,
  CreditCard,
  FileSearch,
  Gavel,
  Landmark,
  Scale,
  ShieldCheck,
} from "lucide-react";

export const metadata = {
  title: "Trust & Safety | ApexAuction",
  description: "How ApexAuction protects buyers and sellers against automotive fraud.",
};

const trustRails = [
  {
    title: "Vehicle history gate",
    description:
      "VIN submissions can be screened for severe NMVTIS title brands before a listing receives marketplace trust badges.",
    icon: FileSearch,
  },
  {
    title: "Bidder payment gate",
    description:
      "Bidders are required to keep a card on file before placing live bids, reducing non-serious auction activity.",
    icon: CreditCard,
  },
  {
    title: "Identity gate",
    description:
      "Persona verification can be required before bidding or listing, depending on marketplace risk settings.",
    icon: BadgeCheck,
  },
  {
    title: "Escrow close",
    description:
      "Winning buyers are routed to KeySavvy so large vehicle funds and title processing do not rely on informal handoffs.",
    icon: Landmark,
  },
];

export default function TrustSafetyPage() {
  return (
    <div className="flex min-h-full flex-1 flex-col bg-slate-50 text-slate-900">
      <SiteHeader />
      <main className="flex-1">
        <section className="border-b border-slate-200 bg-white">
          <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6 sm:py-14 lg:px-8">
            <p className="text-xs font-medium uppercase tracking-wide text-slate-600">
              Trust &amp; Safety
            </p>
            <h1 className="mt-3 max-w-3xl text-3xl font-semibold tracking-tight text-slate-950 sm:text-4xl">
              A marketplace built around verification, disclosures, and escrow.
            </h1>
            <p className="mt-4 max-w-3xl text-base leading-7 text-slate-600">
              ApexAuction is designed for high-value vehicle transactions where the
              buyer, seller, title, payment method, and post-auction handoff all need
              clear controls.
            </p>
          </div>
        </section>

        <section className="mx-auto max-w-5xl px-4 py-10 sm:px-6 lg:px-8">
          <div className="grid gap-4 sm:grid-cols-2">
            {trustRails.map(({ title, description, icon: Icon }) => (
              <article
                key={title}
                className="rounded-md border border-slate-200 bg-white p-5 shadow-sm"
              >
                <div className="flex size-10 items-center justify-center rounded-md border border-slate-200 bg-slate-50">
                  <Icon className="size-5 text-slate-700" />
                </div>
                <h2 className="mt-4 text-base font-semibold text-slate-900">{title}</h2>
                <p className="mt-2 text-sm leading-6 text-slate-600">{description}</p>
              </article>
            ))}
          </div>

          <div className="mt-8 grid gap-4 lg:grid-cols-2">
            <section className="rounded-md border border-slate-200 bg-white p-6 shadow-sm">
              <div className="flex items-center gap-3">
                <div className="flex size-10 items-center justify-center rounded-md border border-slate-200 bg-slate-50">
                  <Gavel className="size-5 text-slate-700" />
                </div>
                <h2 className="text-lg font-semibold text-slate-900">
                  Auction Integrity
                </h2>
              </div>
              <ul className="mt-5 space-y-3 text-sm leading-6 text-slate-700">
                <li>Minimum bid increments are enforced server-side.</li>
                <li>Sellers cannot bid on their own listings.</li>
                <li>Late bids can extend the auction clock to reduce sniping.</li>
                <li>Admin tools can close listings and review dealer access.</li>
              </ul>
            </section>

            <section className="rounded-md border border-slate-200 bg-white p-6 shadow-sm">
              <div className="flex items-center gap-3">
                <div className="flex size-10 items-center justify-center rounded-md border border-slate-200 bg-slate-50">
                  <Scale className="size-5 text-slate-700" />
                </div>
                <h2 className="text-lg font-semibold text-slate-900">
                  Dealer Disclosure Rules
                </h2>
              </div>
              <p className="mt-5 text-sm leading-6 text-slate-600">
                Dealers remain responsible for required Buyers Guides, warranty
                disclosures, odometer/title statements, state advertising rules, and final
                sale paperwork. The FTC notes that online dealer buyers are entitled to a
                Buyers Guide, and dealer-only auctions can be treated differently from
                consumer-facing sales.
              </p>
              <Link
                href="https://www.ftc.gov/business-guidance/resources/dealers-guide-used-car-rule"
                className="mt-4 inline-flex items-center gap-1 text-sm font-medium text-slate-900 underline-offset-4 hover:underline"
              >
                FTC dealer guide
                <ShieldCheck className="size-4" />
              </Link>
            </section>
          </div>
        </section>
      </main>
    </div>
  );
}
