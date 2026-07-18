import { ContactSupportForm } from "@/components/contact/contact-support-form";
import { SiteHeader } from "@/components/layout/site-header";
import { MessageSquareText, ShieldCheck, Store } from "lucide-react";

export const metadata = {
  title: "Contact & Support | ApexAuction",
  description: "Contact ApexAuction for buyer, dealer, transaction, transport, or partnership support.",
};

export default function ContactPage() {
  return (
    <div className="flex min-h-full flex-1 flex-col bg-slate-50 text-slate-900"><SiteHeader /><main className="mx-auto grid w-full max-w-6xl gap-10 px-4 py-10 sm:px-6 lg:grid-cols-[minmax(0,1fr)_360px] lg:px-8"><section><p className="text-xs font-medium uppercase tracking-wide text-slate-600">ApexAuction Support</p><h1 className="mt-2 text-3xl font-semibold tracking-tight text-slate-900">Talk to a real marketplace team.</h1><p className="mt-3 max-w-2xl text-sm leading-6 text-slate-600">Send a request about a listing, account, dealer partnership, title package, payment, transport, or post-sale transaction. Your message is tracked by our operations queue.</p><div className="mt-8 rounded-md border border-slate-200 bg-white p-6 shadow-sm"><ContactSupportForm /></div></section><aside className="space-y-4"><div className="border-b border-slate-200 pb-4"><MessageSquareText className="size-5 text-slate-700" /><h2 className="mt-3 text-base font-semibold text-slate-900">Auction support</h2><p className="mt-1 text-sm leading-6 text-slate-600">Questions before bidding, listing, or arranging an inspection.</p></div><div className="border-b border-slate-200 pb-4"><ShieldCheck className="size-5 text-slate-700" /><h2 className="mt-3 text-base font-semibold text-slate-900">Transaction operations</h2><p className="mt-1 text-sm leading-6 text-slate-600">Help with a title package, payment confirmation, delivery, or a dispute.</p></div><div><Store className="size-5 text-slate-700" /><h2 className="mt-3 text-base font-semibold text-slate-900">Dealer partnerships</h2><p className="mt-1 text-sm leading-6 text-slate-600">Talk with us about inventory, selling strategy, and marketplace onboarding.</p></div></aside></main></div>
  );
}
