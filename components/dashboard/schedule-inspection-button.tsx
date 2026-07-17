"use client";

import { scheduleListingInspection } from "@/app/dashboard/upload/inspection-actions";
import { Button } from "@/components/ui/button";
import { useState, useTransition } from "react";

type ScheduleInspectionButtonProps = {
  vehicleId: string;
  locationHint?: string;
};

export function ScheduleInspectionButton({
  vehicleId,
  locationHint = "",
}: ScheduleInspectionButtonProps) {
  const [pending, startTransition] = useTransition();
  const [message, setMessage] = useState<string | null>(null);

  return (
    <div className="flex flex-col items-start gap-1">
      <Button
        type="button"
        size="sm"
        variant="outline"
        disabled={pending}
        onClick={() => {
          const address =
            locationHint.trim() ||
            window.prompt("Inspection address (city, state, or full address)") ||
            "";

          if (!address.trim()) {
            setMessage("Address is required.");
            return;
          }

          startTransition(async () => {
            const result = await scheduleListingInspection({
              vehicleId,
              address: address.trim(),
            });

            setMessage(
              result.ok
                ? `Inspection queued (${result.orderId}).`
                : result.message,
            );
          });
        }}
      >
        {pending ? "Scheduling…" : "Schedule inspection"}
      </Button>
      {message ? (
        <p className="max-w-[220px] text-xs text-slate-500">{message}</p>
      ) : null}
    </div>
  );
}
