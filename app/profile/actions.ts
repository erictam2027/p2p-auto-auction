"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export type UpdateProfileResult =
  | { ok: true }
  | { ok: false; message: string };

export async function updateProfile(
  dealershipName: string,
): Promise<UpdateProfileResult> {
  const trimmedName = dealershipName.trim();

  if (!trimmedName) {
    return { ok: false, message: "Display name is required." };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { ok: false, message: "You must be signed in to update your profile." };
  }

  const { error } = await supabase
    .from("profiles")
    .update({ dealership_name: trimmedName })
    .eq("id", user.id);

  if (error) {
    return { ok: false, message: error.message };
  }

  revalidatePath("/profile");
  return { ok: true };
}
