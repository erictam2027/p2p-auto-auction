"use client";

import type { ListingDetail } from "@/lib/data/listing-details";
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
          <h3 className="text-sm font-semibold text-slate-900">Questions about this vehicle?</h3>
          <p className="mt-2 text-sm leading-relaxed text-slate-600">
            Use the Message Seller button on this listing to ask about condition, history,
            transport, or pickup logistics. Verified dealers respond through the secure
            ApexAuction inbox.
          </p>
          <p className="mt-4 text-xs text-slate-500">
            Public Q&amp;A threads will be enabled in a future release.
          </p>
        </div>
      </TabsContent>
    </Tabs>
  );
}
