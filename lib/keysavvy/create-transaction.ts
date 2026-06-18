import { buildKeySavvyCheckoutUrl } from "@/lib/keysavvy/build-checkout-url";

type CreateKeySavvyTransactionInput = {
  vehicleId: string;
  vin: string;
  salePriceDollars: number;
  buyerEmail: string;
  sellerEmail: string;
  returnUrl: string;
  webhookUrl: string;
};

type CreateKeySavvyTransactionResult = {
  transactionId: string | null;
  checkoutUrl: string;
  mode: "api" | "referral";
};

type KeySavvyApiResponse = {
  transaction_id?: string;
  id?: string;
  checkout_url?: string;
  url?: string;
};

function readApiCheckoutUrl(payload: KeySavvyApiResponse): string | null {
  return payload.checkout_url ?? payload.url ?? null;
}

function readApiTransactionId(payload: KeySavvyApiResponse): string | null {
  return payload.transaction_id ?? payload.id ?? null;
}

export async function createKeySavvyTransaction(
  input: CreateKeySavvyTransactionInput,
): Promise<CreateKeySavvyTransactionResult> {
  const apiKey = process.env.KEYSAVVY_API_KEY?.trim();
  const apiBaseUrl = process.env.KEYSAVVY_API_BASE_URL?.trim();

  if (apiKey && apiBaseUrl) {
    try {
      const response = await fetch(`${apiBaseUrl.replace(/\/$/, "")}/transactions`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          external_reference_id: input.vehicleId,
          vin: input.vin,
          sale_price: input.salePriceDollars,
          buyer: { email: input.buyerEmail },
          seller: { email: input.sellerEmail },
          success_url: input.returnUrl,
          cancel_url: input.returnUrl.replace("keysavvy=return", "keysavvy=cancelled"),
          webhook_url: input.webhookUrl,
        }),
      });

      if (response.ok) {
        const payload = (await response.json()) as KeySavvyApiResponse;
        const checkoutUrl = readApiCheckoutUrl(payload);

        if (checkoutUrl) {
          return {
            transactionId: readApiTransactionId(payload),
            checkoutUrl,
            mode: "api",
          };
        }
      }
    } catch (error) {
      console.error("KeySavvy API transaction creation failed:", error);
    }
  }

  return {
    transactionId: null,
    checkoutUrl: buildKeySavvyCheckoutUrl({
      vin: input.vin,
      salePriceDollars: input.salePriceDollars,
      vehicleId: input.vehicleId,
      returnUrl: input.returnUrl,
    }),
    mode: "referral",
  };
}
