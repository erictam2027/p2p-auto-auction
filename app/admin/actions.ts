"use server";

import { isAdmin } from "@/lib/auth/profile";
import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export type ApproveDealerResult =
  | { ok: true }
  | { ok: false; message: string };

export async function approveDealerApplication(
  profileId: string,
): Promise<ApproveDealerResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { ok: false, message: "You must be signed in." };
  }

  const { data: adminProfile } = await supabase
    .from("profiles")
    .select("role, verification_status")
    .eq("id", user.id)
    .maybeSingle();

  if (!isAdmin(adminProfile)) {
    return { ok: false, message: "You are not authorized to approve dealers." };
  }

  const { error } = await supabase
    .from("profiles")
    .update({ verification_status: "verified" })
    .eq("id", profileId)
    .eq("verification_status", "pending");

  if (error) {
    return { ok: false, message: error.message };
  }

  revalidatePath("/admin");
  return { ok: true };
}
