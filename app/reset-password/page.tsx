import { SiteHeader } from "@/components/layout/site-header";
import { ResetPasswordForm } from "@/components/auth/reset-password-form";

export const metadata = {
  title: "Reset Password | ApexAuction",
  description: "Set a new password for your ApexAuction account.",
};

export default async function ResetPasswordPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const params = await searchParams;

  return (
    <div className="flex min-h-full flex-1 flex-col bg-slate-50 text-slate-900">
      <SiteHeader />
      <main className="flex flex-1 items-center justify-center px-4 py-12 sm:px-6">
        <ResetPasswordForm error={params.error} />
      </main>
    </div>
  );
}
