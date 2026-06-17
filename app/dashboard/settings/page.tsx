import { DealerSettingsForm } from "@/components/dashboard/dealer-settings-form";

export const metadata = {
  title: "Settings | Dealer Portal | ApexAuction",
  description: "Manage your dealership profile and licensing information.",
};

export default function SettingsPage() {
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
          <DealerSettingsForm />
        </section>
      </div>
    </div>
  );
}
