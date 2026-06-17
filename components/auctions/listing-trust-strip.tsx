import { BadgeCheck, ShieldCheck } from "lucide-react";

const TRUST_SEALS = [
  { label: "KeySavvy Escrow", icon: ShieldCheck },
  { label: "NMVTIS Title Verified", icon: BadgeCheck },
] as const;

export function ListingTrustStrip() {
  return (
    <div className="flex flex-wrap gap-2 border-t border-slate-200 pt-4">
      {TRUST_SEALS.map(({ label, icon: Icon }) => (
        <span
          key={label}
          className="inline-flex items-center gap-1.5 rounded border border-slate-200 bg-slate-50 px-2.5 py-1 text-[11px] font-medium text-slate-700"
        >
          <Icon className="size-3.5 shrink-0 text-slate-500" aria-hidden />
          {label}
        </span>
      ))}
    </div>
  );
}
