"use client";

import { createClient } from "@/lib/supabase/client";
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
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { toast } from "sonner";

export function ResetPasswordForm({ error }: { error?: string }) {
  const router = useRouter();
  const [isReady, setIsReady] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [sessionError, setSessionError] = useState<string | null>(null);

  useEffect(() => {
    const supabase = createClient();

    async function establishSession() {
      const hashParams = new URLSearchParams(window.location.hash.slice(1));
      const accessToken = hashParams.get("access_token");
      const refreshToken = hashParams.get("refresh_token");

      if (accessToken && refreshToken) {
        const { error: sessionError } = await supabase.auth.setSession({
          access_token: accessToken,
          refresh_token: refreshToken,
        });

        if (sessionError) {
          setSessionError(sessionError.message);
          setIsReady(false);
          return;
        }

        window.history.replaceState(null, "", window.location.pathname);
      }

      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        setSessionError(
          "Your reset link has expired. Please request a new password reset.",
        );
        setIsReady(false);
        return;
      }

      setIsReady(true);
    }

    void establishSession();
  }, []);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSubmitting(true);

    const formData = new FormData(event.currentTarget);
    const password = String(formData.get("password") ?? "");

    if (password.length < 8) {
      toast.error("Password must be at least 8 characters.");
      setIsSubmitting(false);
      return;
    }

    const supabase = createClient();
    const { error: updateError } = await supabase.auth.updateUser({ password });

    setIsSubmitting(false);

    if (updateError) {
      toast.error(updateError.message);
      return;
    }

    toast.success("Password updated. You can sign in now.");
    router.push("/login?message=Password+updated.+You+can+sign+in+now.");
  }

  const displayError = error ?? sessionError;

  return (
    <Card className="w-full max-w-md border-slate-200 bg-white shadow-sm">
      <CardHeader className="text-center">
        <CardTitle className="text-2xl font-semibold text-slate-900">
          Set a new password
        </CardTitle>
        <CardDescription className="text-slate-600">
          Choose a strong password for your ApexAuction account.
        </CardDescription>
      </CardHeader>

      <CardContent>
        {displayError ? (
          <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
            {decodeURIComponent(displayError)}
          </div>
        ) : null}

        {!isReady && !displayError ? (
          <p className="text-center text-sm text-slate-600">
            Verifying your reset link...
          </p>
        ) : null}

        {isReady ? (
          <form id="reset-password-form" onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <label
                htmlFor="password"
                className="text-sm font-medium text-slate-900"
              >
                New Password
              </label>
              <Input
                id="password"
                name="password"
                type="password"
                autoComplete="new-password"
                required
                minLength={8}
                placeholder="Enter a new password (8+ chars)"
                className="h-11 border-slate-300 bg-white text-slate-900"
              />
            </div>
          </form>
        ) : null}
      </CardContent>

      {isReady ? (
        <CardFooter className="border-t border-slate-200 bg-slate-50 px-6 py-4">
          <Button
            type="submit"
            form="reset-password-form"
            disabled={isSubmitting}
            className="h-11 w-full bg-slate-900 text-white hover:bg-slate-800"
          >
            {isSubmitting ? "Updating..." : "Update password"}
          </Button>
        </CardFooter>
      ) : null}

      {displayError ? (
        <CardFooter className="justify-center border-t border-slate-200 bg-slate-50 px-6 py-4">
          <p className="text-center text-sm text-slate-600">
            <Link
              href="/forgot-password"
              className="font-medium text-slate-900 hover:underline"
            >
              Request a new reset link
            </Link>
          </p>
        </CardFooter>
      ) : null}
    </Card>
  );
}
