"use client";

import { createClient } from "@/lib/supabase/client";
import { getSiteUrlPath } from "@/lib/site-url";
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
import { useState } from "react";
import { toast } from "sonner";

export function ForgotPasswordForm({ error }: { error?: string }) {
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSubmitting(true);

    const formData = new FormData(event.currentTarget);
    const email = String(formData.get("email") ?? "").trim();

    if (!email) {
      toast.error("Please enter your email address.");
      setIsSubmitting(false);
      return;
    }

    const supabase = createClient();
    const { error: resetError } = await supabase.auth.resetPasswordForEmail(
      email,
      { redirectTo: getSiteUrlPath("/reset-password") },
    );

    setIsSubmitting(false);

    if (resetError) {
      toast.error(resetError.message);
      return;
    }

    toast.success("Check your email for a password reset link.");
    event.currentTarget.reset();
  }

  return (
    <Card className="w-full max-w-md border-slate-200 bg-white shadow-sm">
      <CardHeader className="text-center">
        <CardTitle className="text-2xl font-semibold text-slate-900">
          Reset your password
        </CardTitle>
        <CardDescription className="text-slate-600">
          Enter the email associated with your account and we&apos;ll send you a
          reset link.
        </CardDescription>
      </CardHeader>

      <form onSubmit={handleSubmit}>
        <CardContent className="space-y-4">
          {error ? (
            <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
              {decodeURIComponent(error)}
            </div>
          ) : null}

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
        </CardContent>

        <CardFooter className="flex-col gap-4 border-t border-slate-200 bg-slate-50 px-6 py-4">
          <Button
            type="submit"
            disabled={isSubmitting}
            className="h-11 w-full bg-slate-900 text-white hover:bg-slate-800"
          >
            {isSubmitting ? "Sending..." : "Send reset link"}
          </Button>

          <p className="text-center text-sm text-slate-600">
            Remember your password?{" "}
            <Link href="/login" className="font-medium text-slate-900 hover:underline">
              Back to sign in
            </Link>
          </p>
        </CardFooter>
      </form>
    </Card>
  );
}
