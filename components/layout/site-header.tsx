import { isAdmin, isVerifiedDealer } from "@/lib/auth/profile";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { Button } from "@/components/ui/button";
import { UserMenu } from "@/components/auth/user-menu";
import { SiteHeaderSearch } from "@/components/layout/site-header-search";
import { SiteMobileNav } from "@/components/layout/site-mobile-nav";
import { Gavel } from "lucide-react";

export async function SiteHeader() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const { data: profile } = user
    ? await supabase
        .from("profiles")
        .select("role, verification_status")
        .eq("id", user.id)
        .maybeSingle()
    : { data: null };

  const isAdminUser = Boolean(user && isAdmin(profile));
  const isVerifiedDealerUser = Boolean(
    user && !isAdminUser && isVerifiedDealer(profile),
  );
  const showApplyAsDealer = !isAdminUser && !isVerifiedDealerUser;

  return (
    <header className="sticky top-0 z-50 border-b border-slate-200 bg-white">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center gap-4 lg:gap-6">
          <Link href="/" className="flex shrink-0 items-center gap-2">
            <span className="flex size-8 items-center justify-center rounded border border-slate-200 bg-slate-50">
              <Gavel className="size-4 text-slate-700" />
            </span>
            <span className="hidden text-base font-semibold text-slate-900 sm:inline">
              ApexAuction
            </span>
          </Link>

          <SiteHeaderSearch id="site-search" className="hidden min-w-0 flex-1 md:block" />

          <nav className="hidden items-center gap-1 lg:flex">
            <Link
              href="/browse"
              className="rounded-md px-3 py-2 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50 hover:text-slate-900"
            >
              Browse Auctions
            </Link>
            {isVerifiedDealerUser ? (
              <Link
                href="/dashboard"
                className="rounded-md px-3 py-2 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50 hover:text-slate-900"
              >
                Dealer Dashboard
              </Link>
            ) : null}
          </nav>

          <div className="ml-auto flex shrink-0 items-center gap-2 md:ml-0">
            {user ? (
              <>
                <UserMenu user={user} />
                <Button
                  variant="outline"
                  size="sm"
                  className="border-slate-300 bg-white text-slate-900 hover:bg-slate-50 sm:hidden"
                  nativeButton={false}
                  render={<Link href="/profile" />}
                >
                  Profile
                </Button>
              </>
            ) : (
              <Button
                variant="outline"
                size="sm"
                className="border-slate-900 bg-white text-slate-900 hover:bg-slate-50"
                nativeButton={false}
                render={<Link href="/login" />}
              >
                Sign In
              </Button>
            )}
            {isAdminUser ? (
              <Button
                size="sm"
                className="hidden bg-slate-900 text-white hover:bg-slate-800 sm:inline-flex"
                nativeButton={false}
                render={<Link href="/admin" />}
              >
                Admin Portal
              </Button>
            ) : null}
            {isVerifiedDealerUser ? (
              <Button
                size="sm"
                className="hidden bg-slate-900 text-white hover:bg-slate-800 sm:inline-flex"
                nativeButton={false}
                render={<Link href="/dashboard/upload" />}
              >
                Upload Inventory
              </Button>
            ) : null}
            {showApplyAsDealer ? (
              <Button
                size="sm"
                className="hidden bg-slate-900 text-white hover:bg-slate-800 sm:inline-flex"
                nativeButton={false}
                render={<Link href="/dealer-application" />}
              >
                Apply as Dealer
              </Button>
            ) : null}
            <SiteMobileNav
              isAdminUser={isAdminUser}
              isVerifiedDealerUser={isVerifiedDealerUser}
              showApplyAsDealer={showApplyAsDealer}
              isSignedIn={Boolean(user)}
            />
          </div>
        </div>

        <div className="pb-3 md:hidden">
          <SiteHeaderSearch id="site-search-mobile" />
        </div>
      </div>
    </header>
  );
}
