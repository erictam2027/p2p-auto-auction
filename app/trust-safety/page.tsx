import { SiteHeader } from "@/components/layout/site-header";

export const metadata = {
  title: "Trust & Safety | ApexAuction",
  description: "How ApexAuction protects buyers and sellers against automotive fraud.",
};

export default function TrustSafetyPage() {
  return (
    <div className="flex min-h-full flex-1 flex-col bg-slate-50 text-slate-900">
      <SiteHeader />
      <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-10 sm:px-6 lg:px-8">
        <h1 className="text-3xl font-semibold tracking-tight">Trust &amp; Safety</h1>
        <p className="mt-2 text-sm text-slate-600">
          Our operational mandate is the eradication of automotive fraud.
        </p>
        <ul className="mt-8 list-disc space-y-3 pl-5 text-sm leading-relaxed text-slate-700">
          <li>
            <strong>Escrow:</strong> Vehicle funds and title clearing run through KeySavvy.
          </li>
          <li>
            <strong>Identity:</strong> Persona biometric verification can be required before
            bidding.
          </li>
          <li>
            <strong>History:</strong> VIN submissions are screened for severe NMVTIS brands
            (salvage, flood, total loss).
          </li>
          <li>
            <strong>Inspections:</strong> Lemon Squad mobile inspections can be attached to
            listings when available.
          </li>
          <li>
            <strong>Payments:</strong> Stripe stores bidder payment methods and captures the
            platform facilitation fee.
          </li>
        </ul>
      </main>
    </div>
  );
}
