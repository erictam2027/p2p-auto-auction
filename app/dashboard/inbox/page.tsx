import { DealerInbox } from "@/components/dashboard/dealer-inbox";
import type { ChatMessage } from "@/lib/messaging/types";
import { getCounterpartyId } from "@/lib/messaging/conversations";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

export const metadata = {
  title: "Inbox | Dealer Portal | ApexAuction",
  description: "Read and reply to buyer messages about your auction listings.",
};

export default async function DealerInboxPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login?next=/dashboard/inbox");
  }

  const { data: messagesData } = await supabase
    .from("messages")
    .select("id, content, vehicle_id, sender_id, receiver_id, created_at")
    .or(`sender_id.eq.${user.id},receiver_id.eq.${user.id}`)
    .order("created_at", { ascending: true });

  const messages = (messagesData as ChatMessage[]) ?? [];
  const vehicleIds = [...new Set(messages.map((message) => message.vehicle_id))];
  const profileIds = [
    ...new Set(messages.map((message) => getCounterpartyId(message, user.id))),
  ];

  const [{ data: vehicles }, { data: profiles }] = await Promise.all([
    vehicleIds.length > 0
      ? supabase.from("vehicles").select("id, year, make, model").in("id", vehicleIds)
      : Promise.resolve({ data: [] }),
    profileIds.length > 0
      ? supabase
          .from("profiles")
          .select("id, email, dealership_name")
          .in("id", profileIds)
      : Promise.resolve({ data: [] }),
  ]);

  return (
    <div className="flex min-h-screen flex-col">
      <header className="sticky top-0 z-30 border-b border-slate-200 bg-white px-6 py-5 lg:px-8">
        <h1 className="text-lg font-semibold text-slate-900">Inbox</h1>
        <p className="mt-1 max-w-2xl text-sm text-slate-600">
          Read and reply to buyer questions about your live listings in real time.
        </p>
      </header>

      <div className="flex-1 p-6 lg:p-8">
        <DealerInbox
          currentUserId={user.id}
          initialMessages={messages}
          initialVehicles={vehicles ?? []}
          initialProfiles={profiles ?? []}
        />
      </div>
    </div>
  );
}
