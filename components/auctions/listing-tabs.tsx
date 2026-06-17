"use client";

import type { ListingDetail } from "@/lib/data/listing-details";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";

type ListingTabsProps = {
  listing: ListingDetail;
};

export function ListingTabs({ listing }: ListingTabsProps) {
  return (
    <Tabs defaultValue="history" className="mt-8">
      <TabsList
        variant="line"
        className="h-auto w-full justify-start gap-0 rounded-none border-b border-slate-200 bg-transparent p-0"
      >
        <TabsTrigger
          value="history"
          className="rounded-none px-4 py-3 text-slate-600 data-active:text-slate-900"
        >
          Vehicle History
        </TabsTrigger>
        <TabsTrigger
          value="flaws"
          className="rounded-none px-4 py-3 text-slate-600 data-active:text-slate-900"
        >
          Known Flaws
        </TabsTrigger>
        <TabsTrigger
          value="comments"
          className="rounded-none px-4 py-3 text-slate-600 data-active:text-slate-900"
        >
          Community Comments
        </TabsTrigger>
      </TabsList>

      <TabsContent value="history" className="pt-6">
        <div className="rounded-md border border-slate-200 bg-white">
          <dl className="divide-y divide-slate-100">
            {listing.vehicleHistory.map((entry) => (
              <div
                key={entry.label}
                className="grid gap-1 px-4 py-3 sm:grid-cols-[200px_1fr]"
              >
                <dt className="text-sm font-medium text-slate-900">{entry.label}</dt>
                <dd className="text-sm text-slate-600">{entry.value}</dd>
              </div>
            ))}
          </dl>
        </div>

        <div className="mt-6 grid gap-4 sm:grid-cols-2">
          <section className="rounded-md border border-slate-200 bg-white p-4">
            <h3 className="text-sm font-semibold text-slate-900">Recent Service</h3>
            <ul className="mt-3 space-y-2">
              {listing.recentService.map((item) => (
                <li key={item} className="text-sm text-slate-600">
                  {item}
                </li>
              ))}
            </ul>
          </section>
          <section className="rounded-md border border-slate-200 bg-white p-4">
            <h3 className="text-sm font-semibold text-slate-900">Equipment</h3>
            <ul className="mt-3 space-y-2">
              {listing.equipment.map((item) => (
                <li key={item} className="text-sm text-slate-600">
                  {item}
                </li>
              ))}
            </ul>
          </section>
        </div>
      </TabsContent>

      <TabsContent value="flaws" className="pt-6">
        <div className="rounded-md border border-slate-200 bg-white p-5">
          <p className="text-sm text-slate-600">
            Seller-disclosed imperfections documented during the Legit Check inspection.
            Transparency is required for all ApexAuction listings.
          </p>
          <ul className="mt-4 space-y-3">
            {listing.knownFlaws.map((flaw) => (
              <li
                key={flaw}
                className="flex gap-3 border-b border-slate-100 pb-3 text-sm text-slate-700 last:border-0 last:pb-0"
              >
                <span className="mt-1.5 size-1.5 shrink-0 rounded-full bg-slate-400" />
                {flaw}
              </li>
            ))}
          </ul>
        </div>

        <section className="mt-4 rounded-md border border-slate-200 bg-white p-5">
          <h3 className="text-sm font-semibold text-slate-900">Modifications</h3>
          <ul className="mt-3 space-y-2">
            {listing.modifications.map((item) => (
              <li key={item} className="text-sm text-slate-600">
                {item}
              </li>
            ))}
          </ul>
        </section>
      </TabsContent>

      <TabsContent value="comments" className="pt-6">
        <div className="space-y-4">
          {listing.comments.map((comment) => (
            <article
              key={comment.id}
              className="rounded-md border border-slate-200 bg-white p-4"
            >
              <header className="flex items-center justify-between gap-2">
                <p className="text-sm font-medium text-slate-900">{comment.author}</p>
                <time className="text-xs text-slate-600">{comment.postedAt}</time>
              </header>
              <p className="mt-2 text-sm leading-relaxed text-slate-600">{comment.body}</p>
            </article>
          ))}
        </div>
      </TabsContent>
    </Tabs>
  );
}
