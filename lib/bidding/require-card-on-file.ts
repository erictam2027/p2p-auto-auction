import type { createClient } from "@/lib/supabase/server";

export async function requireCardOnFile(
  supabase: Awaited<ReturnType<typeof createClient>>,
  userId: string,
): Promise<{ ok: true } | { ok: false; error: string }> {
  const { data: profile, error } = await supabase
    .from("profiles")
    .select("has_card_on_file")
    .eq("id", userId)
    .maybeSingle();

  if (error) {
    return { ok: false, error: error.message };
  }

  if (!profile?.has_card_on_file) {
    return {
      ok: false,
      error: "Add a credit card to your account before placing bids.",
    };
  }

  return { ok: true };
}
