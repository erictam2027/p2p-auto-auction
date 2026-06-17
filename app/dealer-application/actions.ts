"use server";

import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

export async function submitDealerApplication(formData: FormData) {
  const dealershipName = String(formData.get("dealership_name") ?? "").trim();
  const dealerLicense = String(formData.get("dealer_license") ?? "").trim();

  if (!dealershipName || !dealerLicense) {
    redirect("/dealer-application?error=Please+complete+all+required+fields.");
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login?next=/dealer-application");
  }

  const { error } = await supabase.from("profiles").upsert(
    {
      id: user.id,
      role: "dealer",
      verification_status: "pending",
      dealership_name: dealershipName,
      dealer_license: dealerLicense,
    },
    { onConflict: "id" },
  );

  if (error) {
    redirect(`/dealer-application?error=${encodeURIComponent(error.message)}`);
  }

  redirect("/dealer-application");
}
