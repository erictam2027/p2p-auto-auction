import Link from "next/link";
import { redirect } from "next/navigation";
import { SiteHeader } from "@/components/layout/site-header";
import { Button } from "@/components/ui/button";
import { isVerifiedDealer } from "@/lib/auth/profile";
import { createClient } from "@/lib/supabase/server";

export const metadata = {
  title: "Sell Your Car | ApexAuction",
  description:
    "List verified dealer inventory on ApexAuction with NMVTIS checks, inspections, and KeySavvy escrow.",
};

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

      <main className="mx-auto flex w-full max-w-2xl flex-1 flex-col items-center px-4 py-10 sm:px-6 sm:py-14 lg:px-8">
        <div className="w-full text-center">
          <p className="text-xs font-medium uppercase tracking-wide text-slate-600">
            Dealer Listings
          </p>
          <h1 className="mt-2 text-2xl font-semibold tracking-tight text-slate-900 sm:text-3xl">
            Sell on ApexAuction
          </h1>
          <p className="mx-auto mt-3 max-w-lg text-sm leading-relaxed text-slate-600">
            ApexAuction is a verified dealer marketplace. Apply for dealer verification,
            upload inventory, and reach remote buyers with KeySavvy escrow on every sale.
          </p>
        </div>

        <div className="mt-10 w-full space-y-4 rounded-md border border-slate-200 bg-white p-6 shadow-sm">
          <ol className="space-y-3 text-sm text-slate-700">
            <li>1. Submit your dealer license and business details for review.</li>
            <li>2. Upload inventory with VIN, photos, and disclosures.</li>
            <li>3. Receive bids and close through KeySavvy escrow.</li>
          </ol>

          <div className="flex flex-col gap-3 pt-2 sm:flex-row">
            <Button
              className="flex-1 bg-slate-900 text-white hover:bg-slate-800"
              nativeButton={false}
              render={<Link href="/dealer-application" />}
            >
              Apply as Dealer
            </Button>
            <Button
              variant="outline"
              className="flex-1 border-slate-300 bg-white text-slate-900 hover:bg-slate-50"
              nativeButton={false}
              render={<Link href="/browse" />}
            >
              Browse Listings
            </Button>
          </div>
        </div>
      </main>

      <footer className="mt-auto w-full border-t border-slate-200 bg-white">
        <div className="mx-auto max-w-2xl px-4 py-8 text-center sm:px-6">
          <p className="text-sm text-slate-600">
            Questions?{" "}
            <Link
              href="/dealer-application"
              className="font-medium text-slate-900 underline-offset-4 hover:underline"
            >
              Start your dealer application
            </Link>
          </p>
          <p className="mt-2 text-xs text-slate-600">NMVTIS · Lemon Squad · KeySavvy</p>
        </div>
      </footer>
    </div>
  );
}
