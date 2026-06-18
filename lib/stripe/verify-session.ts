import { getStripe } from "@/lib/stripe/server";
import type Stripe from "stripe";

export async function verifyCompletedSetupSession(
  sessionId: string,
  userId: string,
): Promise<{ ok: true } | { ok: false; message: string }> {
  const stripe = getStripe();

  let session: Stripe.Checkout.Session;

  try {
    session = await stripe.checkout.sessions.retrieve(sessionId);
  } catch {
    return { ok: false, message: "Unable to verify Stripe checkout session." };
  }

  if (session.mode !== "setup") {
    return { ok: false, message: "Invalid checkout session type." };
  }

  if (session.status !== "complete") {
    return { ok: false, message: "Card setup is not complete yet." };
  }

  if (session.metadata?.supabase_user_id !== userId) {
    return { ok: false, message: "This checkout session does not belong to your account." };
  }

  return { ok: true };
}

export async function verifyCompletedPaymentSession(
  sessionId: string,
  userId: string,
  escrowTransactionId: string,
): Promise<{ ok: true } | { ok: false; message: string }> {
  const stripe = getStripe();

  let session: Stripe.Checkout.Session;

  try {
    session = await stripe.checkout.sessions.retrieve(sessionId);
  } catch {
    return { ok: false, message: "Unable to verify Stripe checkout session." };
  }

  if (session.mode !== "payment") {
    return { ok: false, message: "Invalid checkout session type." };
  }

  if (session.payment_status !== "paid" && session.status !== "complete") {
    return { ok: false, message: "Platform fee payment is not complete yet." };
  }

  if (session.metadata?.supabase_user_id !== userId) {
    return { ok: false, message: "This checkout session does not belong to your account." };
  }

  if (session.metadata?.escrow_transaction_id !== escrowTransactionId) {
    return { ok: false, message: "Escrow transaction mismatch." };
  }

  return { ok: true };
}
