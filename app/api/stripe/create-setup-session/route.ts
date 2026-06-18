import { getStripe } from "@/lib/stripe/server";
import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

type CreateSetupSessionBody = {
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

    const body = (await request.json()) as CreateSetupSessionBody;
    const vehicleId = body.vehicleId?.trim();

    if (!vehicleId) {
      return NextResponse.json({ error: "Vehicle ID is required." }, { status: 400 });
    }

    const origin = new URL(request.url).origin;
    const listingUrl = `${origin}/auctions/${vehicleId}`;

    const stripe = getStripe();
    const session = await stripe.checkout.sessions.create({
      mode: "setup",
      payment_method_types: ["card"],
      success_url: `${listingUrl}?card_setup=success&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${listingUrl}?card_setup=cancelled`,
      customer_email: user.email ?? undefined,
      metadata: {
        supabase_user_id: user.id,
      },
    });

    if (!session.url) {
      return NextResponse.json(
        { error: "Unable to create Stripe checkout session." },
        { status: 500 },
      );
    }

    return NextResponse.json({ url: session.url });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to create setup session.";

    return NextResponse.json({ error: message }, { status: 500 });
  }
}
