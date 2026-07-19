"use server";

import { getPostLoginPath } from "@/lib/auth/profile";
import { getSiteUrlPath } from "@/lib/site-url";
import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

async function fetchProfile(userId: string) {
  const supabase = await createClient();
  const { data } = await supabase
    .from("profiles")
    .select("role, verification_status")
    .eq("id", userId)
    .maybeSingle();

  return data;
}

async function redirectAfterAuth(next?: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const profile = await fetchProfile(user.id);
  revalidatePath("/", "layout");
  redirect(getPostLoginPath(profile, next));
}

export async function signInWithEmail(formData: FormData) {
  const email = String(formData.get("email"));
  const password = String(formData.get("password"));
  const next = String(formData.get("next") || "");

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) {
    redirect(`/login?error=${encodeURIComponent(error.message)}`);
  }

  await redirectAfterAuth(next || undefined);
}

export async function signUpWithEmail(formData: FormData) {
  const email = String(formData.get("email"));
  const password = String(formData.get("password"));
  const next = String(formData.get("next") || "");

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      emailRedirectTo: getSiteUrlPath("/auth/callback"),
    },
  });

  if (error) {
    redirect(`/login?tab=signup&error=${encodeURIComponent(error.message)}`);
  }

  if (!data.session) {
    const { error: signInError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (signInError) {
      redirect(
        `/login?tab=signup&error=${encodeURIComponent(signInError.message)}`,
      );
    }
  }

  if (data.user) {
    await supabase.from("profiles").upsert(
      {
        id: data.user.id,
        role: "consumer",
        verification_status: "unverified",
      },
      { onConflict: "id" },
    );
  }

  await redirectAfterAuth(next || undefined);
}

export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  revalidatePath("/", "layout");
  redirect("/");
}
