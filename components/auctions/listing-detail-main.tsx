"use client";

import type { ListingDetail } from "@/lib/data/listing-details";
import { ListingGallery } from "@/components/auctions/listing-gallery";
import { ListingTabs } from "@/components/auctions/listing-tabs";

type ListingDetailMainProps = {
  listing: ListingDetail;
  title: string;
};

export function ListingDetailMain({ listing, title }: ListingDetailMainProps) {
  return (
    <>
      <ListingGallery imageCount={listing.imageCount} title={title} />
      <ListingTabs listing={listing} />
    </>
  );
}
