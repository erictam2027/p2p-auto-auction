import { DealerApplicationForm } from "@/components/dealer/dealer-application-form";
import { SiteHeader } from "@/components/layout/site-header";
import {
  Card,
  CardContent,
} from "@/components/ui/card";
import { isAdmin } from "@/lib/auth/profile";
import { createClient } from "@/lib/supabase/server";
import { Clock3 } from "lucide-react";
import { redirect } from "next/navigation";

export const metadata = {
  title: "Dealer Application | ApexAuction",
  description:
    "Apply for verified dealer access to syndicate inventory on ApexAuction.",
};

type Profile = {
  role: string | null;
  verification_status: string | null;
  dealership_name: string | null;
  dealer_license: string | null;
  phone: string | null;
};

function PendingApprovalCard({ profile }: { profile: Profile }) {
  return (
    <Card className="border-slate-200 bg-white shadow-sm">
      <CardContent className="px-6 py-12 text-center sm:px-10">
        <div className="mx-auto flex size-14 items-center justify-center rounded-full border border-slate-200 bg-slate-50">
          <Clock3 className="size-7 text-slate-700" />
        </div>
        <h1 className="mt-5 text-2xl font-semibold tracking-tight text-slate-900">
          Pending Admin Approval
        </h1>
        <p className="mx-auto mt-3 max-w-lg text-sm leading-relaxed text-slate-600">
          Your dealer application is under review by our trust & safety team. We
          will verify your license details before enabling dashboard access.
        </p>
        <div className="mx-auto mt-6 max-w-md rounded-md border border-slate-200 bg-slate-50 px-4 py-3 text-left">
          <p className="text-xs font-medium uppercase tracking-wide text-slate-600">
            Application
          </p>
          <p className="mt-1 text-sm font-semibold text-slate-900">
            {profile.dealership_name ?? "Dealership name pending"}
          </p>
          <p className="mt-0.5 font-mono text-xs text-slate-600">
            {profile.dealer_license ?? "License number pending"}
          </p>
          {profile.phone ? (
            <p className="mt-0.5 text-xs text-slate-600">{profile.phone}</p>
          ) : null}
        </div>
      </CardContent>
    </Card>
  );
}

export default async function DealerApplicationPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login?next=/dealer-application");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("role, verification_status, dealership_name, dealer_license, phone")
    .eq("id", user.id)
    .maybeSingle<Profile>();

  if (isAdmin(profile)) {
    redirect("/dashboard");
  }

  if (profile?.role === "dealer" && profile.verification_status === "verified") {
    redirect("/dashboard");
  }

  const isPending = profile?.verification_status === "pending";

  return (
    <div className="flex min-h-full flex-1 flex-col bg-slate-50 text-slate-900">
      <SiteHeader />

      <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-10 sm:px-6 lg:px-8">
        <div className="mb-8 text-center">
          <p className="text-xs font-medium uppercase tracking-wide text-slate-600">
            Dealer Partner Access
          </p>
          <h1 className="mt-3 text-2xl font-semibold tracking-tight text-slate-900 sm:text-3xl">
            Verify Your Dealership
          </h1>
          <p className="mx-auto mt-3 max-w-xl text-sm leading-relaxed text-slate-600">
            Dealer dashboard access is limited to verified licensed dealers.
            Submit your credentials and our trust & safety team will review them.
          </p>
        </div>

        {isPending && profile ? (
          <PendingApprovalCard profile={profile} />
        ) : (
          <DealerApplicationForm
            defaultValues={{
              dealershipName: profile?.dealership_name,
              dealerLicense: profile?.dealer_license,
              phone: profile?.phone,
            }}
          />
        )}
      </main>
    </div>
  );
}
