type VehicleAuctionRow = {
  status?: string | null;
  end_time?: string | null;
  seller_id?: string | null;
};

const SNIPE_EXTENSION_MS = 2 * 60 * 1000;

export function isAuctionLive(vehicle: VehicleAuctionRow): boolean {
  const status = vehicle.status?.toLowerCase();

  if (status === "ended" || status === "closed") {
    return false;
  }

  if (typeof vehicle.end_time === "string" && vehicle.end_time.trim().length > 0) {
    const endTimestamp = Date.parse(vehicle.end_time);

    if (Number.isFinite(endTimestamp) && endTimestamp <= Date.now()) {
      return false;
    }
  }

  return status === "live" || !status;
}

export function getSnipeExtendedEndTime(endTime: string | null | undefined): string | null {
  if (!endTime) {
    return null;
  }

  const endTimestamp = Date.parse(endTime);

  if (!Number.isFinite(endTimestamp)) {
    return null;
  }

  const remainingMs = endTimestamp - Date.now();

  if (remainingMs <= 0 || remainingMs > SNIPE_EXTENSION_MS) {
    return null;
  }

  return new Date(Date.now() + SNIPE_EXTENSION_MS).toISOString();
}

export { SNIPE_EXTENSION_MS };
