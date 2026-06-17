export type AuctionStatus = "draft" | "live" | "ended" | "settled";

export type Auction = {
  id: string;
  vehicleId: string;
  status: AuctionStatus;
  currentBidCents: number;
  endsAt: string;
  bidCount: number;
};
