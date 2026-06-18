"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export type UpdateDealerSettingsResult =
  | { ok: true }
  | { ok: false; message: string };

export async function updateDealerSettings(input: {
  dealershipName: string;
  dealerLicense: string;
  phone: string;
}): Promise<UpdateDealerSettingsResult> {
  const dealershipName = input.dealershipName.trim();
  const dealerLicense = input.dealerLicense.trim();
  const phone = input.phone.trim();

  if (!dealershipName || !dealerLicense) {
    return { ok: false, message: "Dealership name and license number are required." };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { ok: false, message: "You must be signed in." };
  }

  const { error } = await supabase
    .from("profiles")
    .update({
      dealership_name: dealershipName,
      dealer_license: dealerLicense,
      phone: phone || null,
    })
    .eq("id", user.id);

  if (error) {
    return { ok: false, message: error.message };
  }

  revalidatePath("/dashboard/settings");
  revalidatePath("/dashboard");
  return { ok: true };
}
