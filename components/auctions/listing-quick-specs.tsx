import type { ListingDetail } from "@/lib/data/listing-details";
import { formatMileage } from "@/lib/utils/format";

type ListingQuickSpecsProps = {
  listing: ListingDetail;
};

type SpecItem = {
  label: string;
  value: string;
};

export function ListingQuickSpecs({ listing }: ListingQuickSpecsProps) {
  const specs: SpecItem[] = [
    { label: "VIN", value: listing.vin },
    {
      label: "Mileage",
      value: listing.mileage > 0 ? `${formatMileage(listing.mileage)} miles` : "Pending",
    },
    { label: "Engine", value: listing.engine },
    { label: "Transmission", value: listing.transmission },
    { label: "Drivetrain", value: listing.drivetrain },
    { label: "Exterior Color", value: listing.exteriorColor },
    { label: "Interior Color", value: listing.interiorColor },
    { label: "Title Status", value: listing.titleStatus },
  ];

  return (
    <div className="rounded-md border border-slate-200 bg-white p-5 shadow-sm">
      <h2 className="text-sm font-semibold text-slate-900">Quick Specs</h2>
      <dl className="mt-4 grid grid-cols-1 gap-x-6 gap-y-4 sm:grid-cols-2">
        {specs.map((spec) => (
          <div key={spec.label} className="space-y-1">
            <dt className="text-xs font-medium uppercase tracking-wide text-slate-500">
              {spec.label}
            </dt>
            <dd
              className={`text-sm font-semibold text-slate-900 ${
                spec.label === "VIN" ? "font-mono text-xs sm:text-sm" : ""
              }`}
            >
              {spec.value}
            </dd>
          </div>
        ))}
      </dl>
    </div>
  );
}
