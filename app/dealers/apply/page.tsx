import Link from "next/link";
import { DealerApplicationForm } from "@/components/dealers/dealer-application-form";
import { SiteHeader } from "@/components/layout/site-header";
import { Badge } from "@/components/ui/badge";
import { Globe, TrendingUp } from "lucide-react";

export const metadata = {
  title: "Dealer Partner Application | ApexAuction",
  description:
    "Apply to syndicate your licensed dealership inventory on ApexAuction. Access national retail buyers and achieve higher margins than traditional wholesale channels.",
};

const VALUE_PROPS = [
  {
    icon: Globe,
    title: "Access to National Retail Buyers",
    description:
      "Syndicate your inventory to a verified nationwide audience of retail buyers. Expand beyond local lot traffic and regional wholesale lanes with escrow-secured, remote transactions.",
  },
  {
    icon: TrendingUp,
    title: "Higher Profit Margins Than Wholesale",
    description:
      "Retail auction outcomes consistently outperform traditional wholesale auctions and dealer-to-dealer trades. Keep more margin per unit with transparent, authentication-first listings.",
  },
] as const;

export default function DealerApplyPage() {
  return (
    <div className="flex min-h-full flex-1 flex-col bg-slate-50 text-slate-900">
      <SiteHeader />

      <main className="flex-1">
        {/* Portal header */}
        <section className="border-b border-slate-200 bg-white">
          <div className="mx-auto max-w-3xl px-4 py-12 text-center sm:px-6 lg:px-8 lg:py-16">
            <Badge
              variant="outline"
              className="border-slate-300 text-slate-700"
            >
              Dealer Partner Program
            </Badge>
            <h1 className="mt-4 text-2xl font-semibold tracking-tight text-slate-900 sm:text-3xl">
              Licensed Dealership Application
            </h1>
            <p className="mx-auto mt-3 max-w-xl text-sm leading-relaxed text-slate-600 sm:text-base">
              An exclusive B2B portal for franchised and independent dealers to
              syndicate certified inventory on the ApexAuction platform.
            </p>
          </div>
        </section>

        {/* Value propositions */}
        <section className="border-b border-slate-200 bg-white">
          <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6 lg:px-8">
            <h2 className="text-center text-xs font-medium uppercase tracking-wide text-slate-600">
              Why Partner With ApexAuction
            </h2>
            <div className="mt-6 grid gap-5 sm:grid-cols-2">
              {VALUE_PROPS.map(({ icon: Icon, title, description }) => (
                <article
                  key={title}
                  className="rounded-md border border-slate-200 bg-slate-50 p-5"
                >
                  <div className="flex size-10 items-center justify-center rounded-md border border-slate-200 bg-white">
                    <Icon className="size-5 text-slate-600" />
                  </div>
                  <h3 className="mt-4 text-sm font-semibold text-slate-900">
                    {title}
                  </h3>
                  <p className="mt-2 text-sm leading-relaxed text-slate-600">
                    {description}
                  </p>
                </article>
              ))}
            </div>
          </div>
        </section>

        {/* Application form */}
        <section className="mx-auto max-w-3xl px-4 py-10 sm:px-6 sm:py-14 lg:px-8">
          <div className="mb-8 text-center">
            <h2 className="text-lg font-semibold text-slate-900">
              Partner Application
            </h2>
            <p className="mt-1 text-sm text-slate-600">
              Complete the form below. Applications are reviewed within 2 business days.
            </p>
          </div>

          <DealerApplicationForm />
        </section>
      </main>

      <footer className="mt-auto border-t border-slate-200 bg-white">
        <div className="mx-auto flex max-w-3xl flex-col gap-4 px-4 py-8 text-center sm:flex-row sm:items-center sm:justify-between sm:text-left sm:px-6">
          <p className="text-sm text-slate-600">
            Existing dealer partner?{" "}
            <Link
              href="#"
              className="font-medium text-slate-900 underline-offset-4 hover:underline"
            >
              Sign in to your portal
            </Link>
          </p>
          <p className="text-xs text-slate-600">
            KeySavvy Escrow · NMVTIS Verified · Licensed Dealer Network
          </p>
        </div>
      </footer>
    </div>
  );
}
