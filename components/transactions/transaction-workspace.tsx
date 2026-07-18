"use client";

import {
  confirmDelivery,
  confirmVehicleHandoff,
  markVehicleReady,
  openTransactionDispute,
  registerTransactionDocument,
  setDeliveryPlan,
  submitTitlePackage,
} from "@/app/transactions/actions";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import {
  getEscrowStatusLabel,
  getPlatformFeeStatusLabel,
} from "@/lib/escrow/status-labels";
import type { TransactionWorkspace } from "@/lib/transactions/types";
import { createClient } from "@/lib/supabase/client";
import { formatCurrency } from "@/lib/utils/format";
import {
  AlertTriangle,
  Check,
  FileUp,
  Loader2,
  MapPin,
  ShieldCheck,
  Truck,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { toast } from "sonner";

type TransactionWorkspaceProps = {
  transaction: TransactionWorkspace;
};

const DOCUMENT_LABELS = {
  title: "Title document",
  bill_of_sale: "Bill of sale",
  bill_of_lading: "Bill of lading",
  inspection: "Inspection report",
  other: "Other document",
} as const;

function formatEventDate(value: string) {
  const parsed = Date.parse(value);
  return Number.isFinite(parsed)
    ? new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" }).format(new Date(parsed))
    : "Recently";
}

function humanize(value: string) {
  return value.replaceAll("_", " ").replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function Milestone({ complete, label, detail }: { complete: boolean; label: string; detail: string }) {
  return (
    <div className="flex gap-3">
      <span className={`flex size-6 shrink-0 items-center justify-center rounded-full border ${complete ? "border-emerald-200 bg-emerald-50 text-emerald-700" : "border-slate-200 bg-white text-slate-400"}`}>
        {complete ? <Check className="size-3.5" /> : <span className="size-1.5 rounded-full bg-current" />}
      </span>
      <div>
        <p className="text-sm font-medium text-slate-900">{label}</p>
        <p className="mt-0.5 text-xs leading-5 text-slate-600">{detail}</p>
      </div>
    </div>
  );
}

export function TransactionWorkspace({ transaction }: TransactionWorkspaceProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [deliveryMethod, setDeliveryMethod] = useState<"pickup" | "transport">(
    transaction.deliveryMethod ?? "pickup",
  );
  const [deliveryAddress, setDeliveryAddress] = useState(transaction.deliveryAddress ?? "");
  const [disputeReason, setDisputeReason] = useState("");
  const [documentType, setDocumentType] = useState<keyof typeof DOCUMENT_LABELS>(
    transaction.viewerRole === "seller" ? "title" : "bill_of_lading",
  );
  const [isUploading, setIsUploading] = useState(false);

  const isBuyer = transaction.viewerRole === "buyer";
  const isSeller = transaction.viewerRole === "seller";
  const paymentConfirmed = ["payment_received", "completed"].includes(transaction.escrowStatus);
  const titleSubmitted = ["submitted", "verified", "released"].includes(transaction.titleStatus);
  const titleVerified = ["verified", "released"].includes(transaction.titleStatus);
  const vehicleReady = ["ready", "seller_confirmed", "buyer_confirmed"].includes(transaction.handoffStatus);
  const handoffConfirmed = ["seller_confirmed", "buyer_confirmed"].includes(transaction.handoffStatus);
  const deliveryConfirmed = transaction.handoffStatus === "buyer_confirmed";

  function runAction(action: () => Promise<{ ok: boolean; message?: string }>, success: string) {
    startTransition(async () => {
      const result = await action();
      if (!result.ok) {
        toast.error(result.message ?? "Unable to update the transaction.");
        return;
      }
      toast.success(success);
      router.refresh();
    });
  }

  async function uploadDocument(file: File | null) {
    if (!file) return;
    if (file.size > 10 * 1024 * 1024) {
      toast.error("Documents must be 10 MB or smaller.");
      return;
    }
    if (!['application/pdf', 'image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
      toast.error("Upload a PDF, JPG, PNG, or WebP document.");
      return;
    }

    setIsUploading(true);
    try {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Your session expired. Sign in again to upload documents.");

      const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "-").slice(-120);
      const storagePath = `${user.id}/${transaction.id}/${crypto.randomUUID()}-${safeName}`;
      const { error: uploadError } = await supabase.storage
        .from("transaction-documents")
        .upload(storagePath, file, { contentType: file.type, upsert: false });
      if (uploadError) throw new Error(uploadError.message);

      const result = await registerTransactionDocument({
        transactionId: transaction.id,
        documentType,
        storagePath,
        fileName: file.name,
        contentType: file.type,
      });
      if (!result.ok) {
        await supabase.storage.from("transaction-documents").remove([storagePath]);
        throw new Error(result.message);
      }

      toast.success(`${DOCUMENT_LABELS[documentType]} added to the transaction.`);
      router.refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Unable to upload the document.");
    } finally {
      setIsUploading(false);
    }
  }

  return (
    <div className="mx-auto w-full max-w-6xl space-y-6 px-4 py-8 sm:px-6 lg:px-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <Link href={`/auctions/${transaction.vehicleId}`} className="text-sm font-medium text-slate-600 hover:text-slate-900 hover:underline">
            Back to listing
          </Link>
          <h1 className="mt-2 text-2xl font-semibold tracking-tight text-slate-900">Purchase workspace</h1>
          <p className="mt-1 text-sm text-slate-600">{transaction.title} <span className="font-mono text-xs">{transaction.vin}</span></p>
        </div>
        <div className="text-left sm:text-right">
          <p className="text-sm text-slate-600">Winning bid</p>
          <p className="text-2xl font-semibold text-slate-900">{formatCurrency(transaction.salePriceCents)}</p>
        </div>
      </div>

      {transaction.disputeStatus === "open" ? (
        <div className="flex gap-3 rounded-md border border-red-200 bg-red-50 p-4 text-sm text-red-900">
          <AlertTriangle className="mt-0.5 size-5 shrink-0" />
          <div><p className="font-semibold">Dispute open</p><p className="mt-1">{transaction.disputeReason}</p></div>
        </div>
      ) : null}

      <section className="grid gap-4 md:grid-cols-3">
        <div className="rounded-md border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-xs font-medium uppercase tracking-wide text-slate-500">Escrow</p>
          <p className="mt-2 text-sm font-semibold text-slate-900">{getEscrowStatusLabel(transaction.escrowStatus)}</p>
          <p className="mt-1 text-sm text-slate-600">{getPlatformFeeStatusLabel(transaction.platformFeeStatus)}</p>
        </div>
        <div className="rounded-md border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-xs font-medium uppercase tracking-wide text-slate-500">Title package</p>
          <p className="mt-2 text-sm font-semibold text-slate-900">{humanize(transaction.titleStatus)}</p>
          <p className="mt-1 text-sm text-slate-600">Provider verification advances title release.</p>
        </div>
        <div className="rounded-md border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-xs font-medium uppercase tracking-wide text-slate-500">Vehicle release</p>
          <p className="mt-2 text-sm font-semibold text-slate-900">{humanize(transaction.handoffStatus)}</p>
          <p className="mt-1 text-sm text-slate-600">{transaction.deliveryMethod ? `${humanize(transaction.deliveryMethod)} selected` : "Delivery plan pending"}</p>
        </div>
      </section>

      <section className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_360px]">
        <div className="space-y-6">
          <section className="rounded-md border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-center gap-3"><ShieldCheck className="size-5 text-slate-700" /><div><h2 className="text-base font-semibold text-slate-900">Closing milestones</h2><p className="mt-0.5 text-sm text-slate-600">Provider-controlled payment and title states protect both sides.</p></div></div>
            <div className="mt-6 space-y-5">
              <Milestone complete={paymentConfirmed} label="Funds confirmed" detail={paymentConfirmed ? "Escrow has confirmed vehicle funds." : "Awaiting secure escrow confirmation."} />
              <Milestone complete={titleSubmitted} label="Title package submitted" detail={titleVerified ? "Title package verified for release." : titleSubmitted ? "Awaiting provider verification." : "Seller uploads and submits the title package."} />
              <Milestone complete={vehicleReady} label="Vehicle ready" detail={vehicleReady ? "Dealer has prepared the vehicle for release." : "Unlocks after escrow confirms funds."} />
              <Milestone complete={handoffConfirmed} label="Handoff confirmed" detail={handoffConfirmed ? "Seller confirmed the vehicle handoff." : "Seller confirms once keys and vehicle leave the dealership."} />
              <Milestone complete={deliveryConfirmed} label="Buyer received vehicle" detail={deliveryConfirmed ? "Buyer confirmed receipt." : "Buyer confirms after pickup or delivery."} />
            </div>
          </section>

          <section className="rounded-md border border-slate-200 bg-white p-5 shadow-sm">
            <h2 className="text-base font-semibold text-slate-900">Transaction timeline</h2>
            <div className="mt-4 space-y-4">
              <div className="border-l-2 border-emerald-200 pl-4"><p className="text-sm font-medium text-slate-900">Auction award recorded</p><p className="mt-1 text-xs text-slate-600">The winning bid created this protected transaction workspace.</p></div>
              {transaction.events.length > 0 ? transaction.events.map((event) => <div key={event.id} className="border-l-2 border-slate-200 pl-4"><p className="text-sm font-medium text-slate-900">{humanize(event.eventType)}</p>{event.detail ? <p className="mt-1 text-sm text-slate-600">{event.detail}</p> : null}<p className="mt-1 text-xs text-slate-500">{formatEventDate(event.createdAt)}</p></div>) : null}
            </div>
          </section>
        </div>

        <aside className="space-y-6">
          <section className="rounded-md border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-center gap-3"><FileUp className="size-5 text-slate-700" /><div><h2 className="text-base font-semibold text-slate-900">Secure documents</h2><p className="mt-0.5 text-sm text-slate-600">Private to transaction participants and operations.</p></div></div>
            <div className="mt-4 space-y-3">
              <Select value={documentType} onChange={(event) => setDocumentType(event.target.value as keyof typeof DOCUMENT_LABELS)} className="h-10 border-slate-300 bg-white text-slate-900">
                {(Object.keys(DOCUMENT_LABELS) as Array<keyof typeof DOCUMENT_LABELS>).map((type) => <option key={type} value={type}>{DOCUMENT_LABELS[type]}</option>)}
              </Select>
              <Input type="file" accept="application/pdf,image/jpeg,image/png,image/webp" disabled={isUploading} onChange={(event) => { void uploadDocument(event.target.files?.[0] ?? null); event.currentTarget.value = ""; }} />
              {isUploading ? <p className="flex items-center gap-2 text-sm text-slate-600"><Loader2 className="size-4 animate-spin" />Uploading securely...</p> : null}
            </div>
            <div className="mt-4 space-y-2 border-t border-slate-100 pt-4">
              {transaction.documents.length > 0 ? transaction.documents.map((document) => <div key={document.id} className="flex items-center justify-between gap-3 text-sm"><span className="min-w-0 truncate text-slate-700">{document.fileName}</span><Badge variant="outline" className="shrink-0 border-slate-200 bg-slate-50 text-slate-600">{DOCUMENT_LABELS[document.documentType]}</Badge></div>) : <p className="text-sm text-slate-600">No documents added yet.</p>}
            </div>
          </section>

          {isBuyer ? <section className="rounded-md border border-slate-200 bg-white p-5 shadow-sm"><div className="flex items-center gap-3"><Truck className="size-5 text-slate-700" /><div><h2 className="text-base font-semibold text-slate-900">Delivery plan</h2><p className="mt-0.5 text-sm text-slate-600">Set pickup or transport details here.</p></div></div><div className="mt-4 space-y-3"><Select value={deliveryMethod} onChange={(event) => setDeliveryMethod(event.target.value as "pickup" | "transport")} className="h-10 border-slate-300 bg-white text-slate-900"><option value="pickup">Dealer pickup</option><option value="transport">Request transport</option></Select>{deliveryMethod === "transport" ? <Input value={deliveryAddress} onChange={(event) => setDeliveryAddress(event.target.value)} placeholder="Full delivery address" /> : null}<Button type="button" variant="outline" disabled={isPending || transaction.disputeStatus === "open"} onClick={() => runAction(() => setDeliveryPlan({ transactionId: transaction.id, method: deliveryMethod, deliveryAddress }), "Delivery plan saved.")} className="w-full">Save delivery plan</Button>{handoffConfirmed && !deliveryConfirmed ? <Button type="button" disabled={isPending} onClick={() => runAction(() => confirmDelivery(transaction.id), "Delivery confirmed.")} className="w-full bg-slate-900 text-white hover:bg-slate-800">Confirm vehicle received</Button> : null}</div></section> : null}

          {isSeller ? <section className="rounded-md border border-slate-200 bg-white p-5 shadow-sm"><div className="flex items-center gap-3"><MapPin className="size-5 text-slate-700" /><div><h2 className="text-base font-semibold text-slate-900">Dealer release</h2><p className="mt-0.5 text-sm text-slate-600">Release actions stay locked until escrow confirms funds.</p></div></div><div className="mt-4 space-y-3">{!titleSubmitted ? <Button type="button" variant="outline" disabled={isPending} onClick={() => runAction(() => submitTitlePackage(transaction.id), "Title package submitted for verification.")} className="w-full">Submit title package</Button> : null}{!vehicleReady ? <Button type="button" variant="outline" disabled={isPending} onClick={() => runAction(() => markVehicleReady(transaction.id), "Vehicle marked ready for release.")} className="w-full">Mark vehicle ready</Button> : null}{transaction.handoffStatus === "ready" ? <Button type="button" disabled={isPending} onClick={() => runAction(() => confirmVehicleHandoff(transaction.id), "Vehicle handoff confirmed.")} className="w-full bg-slate-900 text-white hover:bg-slate-800">Confirm vehicle handoff</Button> : null}</div></section> : null}

          <section className="rounded-md border border-slate-200 bg-white p-5 shadow-sm"><h2 className="text-base font-semibold text-slate-900">Need help?</h2>{transaction.disputeStatus === "none" ? <div className="mt-4 space-y-3"><textarea value={disputeReason} onChange={(event) => setDisputeReason(event.target.value)} className="min-h-24 w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:border-slate-400 focus:outline-none focus:ring-1 focus:ring-slate-400" placeholder="Describe a title, condition, payment, or delivery issue" /><Button type="button" variant="outline" disabled={isPending || disputeReason.trim().length < 10} onClick={() => runAction(() => openTransactionDispute(transaction.id, disputeReason), "Dispute opened for operations review.")} className="w-full border-red-200 text-red-800 hover:bg-red-50">Open a dispute</Button></div> : <p className="mt-2 text-sm text-slate-600">Operations has been notified. Use the transaction timeline and document area to keep the record complete.</p>}</section>
        </aside>
      </section>
    </div>
  );
}
