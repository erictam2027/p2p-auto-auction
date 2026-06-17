import Link from "next/link";
import { SiteHeader } from "@/components/layout/site-header";
import { SellerOnboardingWizard } from "@/components/sell/seller-onboarding-wizard";

export const metadata = {
  title: "Sell Your Vehicle | ApexAuction",
  description:
    "Start the Vehicle Certification & Listing process. VIN verification, Legit Check inspection, and KeySavvy escrow onboarding.",
};

export default function SellPage() {
  return (
    <div className="flex min-h-full flex-1 flex-col bg-slate-50 text-slate-900">
      <SiteHeader />

      <main className="flex-1">
        <section className="border-b border-slate-200 bg-white">
          <div className="mx-auto max-w-4xl px-4 py-10 sm:px-6 lg:px-8 lg:py-12">
            <p className="text-xs font-medium uppercase tracking-wide text-slate-600">
              Seller Application
            </p>
            <h1 className="mt-2 text-2xl font-semibold tracking-tight text-slate-900 sm:text-3xl">
              Vehicle Certification & Listing
            </h1>
            <p className="mt-3 max-w-2xl text-sm leading-relaxed text-slate-600 sm:text-base">
              Complete all three steps to certify your vehicle and prepare your listing
              for auction. Every seller on ApexAuction passes federal title verification,
              a certified inspection, and licensed dealer escrow onboarding.
            </p>
          </div>
        </section>

        <section className="mx-auto max-w-4xl px-4 py-10 sm:px-6 lg:px-8 lg:py-12">
          <SellerOnboardingWizard />
        </section>
      </main>

      <footer className="mt-auto border-t border-slate-200 bg-white">
        <div className="mx-auto flex max-w-4xl flex-col gap-4 px-4 py-8 sm:flex-row sm:items-center sm:justify-between sm:px-6 lg:px-8">
          <p className="text-sm text-slate-600">
            Questions about selling?{" "}
            <Link href="#" className="font-medium text-slate-900 underline-offset-4 hover:underline">
              Contact seller support
            </Link>
          </p>
          <p className="text-xs text-slate-600">
            NMVTIS · Lemon Squad · KeySavvy · Persona
          </p>
        </div>
      </footer>
    </div>
  );
}
