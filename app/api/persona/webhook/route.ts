import { createAdminClient } from "@/lib/supabase/admin";
import { NextResponse } from "next/server";

type PersonaWebhookPayload = {
  data?: {
    type?: string;
    id?: string;
    attributes?: {
      status?: string;
      "reference-id"?: string;
      payload?: {
        data?: {
          type?: string;
          id?: string;
          attributes?: {
            status?: string;
            "reference-id"?: string;
          };
        };
      };
    };
  };
};

function mapPersonaStatus(
  raw?: string,
): "pending" | "verified" | "failed" | null {
  const status = (raw ?? "").toLowerCase();

  if (status === "completed" || status === "approved") {
    return "verified";
  }

  if (status === "failed" || status === "declined") {
    return "failed";
  }

  if (
    status === "created" ||
    status === "pending" ||
    status === "needs_review" ||
    status === "expired"
  ) {
    return status === "expired" ? "failed" : "pending";
  }

  return null;
}

export async function POST(request: Request) {
  const webhookSecret = process.env.PERSONA_WEBHOOK_SECRET?.trim();

  if (webhookSecret) {
    const provided =
      request.headers.get("persona-signature") ??
      request.headers.get("authorization")?.replace(/^Bearer\s+/i, "");

    if (provided !== webhookSecret) {
      return NextResponse.json({ error: "Invalid webhook signature." }, { status: 401 });
    }
  }

  const supabase = createAdminClient();

  if (!supabase) {
    return NextResponse.json(
      { error: "Supabase admin client is not configured." },
      { status: 500 },
    );
  }

  let payload: PersonaWebhookPayload;

  try {
    payload = (await request.json()) as PersonaWebhookPayload;
  } catch {
    return NextResponse.json({ error: "Invalid JSON payload." }, { status: 400 });
  }

  const inquiry =
    payload.data?.attributes?.payload?.data ?? payload.data;

  const inquiryId = inquiry?.id;
  const referenceId =
    inquiry?.attributes?.["reference-id"] ??
    payload.data?.attributes?.["reference-id"];
  const mapped = mapPersonaStatus(inquiry?.attributes?.status);

  if (!mapped || (!inquiryId && !referenceId)) {
    return NextResponse.json({ ok: true, ignored: true });
  }

  const update = {
    identity_status: mapped,
    identity_verified_at:
      mapped === "verified" ? new Date().toISOString() : null,
    ...(inquiryId ? { persona_inquiry_id: inquiryId } : {}),
  };

  let query = supabase.from("profiles").update(update);

  if (referenceId) {
    query = query.eq("id", referenceId);
  } else if (inquiryId) {
    query = query.eq("persona_inquiry_id", inquiryId);
  }

  const { error } = await query;

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true, status: mapped });
}
