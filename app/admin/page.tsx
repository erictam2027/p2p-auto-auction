import { ForceCloseButton } from "@/components/admin/force-close-button";
import { DealerTable } from "@/components/admin/DealerTable";
import { SiteHeader } from "@/components/layout/site-header";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { formatCurrency } from "@/lib/utils/format";
import { Gavel, ShieldCheck, Wallet } from "lucide-react";
import Link from "next/link";
import { redirect } from "next/navigation";

export const metadata = {
  title: "Admin Control Center | ApexAuction",
  description: "Dealer approvals, live listings, and escrow oversight.",
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

  const { data: liveListings } = await supabase
    .from("vehicles")
    .select("id, year, make, model, current_bid, end_time, status, vin")
    .eq("status", "live")
    .order("end_time", { ascending: true })
    .limit(25);

  const { data: escrowRows } = await supabase
    .from("escrow_transactions")
    .select("id, vehicle_id, sale_price, status, platform_fee_status, keysavvy_transaction_id")
    .order("updated_at", { ascending: false })
    .limit(25);

  return (
    <div className="flex min-h-full flex-1 flex-col bg-slate-50 text-slate-900">
      <SiteHeader />

      <main className="mx-auto w-full max-w-6xl flex-1 space-y-8 px-4 py-8 sm:px-6 lg:px-8">
        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-slate-600">
            Admin Control Center
          </p>
          <h1 className="mt-2 text-2xl font-semibold tracking-tight text-slate-900 sm:text-3xl">
            Marketplace Operations
          </h1>
          <p className="mt-2 max-w-2xl text-sm leading-relaxed text-slate-600">
            Approve dealers, monitor live auctions, and oversee escrow transactions.
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
                  {pendingProfiles.length} awaiting review
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="pt-6">
            <DealerTable profiles={pendingProfiles} />
          </CardContent>
        </Card>

        <Card className="border-slate-200 bg-white shadow-sm">
          <CardHeader className="border-b border-slate-200 pb-6">
            <div className="flex items-start gap-4">
              <div className="flex size-11 shrink-0 items-center justify-center rounded-md border border-slate-200 bg-slate-50">
                <Gavel className="size-5 text-slate-700" />
              </div>
              <div>
                <CardTitle className="text-lg font-semibold text-slate-900">
                  Live Listings
                </CardTitle>
                <CardDescription className="mt-1 text-slate-600">
                  Force-close auctions if needed for ops/safety.
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="pt-6">
            {(liveListings ?? []).length === 0 ? (
              <p className="text-sm text-slate-600">No live auctions.</p>
            ) : (
              <div className="overflow-hidden rounded-md border border-slate-200">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Vehicle</TableHead>
                      <TableHead>Bid</TableHead>
                      <TableHead>Ends</TableHead>
                      <TableHead />
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {(liveListings ?? []).map((listing) => (
                      <TableRow key={listing.id}>
                        <TableCell>
                          <Link
                            href={`/auctions/${listing.id}`}
                            className="font-medium text-slate-900 hover:underline"
                          >
                            {listing.year} {listing.make} {listing.model}
                          </Link>
                        </TableCell>
                        <TableCell>
                          {formatCurrency((listing.current_bid ?? 0) * 100)}
                        </TableCell>
                        <TableCell className="text-sm text-slate-600">
                          {listing.end_time
                            ? new Date(listing.end_time).toLocaleString()
                            : "—"}
                        </TableCell>
                        <TableCell>
                          <ForceCloseButton vehicleId={listing.id} />
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="border-slate-200 bg-white shadow-sm">
          <CardHeader className="border-b border-slate-200 pb-6">
            <div className="flex items-start gap-4">
              <div className="flex size-11 shrink-0 items-center justify-center rounded-md border border-slate-200 bg-slate-50">
                <Wallet className="size-5 text-slate-700" />
              </div>
              <div>
                <CardTitle className="text-lg font-semibold text-slate-900">
                  Escrow Oversight
                </CardTitle>
                <CardDescription className="mt-1 text-slate-600">
                  Recent KeySavvy / platform fee transactions.
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="pt-6">
            {(escrowRows ?? []).length === 0 ? (
              <p className="text-sm text-slate-600">No escrow transactions yet.</p>
            ) : (
              <div className="overflow-hidden rounded-md border border-slate-200">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Vehicle</TableHead>
                      <TableHead>Sale</TableHead>
                      <TableHead>Escrow</TableHead>
                      <TableHead>Fee</TableHead>
                      <TableHead>KeySavvy</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {(escrowRows ?? []).map((row) => (
                      <TableRow key={row.id}>
                        <TableCell>
                          <Link
                            href={`/auctions/${row.vehicle_id}`}
                            className="text-sm font-medium text-slate-900 hover:underline"
                          >
                            View listing
                          </Link>
                        </TableCell>
                        <TableCell>
                          {formatCurrency((row.sale_price ?? 0) * 100)}
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className="capitalize">
                            {row.status}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className="capitalize">
                            {row.platform_fee_status}
                          </Badge>
                        </TableCell>
                        <TableCell className="font-mono text-xs text-slate-600">
                          {row.keysavvy_transaction_id ?? "—"}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
