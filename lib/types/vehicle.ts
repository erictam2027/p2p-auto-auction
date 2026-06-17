export type VehicleListingModule = {
  knownFlaws: string[];
  recentService: string[];
  modifications: string[];
  equipment: string[];
};

export type Vehicle = {
  id: string;
  vin: string;
  year: number;
  make: string;
  model: string;
  mileage: number;
  listing: VehicleListingModule;
  nmvtisVerified: boolean;
  inspectionAvailable: boolean;
};
