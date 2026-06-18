import Link from "next/link";
import { ActiveAuctionsTable } from "@/components/dashboard/active-auctions-table";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

export const metadata = {
  title: "Active Auctions | Dealer Portal | ApexAuction",
  description: "Monitor live dealer auctions, bids, and reserve status.",
};

function readEndTime(endTime: string | null): string {
  if (!endTime || endTime.trim().length === 0) {
    return "";
  }

  const parsed = Date.parse(endTime);

  if (!Number.isFinite(parsed)) {
    return "";
  }

  return new Date(parsed).toISOString();
}

export default async function ActiveAuctionsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login?next=/dashboard/auctions");
  }

  const { data: vehicles } = await supabase
    .from("vehicles")
    .select("id, vin, year, make, model, current_bid, end_time")
    .eq("seller_id", user.id)
    .eq("status", "live")
    .order("end_time", { ascending: true });

  const auctions = (vehicles ?? []).map((vehicle) => ({
    id: vehicle.id,
    vin: vehicle.vin ?? "—",
    year: vehicle.year ?? 0,
    make: vehicle.make ?? "Vehicle",
    model: vehicle.model ?? "Listing",
    currentBidCents: (vehicle.current_bid ?? 0) * 100,
    endTime: readEndTime(vehicle.end_time),
  }));

  return (
    <div className="flex min-h-screen flex-col">
      <header className="sticky top-0 z-30 border-b border-slate-200 bg-white px-6 py-5 lg:px-8">
        <h1 className="text-lg font-semibold text-slate-900">Active Auctions</h1>
        <p className="mt-1 text-sm text-slate-600">
          {auctions.length === 1
            ? "1 vehicle currently live on the marketplace."
            : `${auctions.length} vehicles currently live on the marketplace.`}
        </p>
      </header>

      <div className="flex-1 p-6 lg:p-8">
        {auctions.length > 0 ? (
          <ActiveAuctionsTable auctions={auctions} />
        ) : (
          <div className="rounded-md border border-dashed border-slate-300 bg-white px-6 py-12 text-center">
            <p className="text-sm font-semibold text-slate-900">No live auctions</p>
            <p className="mt-2 text-sm text-slate-600">
              Upload inventory to start receiving bids.
            </p>
            <Link
              href="/dashboard/upload"
              className="mt-4 inline-block text-sm font-medium text-slate-900 underline-offset-4 hover:underline"
            >
              Upload New Inventory
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
