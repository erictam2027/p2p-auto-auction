import { canPayPlatformFee } from "@/lib/escrow/status-labels";
import { getStripe } from "@/lib/stripe/server";
import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

type CreatePlatformFeeSessionBody = {
  vehicleId?: string;
};

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "You must be signed in." }, { status: 401 });
    }

    const body = (await request.json()) as CreatePlatformFeeSessionBody;
    const vehicleId = body.vehicleId?.trim();

    if (!vehicleId) {
      return NextResponse.json({ error: "Vehicle ID is required." }, { status: 400 });
    }

    const { data: escrow, error: escrowError } = await supabase
      .from("escrow_transactions")
      .select("id, buyer_id, platform_fee_cents, platform_fee_status, sale_price, status")
      .eq("vehicle_id", vehicleId)
      .maybeSingle();

    if (escrowError || !escrow) {
      return NextResponse.json({ error: "Escrow record not found." }, { status: 404 });
    }

    if (escrow.buyer_id !== user.id) {
      return NextResponse.json({ error: "Only the winning bidder can pay the platform fee." }, { status: 403 });
    }

    if (!canPayPlatformFee(escrow.status)) {
      return NextResponse.json(
        { error: "Start KeySavvy checkout before paying the platform fee." },
        { status: 400 },
      );
    }

    if (escrow.platform_fee_status === "paid") {
      return NextResponse.json({ error: "Platform fee is already paid." }, { status: 400 });
    }

    const origin = new URL(request.url).origin;
    const listingUrl = `${origin}/auctions/${vehicleId}`;

    const stripe = getStripe();
    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      payment_method_types: ["card"],
      line_items: [
        {
          quantity: 1,
          price_data: {
            currency: "usd",
            unit_amount: escrow.platform_fee_cents,
            product_data: {
              name: "ApexAuction facilitation fee",
              description: `5% platform fee on ${formatCurrencyLabel(escrow.sale_price)} winning bid`,
            },
          },
        },
      ],
      success_url: `${listingUrl}?platform_fee=success&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${listingUrl}?platform_fee=cancelled`,
      customer_email: user.email ?? undefined,
      metadata: {
        supabase_user_id: user.id,
        escrow_transaction_id: escrow.id,
        vehicle_id: vehicleId,
      },
    });

    if (!session.url) {
      return NextResponse.json(
        { error: "Unable to create Stripe checkout session." },
        { status: 500 },
      );
    }

    await supabase
      .from("escrow_transactions")
      .update({
        stripe_checkout_session_id: session.id,
        updated_at: new Date().toISOString(),
      })
      .eq("id", escrow.id);

    return NextResponse.json({ url: session.url });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to create platform fee session.";

    return NextResponse.json({ error: message }, { status: 500 });
  }
}

function formatCurrencyLabel(salePriceDollars: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(salePriceDollars);
}
