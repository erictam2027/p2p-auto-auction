import { SiteHeader } from "@/components/layout/site-header";
import { ForgotPasswordForm } from "@/components/auth/forgot-password-form";

export const metadata = {
  title: "Forgot Password | ApexAuction",
  description: "Request a password reset link for your ApexAuction account.",
};

export default async function ForgotPasswordPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const params = await searchParams;

  return (
    <div className="flex min-h-full flex-1 flex-col bg-slate-50 text-slate-900">
      <SiteHeader />
      <main className="flex flex-1 items-center justify-center px-4 py-12 sm:px-6">
        <ForgotPasswordForm error={params.error} />
      </main>
    </div>
  );
}
