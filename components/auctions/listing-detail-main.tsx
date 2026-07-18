"use client";

import type { ListingDetail } from "@/lib/data/listing-details";
import { ListingGallery } from "@/components/auctions/listing-gallery";

type ListingDetailMainProps = {
  listing: ListingDetail;
  title: string;
};

export function ListingDetailMain({ listing, title }: ListingDetailMainProps) {
  return (
    <ListingGallery
      imageUrls={listing.imageUrls}
      title={title}
    />
  );
}
