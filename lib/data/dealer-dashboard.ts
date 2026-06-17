export type DealerLiveAuction = {
  id: string;
  year: number;
  make: string;
  model: string;
  currentBidCents: number;
  endsIn: string;
  watchers: number;
  reserveMet: boolean;
};

export type DealerDashboardMetrics = {
  totalActiveVehicles: number;
  pageViews7d: number;
  activeWatchers: number;
  pendingEscrowPayoutsCents: number;
};

export const dealerMetrics: DealerDashboardMetrics = {
  totalActiveVehicles: 12,
  pageViews7d: 4821,
  activeWatchers: 342,
  pendingEscrowPayoutsCents: 12840000,
};

export const dealerLiveAuctions: DealerLiveAuction[] = [
  {
    id: "auc-001",
    year: 2021,
    make: "BMW",
    model: "M3",
    currentBidCents: 6850000,
    endsIn: "4h 02m",
    watchers: 58,
    reserveMet: true,
  },
  {
    id: "auc-002",
    year: 2020,
    make: "Mercedes-Benz",
    model: "G63",
    currentBidCents: 11890000,
    endsIn: "1h 38m",
    watchers: 91,
    reserveMet: false,
  },
  {
    id: "auc-003",
    year: 2023,
    make: "Ford",
    model: "Bronco",
    currentBidCents: 7240000,
    endsIn: "6h 45m",
    watchers: 34,
    reserveMet: true,
  },
  {
    id: "auc-005",
    year: 2022,
    make: "Chevrolet",
    model: "Corvette",
    currentBidCents: 9875000,
    endsIn: "5h 20m",
    watchers: 72,
    reserveMet: false,
  },
  {
    id: "featured-001",
    year: 2022,
    make: "Porsche",
    model: "911",
    currentBidCents: 14250000,
    endsIn: "2h 14m",
    watchers: 128,
    reserveMet: false,
  },
];
