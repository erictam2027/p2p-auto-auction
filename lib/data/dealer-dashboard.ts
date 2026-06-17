export type DealerLiveAuction = {
  id: string;
  vin: string;
  year: number;
  make: string;
  model: string;
  currentBidCents: number;
  endsIn: string;
  watchers: number;
  reserveMet: boolean;
};

export type DealerPayoutTransaction = {
  id: string;
  vehicle: string;
  vin: string;
  amountCents: number;
  completedAt: string;
  keysavvyTransferId: string;
  status: "completed" | "processing";
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
    vin: "WBS8M9C50MA5D1234",
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
    vin: "W1NYC7HJ0LX123456",
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
    vin: "1FMEE5DP9PLA12345",
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
    vin: "1G1YC3D40N5123456",
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
    vin: "WP0AA2A99NS123456",
    year: 2022,
    make: "Porsche",
    model: "911",
    currentBidCents: 14250000,
    endsIn: "2h 14m",
    watchers: 128,
    reserveMet: false,
  },
];

export const dealerPayoutTransactions: DealerPayoutTransaction[] = [
  {
    id: "pay-001",
    vehicle: "2019 Audi RS5 Sportback",
    vin: "WAUB4AF49KA123456",
    amountCents: 5420000,
    completedAt: "Jun 12, 2026",
    keysavvyTransferId: "KS-TRF-88421",
    status: "completed",
  },
  {
    id: "pay-002",
    vehicle: "2020 BMW M340i",
    vin: "WBA5R1C05LAC12345",
    amountCents: 4890000,
    completedAt: "Jun 8, 2026",
    keysavvyTransferId: "KS-TRF-88304",
    status: "completed",
  },
  {
    id: "pay-003",
    vehicle: "2021 Tesla Model 3 Performance",
    vin: "5YJ3E1EA8MF123456",
    amountCents: 3650000,
    completedAt: "Jun 3, 2026",
    keysavvyTransferId: "KS-TRF-88112",
    status: "completed",
  },
  {
    id: "pay-004",
    vehicle: "2018 Porsche Cayenne S",
    vin: "WP1AA2A52JLA12345",
    amountCents: 4125000,
    completedAt: "May 28, 2026",
    keysavvyTransferId: "KS-TRF-87988",
    status: "completed",
  },
];

export const dealerProfileDefaults = {
  legalName: "Pacific Coast Motors LLC",
  licenseNumber: "DLR-CA-482910",
  businessAddress: "1200 Harbor Blvd, San Diego, CA 92101",
};
