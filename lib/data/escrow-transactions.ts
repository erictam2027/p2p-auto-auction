import {
  toEscrowSummary,
  type EscrowTransactionRow,
  type EscrowTransactionSummary,
} from "@/lib/escrow/types";
import { createClient } from "@/lib/supabase/server";

export async function fetchEscrowForVehicle(
  vehicleId: string,
): Promise<EscrowTransactionSummary | null> {
  const supabase = await createClient();

  const { data } = await supabase
    .from("escrow_transactions")
    .select("*")
    .eq("vehicle_id", vehicleId)
    .maybeSingle();

  if (!data) {
    return null;
  }

  return toEscrowSummary(data as EscrowTransactionRow);
}

export async function fetchEscrowForVehicles(
  vehicleIds: string[],
): Promise<Map<string, EscrowTransactionSummary>> {
  if (vehicleIds.length === 0) {
    return new Map();
  }

  const supabase = await createClient();

  const { data } = await supabase
    .from("escrow_transactions")
    .select("*")
    .in("vehicle_id", vehicleIds);

  const map = new Map<string, EscrowTransactionSummary>();

  for (const row of data ?? []) {
    map.set(row.vehicle_id, toEscrowSummary(row as EscrowTransactionRow));
  }

  return map;
}
