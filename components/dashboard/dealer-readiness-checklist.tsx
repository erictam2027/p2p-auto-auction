import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ArrowRight, CheckCircle2, CircleDashed } from "lucide-react";

export type DealerReadinessChecklistItem = {
  id: string;
  title: string;
  description: string;
  href: string;
  actionLabel: string;
  isComplete: boolean;
};

type DealerReadinessChecklistProps = {
  items: DealerReadinessChecklistItem[];
};

export function DealerReadinessChecklist({ items }: DealerReadinessChecklistProps) {
  const completedCount = items.filter((item) => item.isComplete).length;
  const nextItem = items.find((item) => !item.isComplete);

  return (
    <section
      aria-labelledby="dealer-readiness-title"
      className="rounded-md border border-slate-200 bg-white p-5 shadow-sm"
    >
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 id="dealer-readiness-title" className="text-base font-semibold text-slate-900">
            Dealer Readiness
          </h2>
          <p className="mt-1 text-sm text-slate-600">
            Keep the account, listings, and auction lane ready for buyers.
          </p>
        </div>
        <Badge variant="outline" className="border-slate-200 bg-slate-50 text-slate-700">
          {completedCount}/{items.length}
        </Badge>
      </div>

      <div className="mt-5 space-y-3">
        {items.map((item) => {
          const Icon = item.isComplete ? CheckCircle2 : CircleDashed;

          return (
            <div
              key={item.id}
              className="grid grid-cols-[auto_minmax(0,1fr)_auto] items-start gap-3 rounded-md border border-slate-200 px-3 py-3"
            >
              <Icon
                className={
                  item.isComplete
                    ? "mt-0.5 size-4 text-emerald-600"
                    : "mt-0.5 size-4 text-slate-400"
                }
              />
              <div className="min-w-0">
                <p className="text-sm font-medium text-slate-900">{item.title}</p>
                <p className="mt-0.5 text-xs leading-5 text-slate-600">
                  {item.description}
                </p>
              </div>
              <Link
                href={item.href}
                className="inline-flex items-center gap-1 text-xs font-medium text-slate-700 underline-offset-4 hover:text-slate-950 hover:underline"
              >
                {item.actionLabel}
                <ArrowRight className="size-3" />
              </Link>
            </div>
          );
        })}
      </div>

      {nextItem ? (
        <Button
          className="mt-5 w-full bg-slate-900 text-white hover:bg-slate-800"
          nativeButton={false}
          render={<Link href={nextItem.href} />}
        >
          {nextItem.actionLabel}
          <ArrowRight className="size-4" />
        </Button>
      ) : (
        <div className="mt-5 rounded-md border border-emerald-200 bg-emerald-50 px-3 py-3">
          <p className="text-sm font-medium text-emerald-800">
            Your dealer lane is ready.
          </p>
          <p className="mt-1 text-xs leading-5 text-emerald-700">
            Keep adding fresh inventory and monitoring active auctions from this overview.
          </p>
        </div>
      )}
    </section>
  );
}
