"use client";

import { submitSupportRequest } from "@/app/contact/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Loader2, Send } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

export function ContactSupportForm() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    topic: "general",
    message: "",
    website: "",
  });

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSubmitting(true);
    const result = await submitSupportRequest(form);
    setIsSubmitting(false);

    if (!result.ok) {
      toast.error(result.message);
      return;
    }

    toast.success("Your request is in the ApexAuction support queue.");
    setForm({ name: "", email: "", phone: "", topic: "general", message: "", website: "" });
  }

  return (
    <form onSubmit={submit} className="space-y-5">
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="space-y-2 text-sm font-medium text-slate-900">Name<Input required value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} className="h-11 border-slate-300 bg-white" /></label>
        <label className="space-y-2 text-sm font-medium text-slate-900">Email<Input required type="email" value={form.email} onChange={(event) => setForm({ ...form, email: event.target.value })} className="h-11 border-slate-300 bg-white" /></label>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="space-y-2 text-sm font-medium text-slate-900">Phone <span className="font-normal text-slate-500">(optional)</span><Input type="tel" value={form.phone} onChange={(event) => setForm({ ...form, phone: event.target.value })} className="h-11 border-slate-300 bg-white" /></label>
        <label className="space-y-2 text-sm font-medium text-slate-900">How can we help?<Select value={form.topic} onChange={(event) => setForm({ ...form, topic: event.target.value })} className="h-11 border-slate-300 bg-white text-slate-900"><option value="general">General support</option><option value="dealer">Dealer listing support</option><option value="buyer">Buyer support</option><option value="title_payment">Title or payment</option><option value="transport">Transport or pickup</option><option value="partnership">Dealer partnership</option><option value="press">Press or media</option></Select></label>
      </div>
      <label className="space-y-2 text-sm font-medium text-slate-900">Message<textarea required minLength={20} value={form.message} onChange={(event) => setForm({ ...form, message: event.target.value })} className="min-h-36 w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:border-slate-400 focus:outline-none focus:ring-1 focus:ring-slate-400" placeholder="Include the listing, transaction, or account details that will help us respond." /></label>
      <input aria-hidden="true" tabIndex={-1} autoComplete="off" value={form.website} onChange={(event) => setForm({ ...form, website: event.target.value })} className="hidden" name="website" />
      <Button type="submit" disabled={isSubmitting} className="bg-slate-900 text-white hover:bg-slate-800">{isSubmitting ? <><Loader2 className="size-4 animate-spin" />Sending...</> : <><Send className="size-4" />Send request</>}</Button>
    </form>
  );
}
