import { DashboardSidebar } from "@/components/dashboard/dashboard-sidebar";
import { canAccessDashboard } from "@/lib/auth/profile";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

async function getUnreadMessageCount(userId: string) {
  const supabase = await createClient();
  const { count, error } = await supabase
    .from("messages")
    .select("*", { count: "exact", head: true })
    .eq("receiver_id", userId)
    .is("read_at", null);

  if (error) {
    return 0;
  }

  return count ?? 0;
}

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login?next=/dashboard");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("role, verification_status, dealership_name")
    .eq("id", user.id)
    .maybeSingle();

  if (!canAccessDashboard(profile)) {
    if (profile?.role === "dealer") {
      redirect("/dealer-application");
    }

    redirect("/profile");
  }

  const unreadMessageCount = await getUnreadMessageCount(user.id);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <DashboardSidebar
        unreadMessageCount={unreadMessageCount}
        dealershipName={profile?.dealership_name ?? "Dealer Portal"}
      />
      <div className="lg:pl-64">{children}</div>
    </div>
  );
}
