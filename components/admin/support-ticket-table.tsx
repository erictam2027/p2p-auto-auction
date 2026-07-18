"use client";

import { updateSupportTicketStatus } from "@/app/admin/actions";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { toast } from "sonner";

export type SupportTicketRow = {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  topic: string;
  message: string;
  status: "new" | "in_progress" | "resolved";
  createdAt: string;
};

function formatCreatedAt(value: string) {
  const parsed = Date.parse(value);
  return Number.isFinite(parsed)
    ? new Intl.DateTimeFormat("en-US", {
        month: "short",
        day: "numeric",
        hour: "numeric",
        minute: "2-digit",
      }).format(new Date(parsed))
    : "Recently";
}

export function SupportTicketTable({ tickets }: { tickets: SupportTicketRow[] }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  function advance(ticket: SupportTicketRow) {
    const nextStatus = ticket.status === "new" ? "in_progress" : "resolved";

    startTransition(async () => {
      try {
        await updateSupportTicketStatus(ticket.id, nextStatus);
        toast.success(
          nextStatus === "resolved" ? "Request resolved." : "Request moved to in progress.",
        );
        router.refresh();
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "Unable to update the request.");
      }
    });
  }

  return (
    <div className="space-y-3">
      {tickets.map((ticket) => (
        <article key={ticket.id} className="border-b border-slate-100 pb-4 last:border-0 last:pb-0">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <p className="text-sm font-semibold text-slate-900">{ticket.name}</p>
                <Badge variant="outline" className="border-slate-200 bg-slate-50 text-slate-700">
                  {ticket.topic.replaceAll("_", " ")}
                </Badge>
                <Badge
                  variant="outline"
                  className={
                    ticket.status === "resolved"
                      ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                      : ticket.status === "in_progress"
                        ? "border-amber-200 bg-amber-50 text-amber-700"
                        : "border-slate-200 bg-white text-slate-700"
                  }
                >
                  {ticket.status.replaceAll("_", " ")}
                </Badge>
              </div>
              <p className="mt-1 text-xs text-slate-500">
                {ticket.email}{ticket.phone ? ` · ${ticket.phone}` : ""} · {formatCreatedAt(ticket.createdAt)}
              </p>
              <p className="mt-3 max-w-3xl whitespace-pre-wrap text-sm leading-6 text-slate-700">
                {ticket.message}
              </p>
            </div>
            {ticket.status !== "resolved" ? (
              <Button
                type="button"
                size="sm"
                variant="outline"
                disabled={pending}
                onClick={() => advance(ticket)}
                className="shrink-0 border-slate-300"
              >
                {ticket.status === "new" ? "Start" : "Resolve"}
              </Button>
            ) : null}
          </div>
        </article>
      ))}
    </div>
  );
}
