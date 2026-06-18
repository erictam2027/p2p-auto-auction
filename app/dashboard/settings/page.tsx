import { DealerSettingsForm } from "@/components/dashboard/dealer-settings-form";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

export const metadata = {
  title: "Settings | Dealer Portal | ApexAuction",
  description: "Manage your dealership profile and licensing information.",
};

export default async function SettingsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login?next=/dashboard/settings");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("dealership_name, dealer_license, phone")
    .eq("id", user.id)
    .maybeSingle();

  return (
    <div className="flex min-h-screen flex-col">
      <header className="sticky top-0 z-30 border-b border-slate-200 bg-white px-6 py-5 lg:px-8">
        <h1 className="text-lg font-semibold text-slate-900">Settings</h1>
        <p className="mt-1 text-sm text-slate-600">
          Update your dealership profile and compliance details.
        </p>
      </header>

      <div className="flex-1 p-6 lg:p-8">
        <section>
          <h2 className="mb-4 text-base font-semibold text-slate-900">
            Dealership Profile
          </h2>
          <DealerSettingsForm
            dealershipName={profile?.dealership_name ?? ""}
            dealerLicense={profile?.dealer_license ?? ""}
            phone={profile?.phone ?? ""}
          />
        </section>
      </div>
    </div>
  );
}
