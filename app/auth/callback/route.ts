import { getPostLoginPath } from "@/lib/auth/profile";
import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

function sanitizeNextParam(next: string | null) {
  if (next && next.startsWith("/") && !next.startsWith("//")) {
    return next;
  }

  return "/";
}

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = sanitizeNextParam(searchParams.get("next"));

  if (!code) {
    return NextResponse.redirect(
      `${origin}/login?error=${encodeURIComponent("Authentication failed.")}`,
    );
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.exchangeCodeForSession(code);

  if (error) {
    return NextResponse.redirect(
      `${origin}/login?error=${encodeURIComponent(error.message)}`,
    );
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.redirect(
      `${origin}/login?error=${encodeURIComponent("Authentication failed.")}`,
    );
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("role, verification_status")
    .eq("id", user.id)
    .maybeSingle();

  if (!profile) {
    await supabase.from("profiles").upsert(
      {
        id: user.id,
        role: "consumer",
        verification_status: "unverified",
      },
      { onConflict: "id" },
    );
  }

  const destination = getPostLoginPath(profile, next);
  return NextResponse.redirect(`${origin}${destination}`);
}
