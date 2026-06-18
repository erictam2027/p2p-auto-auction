import { DealerTable } from "@/components/admin/DealerTable";
import { SiteHeader } from "@/components/layout/site-header";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { ShieldCheck } from "lucide-react";
import { redirect } from "next/navigation";

export const metadata = {
  title: "Admin Control Center | ApexAuction",
  description: "Review and approve pending dealer verification applications.",
};

type PendingProfileRow = {
  id: string;
  dealership_name: string | null;
  phone: string | null;
};

async function getPendingDealerProfiles() {
  const supabase = await createClient();
  const { data: pendingProfiles, error } = await supabase
    .from("profiles")
    .select("id, dealership_name, phone")
    .eq("role", "dealer")
    .eq("verification_status", "pending")
    .order("dealership_name", { ascending: true });

  if (error || !pendingProfiles) {
    return [];
  }

  const adminClient = createAdminClient();

  return Promise.all(
    pendingProfiles.map(async (profile: PendingProfileRow) => {
      if (!adminClient) {
        return {
          id: profile.id,
          dealership_name: profile.dealership_name,
          email: null,
          phone: profile.phone,
        };
      }

      const { data: authUser } = await adminClient.auth.admin.getUserById(profile.id);

      return {
        id: profile.id,
        dealership_name: profile.dealership_name,
        email: authUser.user?.email ?? null,
        phone: profile.phone ?? authUser.user?.phone ?? null,
      };
    }),
  );
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
    .select("role")
    .eq("id", user.id)
    .maybeSingle();

  if (profile?.role !== "admin") {
    redirect("/");
  }

  const pendingProfiles = await getPendingDealerProfiles();

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
                  Pending Dealership Applications
                </CardTitle>
                <CardDescription className="mt-1 text-slate-600">
                  {pendingProfiles.length === 1
                    ? "1 application awaiting review"
                    : `${pendingProfiles.length} applications awaiting review`}
                </CardDescription>
              </div>
            </div>
          </CardHeader>

          <CardContent className="pt-6">
            <DealerTable profiles={pendingProfiles} />
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
