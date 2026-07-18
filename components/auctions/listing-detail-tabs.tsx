"use client";

import type { ListingDetail } from "@/lib/data/listing-details";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";

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

function SaleTerms({ listing }: ListingDetailTabsProps) {
  const saleLight = listing.saleLight.toLowerCase();
  const saleTerms =
    saleLight === "green"
      ? {
          label: "Green - seller representation",
          description: "Seller reports no known major defects beyond the disclosed listing details.",
          className: "border-emerald-200 bg-emerald-50 text-emerald-800",
        }
      : saleLight === "red"
        ? {
            label: "Red - sold as-is",
            description: "The vehicle is offered as-is, subject to the marketplace terms and stated disclosures.",
            className: "border-red-200 bg-red-50 text-red-800",
          }
        : saleLight === "yellow"
          ? {
              label: "Yellow - disclosures apply",
              description: "Review the seller announcements and known flaws before bidding.",
              className: "border-amber-200 bg-amber-50 text-amber-800",
            }
          : {
              label: "Terms not supplied",
              description: "Ask the seller to clarify sale terms before bidding.",
              className: "border-slate-200 bg-slate-50 text-slate-700",
            };

  const titleAvailability =
    listing.titlePresent === true
      ? "Title in seller possession"
      : listing.titlePresent === false
        ? "Title not currently in possession"
        : "Title availability not supplied";

  return (
    <SectionBlock
      title="Sale Terms"
      description="Seller-reported terms help you evaluate this auction. They are not an independent inspection."
    >
      <div className="space-y-4">
        <div className="flex flex-wrap items-center gap-3">
          <Badge variant="outline" className={saleTerms.className}>
            {saleTerms.label}
          </Badge>
          <p className="text-sm text-slate-700">{saleTerms.description}</p>
        </div>
        <dl className="grid gap-3 text-sm sm:grid-cols-2">
          <div>
            <dt className="text-slate-500">Title</dt>
            <dd className="mt-0.5 font-medium text-slate-900">{titleAvailability}</dd>
          </div>
          <div>
            <dt className="text-slate-500">Condition grade</dt>
            <dd className="mt-0.5 font-medium text-slate-900">
              {listing.conditionGrade === null
                ? "Not supplied"
                : `${listing.conditionGrade.toFixed(1)} / 5.0`}
            </dd>
          </div>
        </dl>
        {listing.sellerAnnouncements.length > 0 ? (
          <div className="border-t border-slate-100 pt-4">
            <p className="mb-3 text-sm font-medium text-slate-900">Seller announcements</p>
            <BulletList items={listing.sellerAnnouncements} />
          </div>
        ) : null}
      </div>
    </SectionBlock>
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

      <TabsContent value="condition" className="space-y-4 pt-2">
        <SaleTerms listing={listing} />
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
