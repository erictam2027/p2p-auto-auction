import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import type { DealerDashboardMetrics } from "@/lib/data/dealer-dashboard";
import { formatCurrency } from "@/lib/utils/format";
import { Car, Clock, Eye, Wallet } from "lucide-react";

type MetricCardsProps = {
  metrics: DealerDashboardMetrics;
};

const METRIC_CONFIG = [
  {
    key: "totalActiveVehicles" as const,
    label: "Total Active Vehicles",
    icon: Car,
    format: (value: number) => value.toLocaleString(),
  },
  {
    key: "pageViews7d" as const,
    label: "Total Page Views",
    sublabel: "Last 7 days",
    icon: Eye,
    format: (value: number) => value.toLocaleString(),
  },
  {
    key: "activeWatchers" as const,
    label: "Active Watchers",
    icon: Clock,
    format: (value: number) => value.toLocaleString(),
  },
  {
    key: "pendingEscrowPayoutsCents" as const,
    label: "Pending Escrow Payouts",
    icon: Wallet,
    format: (value: number) => formatCurrency(value),
  },
];

export function MetricCards({ metrics }: MetricCardsProps) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {METRIC_CONFIG.map(({ key, label, sublabel, icon: Icon, format }) => (
        <Card
          key={key}
          className="border border-slate-200 bg-white shadow-sm ring-0"
        >
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-slate-600">
              {label}
            </CardTitle>
            <Icon className="size-4 text-slate-400" />
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-semibold text-slate-900">
              {format(metrics[key])}
            </p>
            {sublabel && (
              <p className="mt-1 text-xs text-slate-500">{sublabel}</p>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
