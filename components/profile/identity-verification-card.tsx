"use client";

import {
  refreshIdentityStatus,
  startIdentityVerification,
} from "@/app/profile/identity-actions";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Loader2, ShieldCheck } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

type IdentityVerificationCardProps = {
  identityStatus: string;
};

export function IdentityVerificationCard({
  identityStatus,
}: IdentityVerificationCardProps) {
  const [status, setStatus] = useState(identityStatus);
  const [isLoading, setIsLoading] = useState(false);

  async function handleStart() {
    setIsLoading(true);
    const result = await startIdentityVerification();
    setIsLoading(false);

    if (!result.ok) {
      toast.error(result.message);
      return;
    }

    if (result.status) {
      setStatus(result.status);
    }

    if (result.url) {
      window.location.assign(result.url);
      return;
    }

    toast.success(
      result.status === "verified"
        ? "Identity verified (local development mode)."
        : "Identity verification started.",
    );
  }

  async function handleRefresh() {
    setIsLoading(true);
    const result = await refreshIdentityStatus();
    setIsLoading(false);

    if (!result.ok) {
      toast.error(result.message);
      return;
    }

    if (result.status) {
      setStatus(result.status);
    }

    toast.success(`Identity status: ${result.status ?? "unknown"}`);
  }

  return (
    <div className="rounded-md border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-start gap-3">
        <ShieldCheck className="mt-0.5 size-5 text-slate-700" />
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="text-sm font-semibold text-slate-900">Identity verification</h3>
            <Badge variant="outline" className="capitalize border-slate-200 text-slate-700">
              {status}
            </Badge>
          </div>
          <p className="mt-2 text-sm text-slate-600">
            Persona biometric ID verification is required before bidding when enabled.
            In local development without Persona keys, verification can be completed
            instantly for testing.
          </p>
          <div className="mt-4 flex flex-wrap gap-2">
            <Button
              type="button"
              size="sm"
              disabled={isLoading || status === "verified"}
              onClick={() => void handleStart()}
              className="bg-slate-900 text-white hover:bg-slate-800"
            >
              {isLoading ? <Loader2 className="size-4 animate-spin" /> : null}
              {status === "verified" ? "Verified" : "Start verification"}
            </Button>
            {status === "pending" ? (
              <Button
                type="button"
                size="sm"
                variant="outline"
                disabled={isLoading}
                onClick={() => void handleRefresh()}
                className="border-slate-300"
              >
                Refresh status
              </Button>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
}
