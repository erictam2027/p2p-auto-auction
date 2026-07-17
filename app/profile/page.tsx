import { SiteHeader } from "@/components/layout/site-header";
import {
  ProfileBidsTable,
  ProfileWonAuctionsTable,
} from "@/components/profile/profile-bids-table";
import { IdentityVerificationCard } from "@/components/profile/identity-verification-card";
import { ProfileSettingsForm } from "@/components/profile/profile-settings-form";
import {
  fetchProfileActiveBids,
  fetchProfileWonAuctions,
} from "@/lib/data/profile-bids";
import { fetchWatchlistItems } from "@/lib/data/watchlist";
import { ProfileWatchlist } from "@/components/profile/profile-watchlist";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

export const metadata = {
  title: "Profile | ApexAuction",
  description: "Manage your ApexAuction account, bids, won auctions, and settings.",
};

function getInitials(email: string) {
  return email.slice(0, 2).toUpperCase();
}

function EmptyState({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <div className="rounded-md border border-dashed border-slate-300 bg-white px-6 py-12 text-center">
      <p className="text-sm font-semibold text-slate-900">{title}</p>
      <p className="mx-auto mt-2 max-w-md text-sm leading-relaxed text-slate-600">
        {description}
      </p>
    </div>
  );
}

export default async function ProfilePage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string }>;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user?.email) {
    redirect("/login?next=/profile");
  }

  const params = await searchParams;
  const defaultTab =
    params.tab === "watchlist" ||
    params.tab === "won-auctions" ||
    params.tab === "settings"
      ? params.tab
      : "active-bids";

  const { data: profile } = await supabase
    .from("profiles")
    .select("dealership_name, dealer_license, identity_status")
    .eq("id", user.id)
    .maybeSingle();

  const initials = getInitials(user.email);
  const [activeBids, wonAuctions, watchlist] = await Promise.all([
    fetchProfileActiveBids(user.id),
    fetchProfileWonAuctions(user.id),
    fetchWatchlistItems(supabase, user.id),
  ]);

  return (
    <div className="flex min-h-full flex-1 flex-col bg-slate-50 text-slate-900">
      <SiteHeader />

      <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-8 sm:px-6 lg:px-8">
        <Card className="border-slate-200 bg-white shadow-sm">
          <CardHeader className="border-b border-slate-200 pb-6">
            <div className="flex flex-col gap-5 sm:flex-row sm:items-center">
              <Avatar className="size-16 ring-1 ring-slate-200">
                <AvatarFallback className="text-lg">{initials}</AvatarFallback>
              </Avatar>

              <div>
                <CardTitle className="text-2xl font-semibold tracking-tight text-slate-900">
                  Account Profile
                </CardTitle>
                <CardDescription className="mt-1 text-slate-600">
                  {user.email}
                </CardDescription>
              </div>
            </div>
          </CardHeader>

          <CardContent className="pt-6">
            <Tabs defaultValue={defaultTab} className="gap-6">
              <TabsList
                variant="line"
                className="h-auto w-full justify-start gap-0 rounded-none border-b border-slate-200 bg-transparent p-0"
              >
                <TabsTrigger
                  value="active-bids"
                  className="rounded-none px-4 py-3 text-slate-600 data-active:text-slate-900"
                >
                  Active Bids
                </TabsTrigger>
                <TabsTrigger
                  value="won-auctions"
                  className="rounded-none px-4 py-3 text-slate-600 data-active:text-slate-900"
                >
                  Won Auctions
                </TabsTrigger>
                <TabsTrigger
                  value="watchlist"
                  className="rounded-none px-4 py-3 text-slate-600 data-active:text-slate-900"
                >
                  Watchlist
                </TabsTrigger>
                <TabsTrigger
                  value="settings"
                  className="rounded-none px-4 py-3 text-slate-600 data-active:text-slate-900"
                >
                  Settings
                </TabsTrigger>
              </TabsList>

              <TabsContent value="active-bids">
                {activeBids.length > 0 ? (
                  <ProfileBidsTable bids={activeBids} />
                ) : (
                  <EmptyState
                    title="No active bids yet"
                    description="Your live bids will appear here once you place offers on verified marketplace listings."
                  />
                )}
              </TabsContent>

              <TabsContent value="won-auctions">
                {wonAuctions.length > 0 ? (
                  <ProfileWonAuctionsTable auctions={wonAuctions} />
                ) : (
                  <EmptyState
                    title="No won auctions yet"
                    description="Completed purchases will be tracked here with escrow, title, and delivery milestones."
                  />
                )}
              </TabsContent>

              <TabsContent value="watchlist">
                {watchlist.length > 0 ? (
                  <ProfileWatchlist items={watchlist} />
                ) : (
                  <EmptyState
                    title="No watched auctions"
                    description="Tap Watch on a listing to save it here for quick return."
                  />
                )}
              </TabsContent>

              <TabsContent value="settings" className="space-y-6">
                <IdentityVerificationCard
                  identityStatus={profile?.identity_status ?? "unverified"}
                />
                <ProfileSettingsForm
                  email={user.email}
                  dealershipName={profile?.dealership_name ?? ""}
                  dealerLicense={profile?.dealer_license ?? ""}
                />
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
