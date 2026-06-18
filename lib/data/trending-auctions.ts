export type TrendingAuction = {
  id: string;
  year: number;
  make: string;
  model: string;
  trim: string;
  mileage: number;
  location: string;
  currentBidCents: number;
  bidCount: number;
  endsIn: string;
  endTime: string;
  imageUrl?: string;
  nmvtisVerified: boolean;
  inspectionAvailable: boolean;
};

export const featuredAuction: TrendingAuction = {
  id: "featured-001",
  year: 2022,
  make: "Porsche",
  model: "911",
  trim: "Carrera S",
  mileage: 12400,
  location: "Los Angeles, CA",
  currentBidCents: 14250000,
  bidCount: 47,
  endsIn: "2h 14m",
  endTime: new Date(Date.now() + 2 * 60 * 60 * 1000 + 14 * 60 * 1000).toISOString(),
  nmvtisVerified: true,
  inspectionAvailable: true,
};

export const trendingAuctions: TrendingAuction[] = [
  {
    id: "auc-001",
    year: 2021,
    make: "BMW",
    model: "M3",
    trim: "Competition",
    mileage: 18200,
    location: "Austin, TX",
    currentBidCents: 6850000,
    bidCount: 31,
    endsIn: "4h 12m",
    endTime: new Date(Date.now() + (4 * 60 + 12) * 60 * 1000).toISOString(),
    nmvtisVerified: true,
    inspectionAvailable: true,
  },
  {
    id: "auc-002",
    year: 2020,
    make: "Mercedes-Benz",
    model: "G63",
    trim: "AMG",
    mileage: 24100,
    location: "Miami, FL",
    currentBidCents: 11890000,
    bidCount: 52,
    endsIn: "1h 38m",
    endTime: new Date(Date.now() + (1 * 60 + 38) * 60 * 1000).toISOString(),
    nmvtisVerified: true,
    inspectionAvailable: false,
  },
  {
    id: "auc-003",
    year: 2023,
    make: "Ford",
    model: "Bronco",
    trim: "Raptor",
    mileage: 8900,
    location: "Denver, CO",
    currentBidCents: 7240000,
    bidCount: 19,
    endsIn: "6h 45m",
    endTime: new Date(Date.now() + (6 * 60 + 45) * 60 * 1000).toISOString(),
    nmvtisVerified: true,
    inspectionAvailable: true,
  },
  {
    id: "auc-004",
    year: 2019,
    make: "Tesla",
    model: "Model S",
    trim: "Performance",
    mileage: 35600,
    location: "Seattle, WA",
    currentBidCents: 5420000,
    bidCount: 24,
    endsIn: "3h 11m",
    endTime: new Date(Date.now() + (3 * 60 + 11) * 60 * 1000).toISOString(),
    nmvtisVerified: true,
    inspectionAvailable: true,
  },
  {
    id: "auc-005",
    year: 2022,
    make: "Chevrolet",
    model: "Corvette",
    trim: "Z06",
    mileage: 6200,
    location: "Phoenix, AZ",
    currentBidCents: 9875000,
    bidCount: 38,
    endsIn: "5h 20m",
    endTime: new Date(Date.now() + (5 * 60 + 20) * 60 * 1000).toISOString(),
    nmvtisVerified: true,
    inspectionAvailable: true,
  },
  {
    id: "auc-006",
    year: 2021,
    make: "Land Rover",
    model: "Defender",
    trim: "110 V8",
    mileage: 21500,
    location: "Chicago, IL",
    currentBidCents: 8120000,
    bidCount: 16,
    endsIn: "8h 55m",
    endTime: new Date(Date.now() + (8 * 60 + 55) * 60 * 1000).toISOString(),
    nmvtisVerified: true,
    inspectionAvailable: false,
  },
];
