import Link from "next/link";
import { PayoutsTransactionTable } from "@/components/dashboard/payouts-transaction-table";
import { getEscrowStatusLabel } from "@/lib/escrow/status-labels";
import type { EscrowStatus } from "@/lib/escrow/types";
import { createClient } from "@/lib/supabase/server";
import { formatCurrency } from "@/lib/utils/format";
import { Wallet } from "lucide-react";
import { redirect } from "next/navigation";

export const metadata = {
  title: "Payouts | Dealer Portal | ApexAuction",
  description: "Track pending escrow payouts and completed KeySavvy transfer history.",
};

function formatCompletedDate(iso: string | null): string {
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

function mapPayoutStatus(status: EscrowStatus): "completed" | "processing" {
  return status === "completed" ? "completed" : "processing";
}

export default async function PayoutsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login?next=/dashboard/payouts");
  }

  const { data: escrowRows } = await supabase
    .from("escrow_transactions")
    .select(
      "id, vehicle_id, sale_price, status, keysavvy_transaction_id, completed_at, updated_at, vehicles(id, year, make, model, vin)",
    )
    .eq("seller_id", user.id)
    .in("status", ["checkout_started", "payment_received", "completed"])
    .order("updated_at", { ascending: false });

  type VehicleJoin = {
    id: string;
    year: number | null;
    make: string | null;
    model: string | null;
    vin: string | null;
  };

  function readVehicle(value: unknown): VehicleJoin | null {
    if (!value || typeof value !== "object") {
      return null;
    }

    if (Array.isArray(value)) {
      return readVehicle(value[0]);
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
      vin: typeof row.vin === "string" ? row.vin : null,
    };
  }

  const transactions = (escrowRows ?? []).map((row) => {
    const vehicle = readVehicle(row.vehicles);
    const status = row.status as EscrowStatus;

    return {
      id: row.id,
      vehicleId: row.vehicle_id,
      vehicle: vehicle
        ? `${vehicle.year ?? ""} ${vehicle.make ?? "Vehicle"} ${vehicle.model ?? "Listing"}`.trim()
        : "Vehicle listing",
      vin: vehicle?.vin ?? "—",
      amountCents: (row.sale_price ?? 0) * 100,
      completedAt: formatCompletedDate(row.completed_at ?? row.updated_at),
      keysavvyTransferId: row.keysavvy_transaction_id ?? getEscrowStatusLabel(status),
      status: mapPayoutStatus(status),
      escrowStatus: status,
    };
  });

  const pendingEscrowPayoutsCents = transactions
    .filter((transaction) => transaction.status === "processing")
    .reduce((sum, transaction) => sum + transaction.amountCents, 0);

  return (
    <div className="flex min-h-screen flex-col">
      <header className="sticky top-0 z-30 border-b border-slate-200 bg-white px-6 py-5 lg:px-8">
        <h1 className="text-lg font-semibold text-slate-900">Payouts</h1>
        <p className="mt-1 text-sm text-slate-600">
          Escrow disbursements processed through KeySavvy.
        </p>
      </header>

      <div className="flex-1 space-y-8 p-6 lg:p-8">
        <section className="rounded-md border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex items-start gap-4">
            <span className="flex size-10 items-center justify-center rounded-md border border-slate-200 bg-slate-50">
              <Wallet className="size-5 text-slate-700" />
            </span>
            <div>
              <p className="text-sm font-medium text-slate-600">
                Pending Escrow Payouts
              </p>
              <p className="mt-1 text-3xl font-semibold text-slate-900">
                {formatCurrency(pendingEscrowPayoutsCents)}
              </p>
              <p className="mt-1 text-sm text-slate-600">
                {transactions.length === 0
                  ? "No escrow transactions in progress yet."
                  : `${transactions.filter((transaction) => transaction.status === "processing").length} transaction(s) awaiting KeySavvy disbursement.`}
              </p>
            </div>
          </div>
        </section>

        <section>
          <div className="mb-4">
            <h2 className="text-base font-semibold text-slate-900">
              Transaction History
            </h2>
            <p className="mt-0.5 text-sm text-slate-600">
              Completed KeySavvy escrow transfers to your dealership account.
            </p>
          </div>

          {transactions.length > 0 ? (
            <PayoutsTransactionTable transactions={transactions} />
          ) : (
            <div className="rounded-md border border-dashed border-slate-300 bg-white px-6 py-12 text-center">
              <p className="text-sm font-semibold text-slate-900">No payout history yet</p>
              <p className="mt-2 text-sm text-slate-600">
                Escrow transactions appear here once winning bidders start KeySavvy checkout.
              </p>
              <Link
                href="/dashboard"
                className="mt-4 inline-block text-sm font-medium text-slate-900 underline-offset-4 hover:underline"
              >
                View Inventory
              </Link>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
