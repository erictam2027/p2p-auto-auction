"use server";

import { verifyCompletedSetupSession } from "@/lib/stripe/verify-session";
import { createClient } from "@/lib/supabase/server";

export async function confirmCardOnFile(
  sessionId?: string,
): Promise<{ ok: true } | { ok: false; message: string }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { ok: false, message: "You must be signed in." };
  }

  const trimmedSessionId = sessionId?.trim();

  if (!trimmedSessionId) {
    return { ok: false, message: "Missing Stripe checkout session." };
  }

  const verification = await verifyCompletedSetupSession(trimmedSessionId, user.id);

  if (!verification.ok) {
    return verification;
  }

  const { error } = await supabase
    .from("profiles")
    .update({ has_card_on_file: true })
    .eq("id", user.id);

  if (error) {
    return { ok: false, message: error.message };
  }

  return { ok: true };
}
