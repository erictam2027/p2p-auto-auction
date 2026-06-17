import { BadgeCheck, ShieldCheck, Wrench } from "lucide-react";

const TRUST_SEALS = [
  { label: "KeySavvy Escrow", icon: ShieldCheck },
  { label: "Clean Title Verified", icon: BadgeCheck },
  { label: "Inspected", icon: Wrench },
] as const;

export function ListingTrustStrip() {
  return (
    <div className="space-y-2 border-t border-slate-200 pt-4">
      {TRUST_SEALS.map(({ label, icon: Icon }) => (
        <div
          key={label}
          className="flex items-center gap-2.5 rounded-md border border-slate-200 bg-slate-50 px-3 py-2"
        >
          <Icon className="size-4 shrink-0 text-slate-500" aria-hidden />
          <span className="text-xs font-medium text-slate-700">{label}</span>
        </div>
      ))}
    </div>
  );
}
