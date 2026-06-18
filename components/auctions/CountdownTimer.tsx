"use client";

import { useEffect, useState } from "react";

type CountdownTimerProps = {
  /** Absolute ISO-8601 timestamp when the auction ends. */
  endTime: string;
  className?: string;
};

function formatRemainingTime(totalSeconds: number) {
  const days = Math.floor(totalSeconds / 86400);
  const hours = Math.floor((totalSeconds % 86400) / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  const parts: string[] = [];

  if (days > 0) {
    parts.push(`${days}d`);
  }

  parts.push(`${hours}h`);
  parts.push(`${minutes}m`);
  parts.push(`${seconds}s`);

  return parts.join(" ");
}

export function CountdownTimer({ endTime, className }: CountdownTimerProps) {
  const endTimestamp = new Date(endTime).getTime();
  const isInvalid = !Number.isFinite(endTimestamp);

  const [display, setDisplay] = useState("");
  const [isUrgent, setIsUrgent] = useState(false);
  const [isSold, setIsSold] = useState(false);

  useEffect(() => {
    if (isInvalid) {
      return;
    }

    function updateCountdown() {
      const remainingMs = endTimestamp - Date.now();

      if (remainingMs <= 0) {
        setIsSold(true);
        setIsUrgent(false);
        setDisplay("Sold");
        return;
      }

      const remainingSeconds = Math.floor(remainingMs / 1000);
      setIsSold(false);
      setIsUrgent(remainingMs < 60 * 60 * 1000);
      setDisplay(formatRemainingTime(remainingSeconds));
    }

    updateCountdown();
    const interval = setInterval(updateCountdown, 1000);

    return () => clearInterval(interval);
  }, [endTime, endTimestamp, isInvalid]);

  if (isInvalid) {
    return (
      <span className={`text-sm font-medium tabular-nums text-slate-500 ${className ?? ""}`}>
        Sold
      </span>
    );
  }

  return (
    <span
      className={`text-sm font-medium tabular-nums ${
        isSold ? "text-slate-500" : isUrgent ? "text-red-600" : "text-slate-700"
      } ${className ?? ""}`}
    >
      {display}
    </span>
  );
}
