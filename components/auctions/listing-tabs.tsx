"use client";

import type { ListingDetail } from "@/lib/data/listing-details";
import {
  Tabs,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { useState } from "react";

type ListingTabsProps = {
  listing: ListingDetail;
};

type TabValue = "info" | "condition" | "dealer";

function VehicleInfoPanel({ listing }: { listing: ListingDetail }) {
  return (
    <>
      <div className="rounded-md border border-slate-200 bg-white">
        <dl className="divide-y divide-slate-100">
          {listing.vehicleHistory.map((entry) => (
            <div
              key={entry.label}
              className="grid gap-1 px-4 py-3 sm:grid-cols-[180px_1fr]"
            >
              <dt className="text-sm font-medium text-slate-900">{entry.label}</dt>
              <dd className="text-sm text-slate-600">{entry.value}</dd>
            </div>
          ))}
          <div className="grid gap-1 px-4 py-3 sm:grid-cols-[180px_1fr]">
            <dt className="text-sm font-medium text-slate-900">VIN</dt>
            <dd className="font-mono text-sm text-slate-600">{listing.vin}</dd>
          </div>
        </dl>
      </div>

      <div className="mt-4 grid gap-4 sm:grid-cols-2">
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
    </>
  );
}

function ConditionReportPanel({ listing }: { listing: ListingDetail }) {
  return (
    <>
      <div className="rounded-md border border-slate-200 bg-white p-5">
        <h3 className="text-sm font-semibold text-slate-900">Known Flaws</h3>
        <p className="mt-1 text-sm text-slate-600">
          Documented during the certified Legit Check inspection.
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
    </>
  );
}

function DealerNotesPanel({ listing }: { listing: ListingDetail }) {
  return (
    <div className="rounded-md border border-slate-200 bg-white p-5">
      <h3 className="text-sm font-semibold text-slate-900">From the Seller</h3>
      <p className="mt-1 text-sm text-slate-600">
        Notes provided by the listing dealer.
      </p>
      <ul className="mt-4 space-y-4">
        {listing.dealerNotes.map((note) => (
          <li
            key={note}
            className="border-b border-slate-100 pb-4 text-sm leading-relaxed text-slate-700 last:border-0 last:pb-0"
          >
            {note}
          </li>
        ))}
      </ul>
    </div>
  );
}

export function ListingTabs({ listing }: ListingTabsProps) {
  const [activeTab, setActiveTab] = useState<TabValue>("info");

  function renderActivePanel() {
    switch (activeTab) {
      case "info":
        return <VehicleInfoPanel listing={listing} />;
      case "condition":
        return <ConditionReportPanel listing={listing} />;
      case "dealer":
        return <DealerNotesPanel listing={listing} />;
      default:
        return null;
    }
  }

  return (
    <Tabs
      value={activeTab}
      onValueChange={(value) => setActiveTab(value as TabValue)}
      className="mt-8"
    >
      <TabsList
        variant="line"
        className="h-auto w-full justify-start gap-0 rounded-none border-b border-slate-200 bg-transparent p-0"
      >
        <TabsTrigger
          value="info"
          className="rounded-none px-4 py-3 text-slate-600 data-active:text-slate-900"
        >
          Vehicle Info
        </TabsTrigger>
        <TabsTrigger
          value="condition"
          className="rounded-none px-4 py-3 text-slate-600 data-active:text-slate-900"
        >
          Condition Report
        </TabsTrigger>
        <TabsTrigger
          value="dealer"
          className="rounded-none px-4 py-3 text-slate-600 data-active:text-slate-900"
        >
          Dealer Notes
        </TabsTrigger>
      </TabsList>

      <div className="pt-6" role="tabpanel">
        {renderActivePanel()}
      </div>
    </Tabs>
  );
}
