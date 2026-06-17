import { SiteHeader } from "@/components/layout/site-header";
import { LoginForm } from "@/components/auth/login-form";

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
