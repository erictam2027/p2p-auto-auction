"use client";

import type { ListingDetail } from "@/lib/data/listing-details";
import { Button } from "@/components/ui/button";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";

type ListingDetailTabsProps = {
  listing: ListingDetail;
};

function BulletList({ items }: { items: string[] }) {
  return (
    <ul className="space-y-2.5">
      {items.map((item) => (
        <li key={item} className="flex gap-3 text-sm leading-relaxed text-slate-700">
          <span className="mt-2 size-1.5 shrink-0 rounded-full bg-slate-400" />
          {item}
        </li>
      ))}
    </ul>
  );
}

function SectionBlock({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-md border border-slate-200 bg-white p-5">
      <h3 className="text-sm font-semibold text-slate-900">{title}</h3>
      {description ? (
        <p className="mt-1 text-sm text-slate-600">{description}</p>
      ) : null}
      <div className="mt-4">{children}</div>
    </section>
  );
}

export function ListingDetailTabs({ listing }: ListingDetailTabsProps) {
  return (
    <Tabs defaultValue="overview" className="mt-10 gap-6">
      <TabsList
        variant="line"
        className="h-auto w-full justify-start gap-0 rounded-none border-b border-slate-200 bg-transparent p-0"
      >
        <TabsTrigger
          value="overview"
          className="rounded-none px-4 py-3 text-slate-600 data-active:text-slate-900"
        >
          Overview
        </TabsTrigger>
        <TabsTrigger
          value="condition"
          className="rounded-none px-4 py-3 text-slate-600 data-active:text-slate-900"
        >
          Condition &amp; Flaws
        </TabsTrigger>
        <TabsTrigger
          value="comments"
          className="rounded-none px-4 py-3 text-slate-600 data-active:text-slate-900"
        >
          Comments &amp; Q&amp;A
        </TabsTrigger>
      </TabsList>

      <TabsContent value="overview" className="space-y-4 pt-2">
        <SectionBlock
          title="Highlights"
          description="Key features and selling points for this listing."
        >
          <BulletList items={listing.highlights} />
        </SectionBlock>

        <SectionBlock
          title="Modifications"
          description="Aftermarket or seller-reported changes from stock configuration."
        >
          <BulletList items={listing.modifications} />
        </SectionBlock>

        <SectionBlock
          title="Recent Service"
          description="Documented maintenance and reconditioning performed prior to listing."
        >
          <BulletList items={listing.recentService} />
        </SectionBlock>
      </TabsContent>

      <TabsContent value="condition" className="pt-2">
        <SectionBlock
          title="Known Flaws"
          description="Transparent disclosures documented during the trust & safety review process."
        >
          <BulletList items={listing.knownFlaws} />
        </SectionBlock>
      </TabsContent>

      <TabsContent value="comments" className="pt-2">
        <div className="rounded-md border border-slate-200 bg-white p-5">
          <h3 className="text-sm font-semibold text-slate-900">Ask a Question</h3>
          <p className="mt-1 text-sm text-slate-600">
            Public Q&amp;A helps all bidders evaluate this vehicle before placing offers.
          </p>

          <div className="mt-4 space-y-3">
            <textarea
              placeholder="Ask a question about condition, history, or logistics..."
              className="min-h-24 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:border-slate-400 focus:outline-none focus:ring-1 focus:ring-slate-400"
            />
            <div className="flex justify-end">
              <Button
                type="button"
                className="bg-slate-900 text-white hover:bg-slate-800"
              >
                Post Question
              </Button>
            </div>
          </div>

          <div className="mt-8 space-y-4 border-t border-slate-200 pt-6">
            <h4 className="text-sm font-semibold text-slate-900">Recent Questions</h4>

            <article className="rounded-md border border-slate-200 bg-slate-50 p-4">
              <div className="flex items-center justify-between gap-3">
                <p className="text-sm font-semibold text-slate-900">Verified Buyer</p>
                <time className="text-xs text-slate-500">2 days ago</time>
              </div>
              <p className="mt-2 text-sm leading-relaxed text-slate-700">
                Is the inspection report available before auction close? Interested in
                confirming tire tread depth and brake pad measurements.
              </p>
            </article>
          </div>
        </div>
      </TabsContent>
    </Tabs>
  );
}
