import { PayoutsTransactionTable } from "@/components/dashboard/payouts-transaction-table";
import {
  dealerMetrics,
  dealerPayoutTransactions,
} from "@/lib/data/dealer-dashboard";
import { formatCurrency } from "@/lib/utils/format";
import { Wallet } from "lucide-react";

export const metadata = {
  title: "Payouts | Dealer Portal | ApexAuction",
  description: "Track pending escrow payouts and completed KeySavvy transfer history.",
};

export default function PayoutsPage() {
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
                {formatCurrency(dealerMetrics.pendingEscrowPayoutsCents)}
              </p>
              <p className="mt-1 text-sm text-slate-600">
                Awaiting title verification and buyer delivery confirmation.
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

          <PayoutsTransactionTable transactions={dealerPayoutTransactions} />
        </section>
      </div>
    </div>
  );
}
