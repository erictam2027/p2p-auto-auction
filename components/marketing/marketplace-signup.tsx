"use client";

import { subscribeToMarketplace } from "@/app/contact/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { BellRing, Loader2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

export function MarketplaceSignup() {
  const [email, setEmail] = useState("");
  const [pending, setPending] = useState(false);

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    const result = await subscribeToMarketplace({ email, interest: "auction_alerts" });
    setPending(false);
    if (!result.ok) return toast.error(result.message);
    setEmail("");
    toast.success("You are on the auction-alert list.");
  }

  return (
    <section className="border-t border-slate-200 bg-white">
      <div className="mx-auto flex max-w-7xl flex-col gap-5 px-4 py-10 sm:px-6 lg:flex-row lg:items-center lg:justify-between lg:px-8">
        <div className="flex items-start gap-3"><span className="flex size-10 shrink-0 items-center justify-center rounded-md border border-slate-200 bg-slate-50"><BellRing className="size-5 text-slate-700" /></span><div><h2 className="text-lg font-semibold text-slate-900">Stay close to the next auction</h2><p className="mt-1 text-sm text-slate-600">Get notified when verified inventory matches the market.</p></div></div>
        <form onSubmit={submit} className="flex w-full max-w-md gap-2"><Input required type="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="you@dealership.com" className="h-11 border-slate-300 bg-white" /><Button type="submit" disabled={pending} className="h-11 shrink-0 bg-slate-900 text-white hover:bg-slate-800">{pending ? <Loader2 className="size-4 animate-spin" /> : "Get alerts"}</Button></form>
      </div>
    </section>
  );
}
