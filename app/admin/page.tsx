import { PendingDealersTable } from "@/components/admin/pending-dealers-table";
import { SiteHeader } from "@/components/layout/site-header";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { isAdmin } from "@/lib/auth/profile";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { ShieldCheck } from "lucide-react";
import { redirect } from "next/navigation";

export const metadata = {
  title: "Admin Control Center | ApexAuction",
  description: "Review and approve pending dealer verification applications.",
};

type PendingProfile = {
  id: string;
  dealership_name: string | null;
  dealer_license: string | null;
};

async function getPendingDealersWithEmail() {
  const supabase = await createClient();
  const { data: pendingProfiles, error } = await supabase
    .from("profiles")
    .select("id, dealership_name, dealer_license")
    .eq("verification_status", "pending")
    .order("dealership_name", { ascending: true });

  if (error || !pendingProfiles) {
    return [];
  }

  const adminClient = createAdminClient();

  const dealers = await Promise.all(
    pendingProfiles.map(async (profile: PendingProfile) => {
      if (!adminClient) {
        return {
          ...profile,
          email: null,
        };
      }

      const { data: authUser } = await adminClient.auth.admin.getUserById(
        profile.id,
      );

      return {
        ...profile,
        email: authUser.user?.email ?? null,
      };
    }),
  );

  return dealers;
}

export default async function AdminPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login?next=/admin");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("role, verification_status")
    .eq("id", user.id)
    .maybeSingle();

  if (!isAdmin(profile)) {
    redirect("/");
  }

  const pendingDealers = await getPendingDealersWithEmail();

  return (
    <div className="flex min-h-full flex-1 flex-col bg-slate-50 text-slate-900">
      <SiteHeader />

      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-8">
          <p className="text-xs font-medium uppercase tracking-wide text-slate-600">
            Admin Control Center
          </p>
          <h1 className="mt-2 text-2xl font-semibold tracking-tight text-slate-900 sm:text-3xl">
            Dealer Application Review
          </h1>
          <p className="mt-2 max-w-2xl text-sm leading-relaxed text-slate-600">
            Review pending dealership credentials and approve verified dealers for
            dashboard access.
          </p>
        </div>

        <Card className="border-slate-200 bg-white shadow-sm">
          <CardHeader className="border-b border-slate-200 pb-6">
            <div className="flex items-start gap-4">
              <div className="flex size-11 shrink-0 items-center justify-center rounded-md border border-slate-200 bg-slate-50">
                <ShieldCheck className="size-5 text-slate-700" />
              </div>
              <div>
                <CardTitle className="text-lg font-semibold text-slate-900">
                  Pending Applications
                </CardTitle>
                <CardDescription className="mt-1 text-slate-600">
                  {pendingDealers.length === 1
                    ? "1 application awaiting approval"
                    : `${pendingDealers.length} applications awaiting approval`}
                </CardDescription>
              </div>
            </div>
          </CardHeader>

          <CardContent className="pt-6">
            <PendingDealersTable dealers={pendingDealers} />
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
