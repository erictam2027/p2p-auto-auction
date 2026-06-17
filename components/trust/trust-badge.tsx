import { cn } from "@/lib/utils";
import {
  BadgeCheck,
  ShieldCheck,
  Wrench,
  type LucideIcon,
} from "lucide-react";

const badgeConfig = {
  escrow: {
    label: "KeySavvy Escrow",
    icon: ShieldCheck,
  },
  nmvtis: {
    label: "NMVTIS Verified",
    icon: BadgeCheck,
  },
  inspection: {
    label: "Inspection Available",
    icon: Wrench,
  },
} as const satisfies Record<
  string,
  { label: string; icon: LucideIcon }
>;

type TrustBadgeVariant = keyof typeof badgeConfig;

type TrustBadgeProps = {
  variant: TrustBadgeVariant;
  className?: string;
  compact?: boolean;
};

export function TrustBadge({ variant, className, compact = false }: TrustBadgeProps) {
  const { label, icon: Icon } = badgeConfig[variant];

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 border border-slate-200 bg-slate-50 text-slate-700",
        compact
          ? "rounded px-2 py-0.5 text-[11px] font-medium"
          : "rounded-md px-2.5 py-1 text-xs font-medium",
        className,
      )}
    >
      <Icon
        className={cn(
          compact ? "size-3" : "size-3.5",
          "shrink-0 text-slate-500",
        )}
        aria-hidden
      />
      {label}
    </span>
  );
}

export function TrustBadgeGroup({
  nmvtisVerified,
  inspectionAvailable,
  className,
  compact = false,
}: {
  nmvtisVerified: boolean;
  inspectionAvailable: boolean;
  className?: string;
  compact?: boolean;
}) {
  return (
    <div className={cn("flex flex-wrap gap-1.5", className)}>
      <TrustBadge variant="escrow" compact={compact} />
      {nmvtisVerified && <TrustBadge variant="nmvtis" compact={compact} />}
      {inspectionAvailable && <TrustBadge variant="inspection" compact={compact} />}
    </div>
  );
}
