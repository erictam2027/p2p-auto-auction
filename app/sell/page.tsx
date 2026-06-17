import Link from "next/link";
import { SiteHeader } from "@/components/layout/site-header";
import { SellerOnboardingWizard } from "@/components/sell/seller-onboarding-wizard";

export const metadata = {
  title: "Sell Your Car | ApexAuction",
  description:
    "Start the Vehicle Certification & Listing process. VIN verification, Legit Check inspection, and KeySavvy escrow onboarding.",
};

export default function SellPage() {
  return (
    <div className="flex min-h-full flex-1 flex-col bg-slate-50 text-slate-900">
      <SiteHeader />

      <main className="flex flex-1 flex-col items-center px-4 py-10 sm:px-6 sm:py-14 lg:px-8">
        <div className="mb-10 w-full max-w-2xl text-center">
          <p className="text-xs font-medium uppercase tracking-wide text-slate-600">
            Seller Application
          </p>
          <h1 className="mt-2 text-2xl font-semibold tracking-tight text-slate-900 sm:text-3xl">
            Sell Your Car
          </h1>
          <p className="mx-auto mt-3 max-w-lg text-sm leading-relaxed text-slate-600">
            Complete three certification steps to list your vehicle on ApexAuction&apos;s
            verified peer-to-peer marketplace.
          </p>
        </div>

        <SellerOnboardingWizard />
      </main>

      <footer className="mt-auto w-full border-t border-slate-200 bg-white">
        <div className="mx-auto flex max-w-2xl flex-col gap-4 px-4 py-8 text-center sm:flex-row sm:items-center sm:justify-between sm:text-left sm:px-6">
          <p className="text-sm text-slate-600">
            Questions?{" "}
            <Link
              href="#"
              className="font-medium text-slate-900 underline-offset-4 hover:underline"
            >
              Contact seller support
            </Link>
          </p>
          <p className="text-xs text-slate-600">NMVTIS · Lemon Squad · KeySavvy</p>
        </div>
      </footer>
    </div>
  );
}
