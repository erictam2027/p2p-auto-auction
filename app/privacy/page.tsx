import Link from "next/link";
import { SiteHeader } from "@/components/layout/site-header";

export const metadata = {
  title: "Privacy Policy | ApexAuction",
  description: "How ApexAuction collects, uses, and protects your information.",
};

export default function PrivacyPage() {
  return (
    <div className="flex min-h-full flex-1 flex-col bg-slate-50 text-slate-900">
      <SiteHeader />
      <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-10 sm:px-6 lg:px-8">
        <h1 className="text-3xl font-semibold tracking-tight">Privacy Policy</h1>
        <p className="mt-2 text-sm text-slate-600">Last updated: July 16, 2026</p>
        <div className="mt-8 space-y-4 text-sm leading-relaxed text-slate-700">
          <p>
            ApexAuction collects account, bidding, vehicle listing, and payment-method
            metadata required to operate a peer-to-peer automotive auction marketplace.
          </p>
          <p>
            Identity verification may be processed by Persona. Vehicle history checks may
            be processed by VinAudit / NMVTIS providers. Escrow and title transfer may be
            processed by KeySavvy. Card setup and platform fees are processed by Stripe.
          </p>
          <p>
            We do not sell personal data. We retain transactional records as required for
            fraud prevention, tax, and dispute resolution.
          </p>
          <p>
            Contact{" "}
            <Link href="/sell" className="font-medium underline underline-offset-4">
              dealer support
            </Link>{" "}
            for privacy requests.
          </p>
        </div>
      </main>
    </div>
  );
}
