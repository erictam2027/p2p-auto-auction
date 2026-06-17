import { DashboardSidebar } from "@/components/dashboard/dashboard-sidebar";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

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
    .select("role, verification_status")
    .eq("id", user.id)
    .maybeSingle();

  if (profile?.role !== "dealer" || profile.verification_status !== "verified") {
    redirect("/dealer-application");
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <DashboardSidebar />
      <div className="lg:pl-64">{children}</div>
    </div>
  );
}
