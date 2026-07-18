import Link from "next/link";
import {
  DealerReadinessChecklist,
  type DealerReadinessChecklistItem,
} from "@/components/dashboard/dealer-readiness-checklist";
import { DealerVehiclesTable } from "@/components/dashboard/dealer-vehicles-table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { canAccessDashboard, isAdmin, isVerifiedDealer } from "@/lib/auth/profile";
import { createClient } from "@/lib/supabase/server";
import { formatCurrency } from "@/lib/utils/format";
import {
  ArrowRight,
  Car,
  Clock3,
  Gavel,
  Plus,
  ShieldCheck,
  Upload,
} from "lucide-react";
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
  end_time: string | null;
  status: string | null;
};

const DAY_IN_MS = 24 * 60 * 60 * 1000;

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

function getVehicleStatus(vehicle: VehicleRow) {
  const status = vehicle.status?.toLowerCase();

  if (status === "ended" || status === "closed") {
    return "Ended" as const;
  }

  const endTime = readEndTime(vehicle.end_time);

  if (endTime && Date.parse(endTime) <= Date.now()) {
    return "Ended" as const;
  }

  return "Live" as const;
}

function formatVehicleTitle(vehicle: { year: number; make: string; model: string }) {
  return [vehicle.year > 0 ? vehicle.year : null, vehicle.make, vehicle.model]
    .filter(Boolean)
    .join(" ");
}

function formatTimeRemaining(endTime: string) {
  const parsed = Date.parse(endTime);

  if (!Number.isFinite(parsed)) {
    return "No schedule";
  }

  const minutes = Math.ceil((parsed - Date.now()) / (60 * 1000));

  if (minutes <= 0) {
    return "Ended";
  }

  if (minutes < 60) {
    return `${minutes}m left`;
  }

  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;

  if (hours < 24) {
    return remainingMinutes > 0
      ? `${hours}h ${remainingMinutes}m left`
      : `${hours}h left`;
  }

  const days = Math.floor(hours / 24);
  const remainingHours = hours % 24;

  return remainingHours > 0 ? `${days}d ${remainingHours}h left` : `${days}d left`;
}

function isEndingWithinDay(endTime: string) {
  const parsed = Date.parse(endTime);

  return Number.isFinite(parsed) && parsed - Date.now() <= DAY_IN_MS;
}

