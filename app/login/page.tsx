import { SiteHeader } from "@/components/layout/site-header";
import { LoginForm } from "@/components/auth/login-form";
import { getPostLoginPath } from "@/lib/auth/profile";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

export const metadata = {
  title: "Sign In | ApexAuction",
  description:
    "Sign in to your ApexAuction account to bid, sell, and manage escrow-secured transactions.",
};

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string; error?: string; message?: string; next?: string }>;
}) {
  const params = await searchParams;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("role, verification_status")
      .eq("id", user.id)
      .maybeSingle();

    redirect(getPostLoginPath(profile, params.next));
  }

  return (
    <div className="flex min-h-full flex-1 flex-col bg-slate-50 text-slate-900">
      <SiteHeader />
      <main className="flex flex-1 items-center justify-center px-4 py-12 sm:px-6">
        <LoginForm
          defaultTab={(params.tab === "signup" ? "signup" : "signin") as "signin" | "signup"}
          error={params.error}
          message={params.message}
          next={params.next}
        />
      </main>
    </div>
  );
}
