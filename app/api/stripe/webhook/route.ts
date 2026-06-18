import { getStripe } from "@/lib/stripe/server";
import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";
import type Stripe from "stripe";

function getSupabaseAdmin() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceRoleKey) {
    return null;
  }

  return createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}

async function markPlatformFeePaid(escrowTransactionId: string) {
  const supabase = getSupabaseAdmin();

  if (!supabase) {
    throw new Error("Supabase admin client is not configured.");
  }

  const { error } = await supabase
    .from("escrow_transactions")
    .update({
      platform_fee_status: "paid",
      updated_at: new Date().toISOString(),
    })
    .eq("id", escrowTransactionId);

  if (error) {
    throw error;
  }
}

async function markCardOnFile(userId: string) {
  const supabase = getSupabaseAdmin();

  if (!supabase) {
    throw new Error("Supabase admin client is not configured.");
  }

  const { error } = await supabase
    .from("profiles")
    .update({ has_card_on_file: true })
    .eq("id", userId);

  if (error) {
    throw error;
  }
}

export async function POST(request: Request) {
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!webhookSecret) {
    return NextResponse.json(
      { error: "STRIPE_WEBHOOK_SECRET is not configured." },
      { status: 500 },
    );
  }

  const signature = request.headers.get("stripe-signature");

  if (!signature) {
    return NextResponse.json({ error: "Missing Stripe signature." }, { status: 400 });
  }

  const stripe = getStripe();
  const payload = await request.text();

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(payload, signature, webhookSecret);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Invalid webhook signature.";
    return NextResponse.json({ error: message }, { status: 400 });
  }

  try {
    if (event.type === "checkout.session.completed") {
      const session = event.data.object as Stripe.Checkout.Session;

      if (session.mode === "setup") {
        const userId = session.metadata?.supabase_user_id;

        if (userId) {
          await markCardOnFile(userId);
        }
      }

      if (session.mode === "payment") {
        const escrowTransactionId = session.metadata?.escrow_transaction_id;

        if (escrowTransactionId) {
          await markPlatformFeePaid(escrowTransactionId);
        }
      }
    }

    if (event.type === "setup_intent.succeeded") {
      const setupIntent = event.data.object as Stripe.SetupIntent;
      const userId = setupIntent.metadata?.supabase_user_id;

      if (userId) {
        await markCardOnFile(userId);
      }
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Webhook handler failed.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
