type BuildKeySavvyCheckoutUrlInput = {
  vin: string;
  salePriceDollars: number;
  vehicleId: string;
  returnUrl: string;
};

export function buildKeySavvyCheckoutUrl(input: BuildKeySavvyCheckoutUrlInput): string {
  const affiliateId = process.env.KEYSAVVY_AFFILIATE_ID?.trim();
  const partnerSlug = process.env.KEYSAVVY_PARTNER_SLUG?.trim();
  const customBase = process.env.KEYSAVVY_CHECKOUT_BASE_URL?.trim();

  const baseUrl =
    customBase ??
    (partnerSlug
      ? `https://www.keysavvy.com/partners/${partnerSlug}`
      : "https://www.keysavvy.com/pay-private-seller");

  const params = new URLSearchParams();

  if (affiliateId) {
    params.set("aaId", affiliateId);
  }

  if (input.vin) {
    params.set("vin", input.vin);
  }

  params.set("price", String(input.salePriceDollars));
  params.set("ref", input.vehicleId);
  params.set("returnUrl", input.returnUrl);

  return `${baseUrl}?${params.toString()}`;
}
