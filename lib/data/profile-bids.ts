import { fetchEscrowForVehicles } from "@/lib/data/escrow-transactions";
import type { EscrowStatus, PlatformFeeStatus } from "@/lib/escrow/types";
import { createClient } from "@/lib/supabase/server";
import type { ProfileBidRow, ProfileWonAuctionRow } from "@/components/profile/profile-bids-table";

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

function formatEndedDate(iso: string | null): string {
  if (!iso) {
    return "—";
  }

  const parsed = Date.parse(iso);

  if (!Number.isFinite(parsed)) {
    return "—";
  }

  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(new Date(parsed));
}

function readBidAmount(row: Record<string, unknown>): number {
  for (const key of ["amount", "bid_amount", "current_bid"]) {
    const value = row[key];
    if (typeof value === "number" && Number.isFinite(value)) {
      return value;
    }
  }

  return 0;
}

type VehicleSummary = {
  id: string;
  year: number | null;
  make: string | null;
  model: string | null;
  current_bid: number | null;
  end_time: string | null;
  status: string | null;
};

function readJoinedVehicle(value: unknown): VehicleSummary | null {
  if (!value) {
    return null;
  }

  if (Array.isArray(value)) {
    return readJoinedVehicle(value[0]);
  }

  if (typeof value !== "object") {
    return null;
  }

  const row = value as Record<string, unknown>;

  if (typeof row.id !== "string") {
    return null;
  }

  return {
    id: row.id,
    year: typeof row.year === "number" ? row.year : null,
    make: typeof row.make === "string" ? row.make : null,
    model: typeof row.model === "string" ? row.model : null,
    current_bid: typeof row.current_bid === "number" ? row.current_bid : null,
    end_time: typeof row.end_time === "string" ? row.end_time : null,
    status: typeof row.status === "string" ? row.status : null,
  };
}

export async function fetchProfileActiveBids(userId: string): Promise<ProfileBidRow[]> {
  const supabase = await createClient();

  const { data: bids } = await supabase
    .from("bids")
    .select(
      "id, amount, bid_amount, current_bid, vehicle_id, vehicles(id, year, make, model, current_bid, end_time, status)",
    )
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  const liveByVehicle = new Map<string, ProfileBidRow>();

  for (const bid of bids ?? []) {
    const vehicle = readJoinedVehicle(bid.vehicles);

    if (!vehicle || vehicle.status !== "live") {
      continue;
    }

    const amount = readBidAmount(bid as Record<string, unknown>);
    const existing = liveByVehicle.get(vehicle.id);

    if (existing && existing.amountCents >= amount * 100) {
      continue;
    }

    liveByVehicle.set(vehicle.id, {
      id: bid.id,
      vehicleId: vehicle.id,
      title: `${vehicle.year ?? ""} ${vehicle.make ?? "Vehicle"} ${vehicle.model ?? "Listing"}`.trim(),
      amountCents: amount * 100,
      endTime: readEndTime(vehicle.end_time),
      isLeading: amount >= (vehicle.current_bid ?? 0),
    });
  }

  return Array.from(liveByVehicle.values());
}

export async function fetchProfileWonAuctions(userId: string): Promise<ProfileWonAuctionRow[]> {
  const supabase = await createClient();

  const { data: vehicles } = await supabase
    .from("vehicles")
    .select("id, year, make, model, current_bid, end_time")
    .eq("winner_id", userId)
    .eq("status", "ended")
    .order("end_time", { ascending: false });

  const vehicleIds = (vehicles ?? []).map((vehicle) => vehicle.id);
  const escrowByVehicle = await fetchEscrowForVehicles(vehicleIds);

  return (vehicles ?? []).map((vehicle) => {
    const escrow = escrowByVehicle.get(vehicle.id);

    return {
      id: vehicle.id,
      transactionId: escrow?.id ?? null,
      title: `${vehicle.year ?? ""} ${vehicle.make ?? "Vehicle"} ${vehicle.model ?? "Listing"}`.trim(),
      amountCents: (vehicle.current_bid ?? 0) * 100,
      endedAt: formatEndedDate(vehicle.end_time),
      escrowStatus: (escrow?.status ?? "pending") as EscrowStatus,
      platformFeeStatus: (escrow?.platformFeeStatus ?? "pending") as PlatformFeeStatus,
    };
  });
}
