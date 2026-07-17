"use server";

import {
  createPersonaInquiry,
  getPersonaInquiryStatus,
  markIdentityVerifiedLocallyAllowed,
} from "@/lib/trust/persona";
import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export type IdentityActionResult =
  | { ok: true; url?: string; status?: string }
  | { ok: false; message: string };

export async function startIdentityVerification(): Promise<IdentityActionResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { ok: false, message: "You must be signed in." };
  }

  if (markIdentityVerifiedLocallyAllowed()) {
    const { error } = await supabase
      .from("profiles")
      .update({
        identity_status: "verified",
        identity_verified_at: new Date().toISOString(),
      })
      .eq("id", user.id);

    if (error) {
      return { ok: false, message: error.message };
    }

    revalidatePath("/profile");
    return { ok: true, status: "verified" };
  }

  const inquiry = await createPersonaInquiry({
    referenceId: user.id,
    email: user.email ?? undefined,
  });

  if (!inquiry.ok) {
    return inquiry;
  }

  const { error } = await supabase
    .from("profiles")
    .update({
      persona_inquiry_id: inquiry.inquiryId,
      identity_status: "pending",
    })
    .eq("id", user.id);

  if (error) {
    return { ok: false, message: error.message };
  }

  revalidatePath("/profile");
  return { ok: true, url: inquiry.hostedUrl, status: "pending" };
}

export async function refreshIdentityStatus(): Promise<IdentityActionResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { ok: false, message: "You must be signed in." };
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("persona_inquiry_id, identity_status")
    .eq("id", user.id)
    .maybeSingle();

  if (!profile?.persona_inquiry_id) {
    return { ok: true, status: profile?.identity_status ?? "unverified" };
  }

  const statusResult = await getPersonaInquiryStatus(profile.persona_inquiry_id);

  if (!statusResult.ok) {
    return statusResult;
  }

  const { error } = await supabase
    .from("profiles")
    .update({
      identity_status: statusResult.status,
      identity_verified_at:
        statusResult.status === "verified" ? new Date().toISOString() : null,
    })
    .eq("id", user.id);

  if (error) {
    return { ok: false, message: error.message };
  }

  revalidatePath("/profile");
  return { ok: true, status: statusResult.status };
}
