import Link from "next/link";
import { DealerVehiclesTable } from "@/components/dashboard/dealer-vehicles-table";
import { Button } from "@/components/ui/button";
import { canAccessDashboard, isAdmin, isVerifiedDealer } from "@/lib/auth/profile";
import { createClient } from "@/lib/supabase/server";
import { Plus } from "lucide-react";
import { redirect } from "next/navigation";

export const metadata = {
  title: "Dealer Dashboard | ApexAuction",
  description: "Manage your dealership inventory and live auction listings.",
};

type VehicleRow = {
  id: string;
  year: number | null;
  make: string | null;
  model: string | null;
  vin: string | null;
  current_bid: number | null;
  image_url: string | null;
  time_left: string | null;
  status: string | null;
};

function getVehicleStatus(vehicle: VehicleRow) {
  const status = vehicle.status?.toLowerCase();

  if (status === "ended" || status === "closed") {
    return "Ended" as const;
  }

  const timeLeft = vehicle.time_left?.toLowerCase() ?? "";

  if (timeLeft === "ended" || timeLeft === "0" || timeLeft === "0:00") {
    return "Ended" as const;
  }

  return "Live" as const;
}

export default async function DashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login?next=/dashboard");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("role, verification_status, dealership_name")
    .eq("id", user.id)
    .maybeSingle();

  if (!canAccessDashboard(profile)) {
    redirect("/dealer-application");
  }

  const isDealerUser = isVerifiedDealer(profile) || isAdmin(profile);

  if (!isDealerUser) {
    redirect("/");
  }

  const { data: vehicles, error } = await supabase
    .from("vehicles")
    .select("id, year, make, model, vin, current_bid, image_url, time_left, status")
    .eq("seller_id", user.id)
    .order("year", { ascending: false });

  if (error) {
    console.error("Dealer vehicles fetch error:", error);
  }

  const rows = (vehicles ?? []).map((vehicle) => ({
    id: vehicle.id,
    year: vehicle.year ?? 0,
    make: vehicle.make ?? "Vehicle",
    model: vehicle.model ?? "Listing",
    vin: vehicle.vin ?? "—",
    currentBid: vehicle.current_bid ?? 0,
    imageUrl: vehicle.image_url ?? "",
    status: getVehicleStatus(vehicle as VehicleRow),
  }));

  const dealershipName = profile?.dealership_name ?? "Dealer Portal";

  return (
    <div className="flex min-h-screen flex-col">
      <header className="sticky top-0 z-30 border-b border-slate-200 bg-white px-6 py-5 lg:px-8">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-lg font-semibold text-slate-900">Dealer Dashboard</h1>
            <p className="mt-1 text-sm text-slate-600">{dealershipName}</p>
          </div>

          <Button
            className="bg-slate-900 text-white hover:bg-slate-800"
            nativeButton={false}
            render={<Link href="/dashboard/upload" />}
          >
            <Plus className="size-4" />
            Upload New Inventory
          </Button>
        </div>
      </header>

      <div className="flex-1 p-6 lg:p-8">
        <section>
          <div className="mb-4">
            <h2 className="text-base font-semibold text-slate-900">Your Inventory</h2>
            <p className="mt-0.5 text-sm text-slate-600">
              {rows.length === 1
                ? "1 vehicle in your marketplace catalog"
                : `${rows.length} vehicles in your marketplace catalog`}
            </p>
          </div>

          <DealerVehiclesTable vehicles={rows} />
        </section>
      </div>
    </div>
  );
}
