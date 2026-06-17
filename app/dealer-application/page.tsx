import { submitDealerApplication } from "@/app/dealer-application/actions";
import { SiteHeader } from "@/components/layout/site-header";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { createClient } from "@/lib/supabase/server";
import { Building2, Clock3, FileText, ShieldCheck } from "lucide-react";
import { redirect } from "next/navigation";

export const metadata = {
  title: "Dealer Application | ApexAuction",
  description:
    "Apply for verified dealer access to syndicate inventory on ApexAuction.",
};

type DealerApplicationPageProps = {
  searchParams: Promise<{ error?: string }>;
};

type Profile = {
  role: string | null;
  verification_status: string | null;
  dealership_name: string | null;
  dealer_license: string | null;
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
        </div>
      </CardContent>
    </Card>
  );
}

function ApplicationForm({
  error,
  profile,
}: {
  error?: string;
  profile?: Profile | null;
}) {
  return (
    <Card className="border-slate-200 bg-white shadow-sm">
      <CardHeader className="border-b border-slate-200 pb-6">
        <div className="flex items-start gap-4">
          <div className="flex size-11 shrink-0 items-center justify-center rounded-md border border-slate-200 bg-slate-50">
            <ShieldCheck className="size-5 text-slate-700" />
          </div>
          <div>
            <CardTitle className="text-xl font-semibold text-slate-900">
              Dealer Verification
            </CardTitle>
            <CardDescription className="mt-1 text-slate-600">
              Submit your dealership credentials for trust & safety review.
            </CardDescription>
          </div>
        </div>
      </CardHeader>

      <form action={submitDealerApplication}>
        <CardContent className="space-y-5 pt-6">
          {error ? (
            <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
              {decodeURIComponent(error)}
            </div>
          ) : null}

          <div className="space-y-2">
            <label
              htmlFor="dealership_name"
              className="text-sm font-medium text-slate-900"
            >
              Dealership Name
            </label>
            <div className="relative">
              <Building2 className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
              <Input
                id="dealership_name"
                name="dealership_name"
                required
                defaultValue={profile?.dealership_name ?? ""}
                placeholder="e.g. Pacific Coast Motors LLC"
                className="h-11 border-slate-300 bg-white pl-10 text-slate-900"
              />
            </div>
          </div>

          <div className="space-y-2">
            <label
              htmlFor="dealer_license"
              className="text-sm font-medium text-slate-900"
            >
              Dealer License Number
            </label>
            <div className="relative">
              <FileText className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
              <Input
                id="dealer_license"
                name="dealer_license"
                required
                defaultValue={profile?.dealer_license ?? ""}
                placeholder="e.g. DL-482910"
                className="h-11 border-slate-300 bg-white pl-10 font-mono text-slate-900"
              />
            </div>
            <p className="text-xs text-slate-600">
              Use the license number issued by your state motor vehicle agency.
            </p>
          </div>
        </CardContent>

        <CardFooter className="justify-end border-t border-slate-200 bg-slate-50 px-6 py-4">
          <Button className="bg-slate-900 text-white hover:bg-slate-800">
            Submit for Review
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
}

export default async function DealerApplicationPage({
  searchParams,
}: DealerApplicationPageProps) {
  const params = await searchParams;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login?next=/dealer-application");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("role, verification_status, dealership_name, dealer_license")
    .eq("id", user.id)
    .maybeSingle<Profile>();

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

        {isPending ? (
          <PendingApprovalCard profile={profile} />
        ) : (
          <ApplicationForm error={params.error} profile={profile} />
        )}
      </main>
    </div>
  );
}