function formatInventoryCount(count: number) {
  return count === 1
    ? "1 vehicle in your marketplace catalog"
    : `${count} vehicles in your marketplace catalog`;
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
    .select("role, verification_status, dealership_name, dealer_license, phone")
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
    .select("id, year, make, model, vin, current_bid, image_url, end_time, status")
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
    endTime: readEndTime(vehicle.end_time),
    status: getVehicleStatus(vehicle as VehicleRow),
  }));

  const dealershipName = profile?.dealership_name ?? "Dealer Portal";
  const liveRows = rows.filter((vehicle) => vehicle.status === "Live");
  const endedRows = rows.filter((vehicle) => vehicle.status === "Ended");
  const endingSoonRows = liveRows.filter((vehicle) => isEndingWithinDay(vehicle.endTime));
  const liveSnapshotRows = [...liveRows]
    .sort((first, second) => second.currentBid - first.currentBid)
    .slice(0, 3);
  const totalCurrentBidCents = rows.reduce(
    (sum, vehicle) => sum + vehicle.currentBid * 100,
    0,
  );
  const highestBidCents = Math.max(0, ...rows.map((vehicle) => vehicle.currentBid * 100));
  const hasDealerDetails = Boolean(
    profile?.dealership_name?.trim() &&
      profile?.dealer_license?.trim() &&
      profile?.phone?.trim(),
  );
  const hasBuyerReadyListing = rows.some(
    (vehicle) => vehicle.imageUrl.length > 0 && vehicle.vin !== "—",
  );
  const nextDashboardAction = !hasDealerDetails
    ? {
        title: "Complete dealer details",
        description:
          "Add your license number and direct phone line so buyers see a complete seller profile.",
        href: "/dashboard/settings",
        label: "Update Settings",
      }
    : rows.length === 0
      ? {
          title: "Upload the first auction unit",
          description:
            "Start with one clean VIN, photos, condition notes, and a reserve target.",
          href: "/dashboard/upload",
          label: "Upload Inventory",
        }
      : liveRows.length === 0
        ? {
            title: "Refresh your auction lane",
            description:
              "Your catalog is quiet right now. Add or relaunch inventory to get back in front of buyers.",
            href: "/dashboard/upload",
            label: "Add Inventory",
          }
        : endingSoonRows.length > 0
          ? {
              title: "Watch auctions closing soon",
              description:
                "Keep an eye on buyer messages and closing bids for vehicles ending in the next 24 hours.",
              href: "/dashboard/auctions",
              label: "Open Auctions",
            }
          : {
              title: "Keep fresh inventory moving",
              description:
                "Your lane is active. Add the next unit while buyers are already watching.",
              href: "/dashboard/upload",
              label: "Upload Another Unit",
            };
  const readinessItems: DealerReadinessChecklistItem[] = [
    {
      id: "dealer-approved",
      title: "Dealer account approved",
      description: isAdmin(profile)
        ? "Admin access is active for managing marketplace inventory."
        : "Verified dealer access is active for this account.",
      href: "/dealer-application",
      actionLabel: "View Status",
      isComplete: true,
    },
    {
      id: "dealership-details",
      title: "Dealership details saved",
      description: "Name, license number, and phone are ready for buyer confidence.",
      href: "/dashboard/settings",
      actionLabel: hasDealerDetails ? "Review" : "Edit Details",
      isComplete: hasDealerDetails,
    },
    {
      id: "first-listing",
      title: "First vehicle uploaded",
      description: "Inventory appears in the marketplace catalog once a listing is live.",
      href: "/dashboard/upload",
      actionLabel: rows.length > 0 ? "Add More" : "Upload Vehicle",
      isComplete: rows.length > 0,
    },
    {
      id: "live-auction",
      title: "Live auction running",
      description: "At least one vehicle is actively collecting bids from buyers.",
      href: liveRows.length > 0 ? "/dashboard/auctions" : "/dashboard/upload",
      actionLabel: liveRows.length > 0 ? "Open Auctions" : "Start Auction",
      isComplete: liveRows.length > 0,
    },
    {
      id: "buyer-ready-listing",
      title: "Buyer-ready listing proof",
      description: "At least one listing includes a VIN and vehicle photo.",
      href: "/dashboard",
      actionLabel: "Review",
      isComplete: hasBuyerReadyListing,
    },
  ];
  const overviewMetrics = [
    {
      label: "Live Auctions",
      value: liveRows.length.toLocaleString(),
      description:
        liveRows.length === 1
          ? "1 unit taking bids now"
          : `${liveRows.length} units taking bids now`,
      icon: Gavel,
    },
    {
      label: "Total Inventory",
      value: rows.length.toLocaleString(),
      description: `${endedRows.length.toLocaleString()} closed or ended`,
      icon: Car,
    },
    {
      label: "Bid Exposure",
      value: formatCurrency(totalCurrentBidCents),
      description: `Highest bid ${formatCurrency(highestBidCents)}`,
      icon: ShieldCheck,
    },
    {
      label: "Ending Soon",
      value: endingSoonRows.length.toLocaleString(),
      description: "Auctions ending in the next 24 hours",
      icon: Clock3,
    },
  ];

  return (
    <div className="flex min-h-screen flex-col">
      <header className="sticky top-0 z-30 border-b border-slate-200 bg-white px-6 py-5 lg:px-8">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-lg font-semibold text-slate-900">Dealer Dashboard</h1>
            <p className="mt-1 text-sm text-slate-600">
              {dealershipName} overview and auction operations
            </p>
          </div>

          <div className="flex flex-col gap-2 sm:flex-row">
            <Button
              variant="outline"
              nativeButton={false}
              render={<Link href="/dashboard/inventory" />}
            >
              <Upload className="size-4" />
              Bulk Sync
            </Button>
            <Button
              className="bg-slate-900 text-white hover:bg-slate-800"
              nativeButton={false}
              render={<Link href="/dashboard/upload" />}
            >
              <Plus className="size-4" />
              Upload New Inventory
            </Button>
          </div>
        </div>
      </header>

      <div className="flex-1 space-y-8 p-6 lg:p-8">
        <section className="rounded-md border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
            <div className="max-w-3xl">
              <div className="flex items-center gap-2">
                <span className="flex size-9 items-center justify-center rounded-md border border-slate-200 bg-slate-50">
                  <ShieldCheck className="size-4 text-slate-700" />
                </span>
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Dealer workspace
                </p>
              </div>
              <h2 className="mt-4 text-2xl font-semibold tracking-tight text-slate-950">
                Welcome back, {dealershipName}
              </h2>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">
                Monitor active auctions, keep listings buyer-ready, and move straight
                into the next action your dealership needs.
              </p>
            </div>

            <div className="border-t border-slate-200 pt-5 lg:w-80 lg:border-l lg:border-t-0 lg:pl-6 lg:pt-0">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                Recommended next move
              </p>
              <h3 className="mt-2 text-base font-semibold text-slate-900">
                {nextDashboardAction.title}
              </h3>
              <p className="mt-1 text-sm leading-6 text-slate-600">
                {nextDashboardAction.description}
              </p>
              <Link
                href={nextDashboardAction.href}
                className="mt-4 inline-flex items-center gap-1.5 text-sm font-medium text-slate-950 underline-offset-4 hover:underline"
              >
                {nextDashboardAction.label}
                <ArrowRight className="size-4" />
              </Link>
            </div>
          </div>
        </section>

        <section
          aria-label="Dealer overview metrics"
          className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4"
        >
          {overviewMetrics.map(({ label, value, description, icon: Icon }) => (
            <article
              key={label}
              className="flex min-h-32 justify-between gap-4 rounded-md border border-slate-200 bg-white p-5 shadow-sm"
            >
              <div>
                <p className="text-sm font-medium text-slate-600">{label}</p>
                <p className="mt-3 text-2xl font-semibold text-slate-950">{value}</p>
                <p className="mt-1 text-xs leading-5 text-slate-500">{description}</p>
              </div>
              <span className="flex size-10 shrink-0 items-center justify-center rounded-md border border-slate-200 bg-slate-50">
                <Icon className="size-5 text-slate-600" />
              </span>
            </article>
          ))}
        </section>

        <section className="grid gap-6 xl:grid-cols-[minmax(0,1.35fr)_minmax(340px,0.65fr)]">
          <section className="rounded-md border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <h2 className="text-base font-semibold text-slate-900">
                  Live Auction Snapshot
                </h2>
                <p className="mt-1 text-sm text-slate-600">
                  Top active listings by current bid.
                </p>
              </div>
              <Button
                variant="outline"
                size="sm"
                nativeButton={false}
                render={<Link href="/dashboard/auctions" />}
              >
                View All
                <ArrowRight className="size-4" />
              </Button>
            </div>

            {liveSnapshotRows.length > 0 ? (
              <div className="mt-5 divide-y divide-slate-100">
                {liveSnapshotRows.map((vehicle) => {
                  const title = formatVehicleTitle(vehicle);
                  const isEndingSoon = endingSoonRows.some(
                    (endingSoonVehicle) => endingSoonVehicle.id === vehicle.id,
                  );

                  return (
                    <div
                      key={vehicle.id}
                      className="grid gap-3 py-4 sm:grid-cols-[minmax(0,1fr)_auto]"
                    >
                      <div className="min-w-0">
                        <Link
                          href={`/auctions/${vehicle.id}`}
                          className="font-medium text-slate-950 underline-offset-4 hover:underline"
                        >
                          {title}
                        </Link>
                        <p className="mt-1 font-mono text-xs text-slate-500">
                          {vehicle.vin}
                        </p>
                      </div>
                      <div className="flex flex-wrap items-center gap-2 sm:justify-end">
                        <p className="text-sm font-semibold text-slate-950">
                          {formatCurrency(vehicle.currentBid * 100)}
                        </p>
                        <Badge
                          variant="outline"
                          className={
                            isEndingSoon
                              ? "border-amber-200 bg-amber-50 text-amber-800"
                              : "border-emerald-200 bg-emerald-50 text-emerald-700"
                          }
                        >
                          {formatTimeRemaining(vehicle.endTime)}
                        </Badge>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="mt-5 rounded-md border border-dashed border-slate-300 px-6 py-10 text-center">
                <Gavel className="mx-auto size-8 text-slate-400" />
                <p className="mt-3 text-sm font-semibold text-slate-900">
                  No live auctions yet
                </p>
                <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-600">
                  Upload a vehicle to start a seven-day auction and bring this
                  snapshot to life.
                </p>
                <Link
                  href="/dashboard/upload"
                  className="mt-4 inline-flex items-center gap-1.5 text-sm font-medium text-slate-950 underline-offset-4 hover:underline"
                >
                  Upload Inventory
                  <ArrowRight className="size-4" />
                </Link>
              </div>
            )}
          </section>

          <DealerReadinessChecklist items={readinessItems} />
        </section>

        <section>
          <div className="mb-4">
            <h2 className="text-base font-semibold text-slate-900">Your Inventory</h2>
            <p className="mt-0.5 text-sm text-slate-600">
              {formatInventoryCount(rows.length)}
            </p>
          </div>

          <DealerVehiclesTable vehicles={rows} />
        </section>
      </div>
    </div>
  );
}
