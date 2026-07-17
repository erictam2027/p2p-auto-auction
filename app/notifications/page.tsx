import { SiteHeader } from "@/components/layout/site-header";
import {
  markAllNotificationsRead,
  markNotificationRead,
} from "@/app/notifications/actions";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { createClient } from "@/lib/supabase/server";
import { Bell } from "lucide-react";
import Link from "next/link";
import { redirect } from "next/navigation";

export const metadata = {
  title: "Notifications | ApexAuction",
  description: "Auction alerts, outbids, wins, and escrow updates.",
};

type NotificationRow = {
  id: string;
  type: string;
  title: string;
  body: string;
  href: string | null;
  read_at: string | null;
  created_at: string;
};

export default async function NotificationsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login?next=/notifications");
  }

  const { data: notifications } = await supabase
    .from("notifications")
    .select("id, type, title, body, href, read_at, created_at")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(50);

  const rows = (notifications ?? []) as NotificationRow[];
  const unreadCount = rows.filter((row) => !row.read_at).length;

  return (
    <div className="flex min-h-full flex-1 flex-col bg-slate-50 text-slate-900">
      <SiteHeader />

      <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-8 sm:px-6 lg:px-8">
        <Card className="border-slate-200 bg-white shadow-sm">
          <CardHeader className="flex flex-row items-start justify-between gap-4 border-b border-slate-200">
            <div>
              <CardTitle className="flex items-center gap-2 text-xl">
                <Bell className="size-5" />
                Notifications
              </CardTitle>
              <CardDescription className="mt-1">
                {unreadCount > 0
                  ? `${unreadCount} unread`
                  : "You're caught up."}
              </CardDescription>
            </div>
            {unreadCount > 0 ? (
              <form action={markAllNotificationsRead}>
                <Button type="submit" variant="outline" size="sm">
                  Mark all read
                </Button>
              </form>
            ) : null}
          </CardHeader>

          <CardContent className="divide-y divide-slate-100 p-0">
            {rows.length === 0 ? (
              <div className="px-6 py-12 text-center text-sm text-slate-600">
                No notifications yet. Outbids, wins, and escrow updates will
                appear here.
              </div>
            ) : (
              rows.map((row) => {
                const content = (
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold text-slate-900">
                      {row.title}
                    </p>
                    <p className="mt-1 text-sm leading-relaxed text-slate-600">
                      {row.body}
                    </p>
                    <p className="mt-2 text-xs text-slate-400">
                      {new Date(row.created_at).toLocaleString()}
                    </p>
                  </div>
                );

                return (
                  <div
                    key={row.id}
                    className={`flex items-start gap-3 px-6 py-4 ${
                      row.read_at ? "bg-white" : "bg-slate-50"
                    }`}
                  >
                    <span
                      className={`mt-1.5 size-2 shrink-0 rounded-full ${
                        row.read_at ? "bg-transparent" : "bg-slate-900"
                      }`}
                      aria-hidden
                    />
                    {row.href ? (
                      <Link
                        href={row.href}
                        className="min-w-0 flex-1 hover:opacity-90"
                      >
                        {content}
                      </Link>
                    ) : (
                      content
                    )}
                    {!row.read_at ? (
                      <form action={markNotificationRead.bind(null, row.id)}>
                        <Button type="submit" variant="ghost" size="sm">
                          Read
                        </Button>
                      </form>
                    ) : null}
                  </div>
                );
              })
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
