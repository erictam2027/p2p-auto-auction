"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  signInWithEmail,
  signInWithGoogle,
  signUpWithEmail,
} from "@/app/auth/actions";
import Link from "next/link";
import { useState } from "react";

type LoginFormProps = {
  defaultTab: "signin" | "signup";
  error?: string;
  message?: string;
  next?: string;
};

export function LoginForm({ defaultTab, error, message, next }: LoginFormProps) {
  const [tab, setTab] = useState<"signin" | "signup">(defaultTab);
  const isSignUp = tab === "signup";

  return (
    <div className="w-full max-w-md">
      <div className="rounded-md border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
        <div className="text-center">
          <h1 className="text-2xl font-semibold text-slate-900">
            {isSignUp ? "Create your account" : "Sign in to your account"}
          </h1>
          <p className="mt-2 text-sm text-slate-600">
            {isSignUp
              ? "Register to bid on verified auctions with escrow protection."
              : "Access your verified auctions, bids, and account dashboard."}
          </p>
        </div>

        <div className="mt-6 grid grid-cols-2 rounded-md border border-slate-200 bg-slate-50 p-1">
          <button
            type="button"
            aria-pressed={!isSignUp}
            onClick={() => setTab("signin")}
            className={`rounded-sm px-3 py-2 text-sm font-medium transition ${
              !isSignUp
                ? "bg-white text-slate-900 shadow-sm"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            Sign In
          </button>
          <button
            type="button"
            aria-pressed={isSignUp}
            onClick={() => setTab("signup")}
            className={`rounded-sm px-3 py-2 text-sm font-medium transition ${
              isSignUp
                ? "bg-white text-slate-900 shadow-sm"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            Create Account
          </button>
        </div>

        {error ? (
          <div className="mt-4 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
            {decodeURIComponent(error)}
          </div>
        ) : null}

        {message ? (
          <div className="mt-4 rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-700">
            {decodeURIComponent(message)}
          </div>
        ) : null}

        <form
          action={isSignUp ? signUpWithEmail : signInWithEmail}
          className="mt-6 space-y-4"
        >
          {next ? <input type="hidden" name="next" value={next} /> : null}

          <div className="space-y-2">
            <label htmlFor="email" className="text-sm font-medium text-slate-900">
              Email
            </label>
            <Input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              required
              placeholder="you@example.com"
              className="h-11 border-slate-300 bg-white text-slate-900"
            />
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label htmlFor="password" className="text-sm font-medium text-slate-900">
                Password
              </label>
              {!isSignUp ? (
                <Link
                  href="/forgot-password"
                  className="text-xs text-slate-600 hover:text-slate-900 hover:underline"
                >
                  Forgot password?
                </Link>
              ) : null}
            </div>
            <Input
              id="password"
              name="password"
              type="password"
              autoComplete={isSignUp ? "new-password" : "current-password"}
              required
              placeholder={isSignUp ? "Create a password (8+ chars)" : "Enter your password"}
              className="h-11 border-slate-300 bg-white text-slate-900"
            />
          </div>

          <Button
            type="submit"
            className="h-11 w-full bg-slate-900 text-white hover:bg-slate-800"
          >
            {isSignUp ? "Create Account" : "Sign In"}
          </Button>
        </form>

        <div className="mt-4 flex items-center gap-3">
          <span className="h-px flex-1 bg-slate-200" />
          <span className="text-xs font-medium uppercase tracking-wide text-slate-500">
            Or continue with
          </span>
          <span className="h-px flex-1 bg-slate-200" />
        </div>

        <form action={signInWithGoogle} className="mt-4">
          <Button
            type="submit"
            variant="outline"
            className="h-11 w-full border-slate-300 bg-white text-slate-900 hover:bg-slate-50"
          >
            <svg viewBox="0 0 24 24" className="size-4" aria-hidden>
              <path
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                fill="#4285F4"
              />
              <path
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                fill="#34A853"
              />
              <path
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"
                fill="#FBBC05"
              />
              <path
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                fill="#EA4335"
              />
            </svg>
            Continue with Google
          </Button>
        </form>

        <div className="mt-6 text-center text-sm text-slate-600">
          {!isSignUp ? (
            <>
              New to ApexAuction?{" "}
              <button
                type="button"
                onClick={() => setTab("signup")}
                className="font-medium text-slate-900 hover:underline"
              >
                Create an account
              </button>
            </>
          ) : (
            <>
              Already have an account?{" "}
              <button
                type="button"
                onClick={() => setTab("signin")}
                className="font-medium text-slate-900 hover:underline"
              >
                Sign in
              </button>
            </>
          )}
        </div>

        <p className="mt-4 text-center text-sm text-slate-600">
          Dealer account?{" "}
          <Link href="/dealer-application" className="font-medium text-slate-900 hover:underline">
            Apply as Dealer
          </Link>
        </p>
      </div>
    </div>
  );
}
