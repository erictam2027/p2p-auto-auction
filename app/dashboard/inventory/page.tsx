import { BulkInventoryUpload } from "@/components/dashboard/bulk-inventory-upload";

export const metadata = {
  title: "Bulk Inventory Sync | Dealer Portal | ApexAuction",
  description:
    "Upload daily CSV exports from vAuto, HomeNet, or DealerSocket to sync inventory into draft auctions.",
};

export default function InventoryPage() {
  return (
    <div className="flex min-h-screen flex-col">
      <header className="sticky top-0 z-30 border-b border-slate-200 bg-white px-6 py-5 lg:px-8">
        <h1 className="text-lg font-semibold text-slate-900">Bulk Inventory Sync</h1>
        <p className="mt-1 max-w-2xl text-sm text-slate-600">
          Upload your daily CSV export from vAuto, HomeNet, or DealerSocket. We will
          automatically parse VINs, photos, and descriptions into draft auctions.
        </p>
      </header>

      <div className="flex-1 p-6 lg:p-8">
        <BulkInventoryUpload />
      </div>
    </div>
  );
}
