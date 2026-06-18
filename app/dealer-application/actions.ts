"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export type SubmitDealerApplicationInput = {
  dealershipName: string;
  dealerLicense: string;
  phone: string;
};

export type SubmitDealerApplicationResult =
  | { ok: true }
  | { ok: false; message: string };

export async function submitDealerApplication(
  input: SubmitDealerApplicationInput,
): Promise<SubmitDealerApplicationResult> {
  const dealershipName = input.dealershipName.trim();
  const dealerLicense = input.dealerLicense.trim();
  const phone = input.phone.trim();

  if (!dealershipName || !dealerLicense || !phone) {
    return { ok: false, message: "Please complete all required fields." };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { ok: false, message: "You must be signed in to submit an application." };
  }

  const { data: updatedProfile, error } = await supabase
    .from("profiles")
    .update({
      dealership_name: dealershipName,
      dealer_license: dealerLicense,
      phone,
      role: "dealer",
      verification_status: "pending",
    })
    .eq("id", user.id)
    .select("id")
    .maybeSingle();

  if (error) {
    return { ok: false, message: error.message };
  }

  if (!updatedProfile) {
    const { error: insertError } = await supabase.from("profiles").upsert(
      {
        id: user.id,
        dealership_name: dealershipName,
        dealer_license: dealerLicense,
        phone,
        role: "dealer",
        verification_status: "pending",
      },
      { onConflict: "id" },
    );

    if (insertError) {
      return { ok: false, message: insertError.message };
    }
  }

  revalidatePath("/dealer-application");
  revalidatePath("/admin");
  return { ok: true };
}
