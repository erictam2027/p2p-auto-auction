import { VehicleUploadForm } from "@/components/dashboard/vehicle-upload-form";
import Link from "next/link";
import { ChevronLeft } from "lucide-react";

export const metadata = {
  title: "Upload Inventory | Dealer Portal | ApexAuction",
  description: "Add a new verified vehicle listing to your dealer inventory.",
};

export default function DashboardUploadPage() {
  return (
    <div className="flex min-h-screen flex-col">
      <header className="sticky top-0 z-30 border-b border-slate-200 bg-white px-6 py-5 lg:px-8">
        <Link
          href="/dashboard"
          className="mb-3 inline-flex items-center gap-1.5 text-sm text-slate-600 hover:text-slate-900"
        >
          <ChevronLeft className="size-4" />
          Back to Dashboard
        </Link>
        <h1 className="text-lg font-semibold text-slate-900">Upload New Inventory</h1>
        <p className="mt-1 text-sm text-slate-600">
          Complete the vehicle profile, then save a private draft or publish a seven-day auction.
        </p>
      </header>

      <div className="mx-auto w-full max-w-3xl flex-1 p-6 lg:p-8">
        <VehicleUploadForm />
      </div>
    </div>
  );
}
