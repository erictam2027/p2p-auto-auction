import { finalizeClosedAuctions } from "@/lib/auctions/finalize-closed-auctions";
import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";

function isAuthorizedCronRequest(request: Request) {
  const cronSecret = process.env.CRON_SECRET;

  if (!cronSecret) {
    return false;
  }

  const authorization = request.headers.get("authorization");

  return authorization === `Bearer ${cronSecret}`;
}

function readProcessedCount(data: unknown): number {
  if (typeof data === "number" && Number.isFinite(data)) {
    return data;
  }

  if (Array.isArray(data)) {
    return data.length;
  }

  if (data && typeof data === "object" && "count" in data) {
    const count = Number((data as { count: unknown }).count);
    return Number.isFinite(count) ? count : 0;
  }

  return 0;
}

export async function GET(request: Request) {
  if (!isAuthorizedCronRequest(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceRoleKey) {
    return NextResponse.json(
      { error: "Supabase admin credentials are not configured." },
      { status: 500 },
    );
  }

  const supabase = createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });

  const { data, error } = await supabase.rpc("close_expired_auctions");

  if (error) {
    return NextResponse.json(
      { error: error.message, processed: 0, finalized: 0 },
      { status: 500 },
    );
  }

  const processed = readProcessedCount(data);
  const finalized = await finalizeClosedAuctions(supabase);

  return NextResponse.json({
    ok: true,
    processed,
    finalized: processed,
    escrowCreated: finalized.escrowCreated,
    notificationsCreated: finalized.notificationsCreated,
    message: `${processed} auction${processed === 1 ? "" : "s"} successfully processed and finalized.`,
  });
}

export async function POST(request: Request) {
  return GET(request);
}
