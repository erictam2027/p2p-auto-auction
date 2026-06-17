import Link from "next/link";
import { SiteHeader } from "@/components/layout/site-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export const metadata = {
  title: "Sign In | ApexAuction",
  description: "Sign in to your ApexAuction account to bid, sell, and manage escrow-secured transactions.",
};

export default function LoginPage() {
  return (
    <div className="flex min-h-full flex-1 flex-col bg-slate-50 text-slate-900">
      <SiteHeader />

      <main className="flex flex-1 items-center justify-center px-4 py-12 sm:px-6">
        <div className="w-full max-w-md rounded-md border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
          <div className="text-center">
            <h1 className="text-2xl font-semibold text-slate-900">Sign In</h1>
            <p className="mt-2 text-sm text-slate-600">
              Access your account to bid on verified auctions and manage transactions.
            </p>
          </div>

          <form className="mt-8 space-y-4">
            <div className="space-y-2">
              <label htmlFor="email" className="text-sm font-medium text-slate-900">
                Email
              </label>
              <Input
                id="email"
                type="email"
                autoComplete="email"
                placeholder="you@example.com"
                className="h-11 border-slate-300 bg-white text-slate-900"
              />
            </div>

            <div className="space-y-2">
              <label htmlFor="password" className="text-sm font-medium text-slate-900">
                Password
              </label>
              <Input
                id="password"
                type="password"
                autoComplete="current-password"
                placeholder="Enter your password"
                className="h-11 border-slate-300 bg-white text-slate-900"
              />
            </div>

            <Button
              type="submit"
              className="h-11 w-full bg-slate-900 text-white hover:bg-slate-800"
            >
              Sign In
            </Button>
          </form>

          <p className="mt-6 text-center text-sm text-slate-600">
            Need a dealer account?{" "}
            <Link href="/dealers/apply" className="font-medium text-slate-900 hover:underline">
              Apply as Dealer
            </Link>
          </p>
        </div>
      </main>
    </div>
  );
}
