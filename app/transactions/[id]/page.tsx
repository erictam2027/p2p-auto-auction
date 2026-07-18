import { TransactionWorkspace } from "@/components/transactions/transaction-workspace";
import { SiteHeader } from "@/components/layout/site-header";
import { fetchTransactionWorkspace } from "@/lib/data/transaction-workspace";
import { notFound, redirect } from "next/navigation";

export const metadata = {
  title: "Purchase Workspace | ApexAuction",
  description: "Track secure payment, title, delivery, and transaction milestones.",
};

export default async function TransactionPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const transaction = await fetchTransactionWorkspace(id);

  if (!transaction) {
    redirect(`/login?next=/transactions/${id}`);
  }

  if (!transaction) {
    notFound();
  }

  return (
    <div className="flex min-h-full flex-1 flex-col bg-slate-50 text-slate-900">
      <SiteHeader />
      <main className="flex-1">
        <TransactionWorkspace transaction={transaction} />
      </main>
    </div>
  );
}
