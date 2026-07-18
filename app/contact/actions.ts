"use server";

import { createAdminClient } from "@/lib/supabase/admin";
import { revalidatePath } from "next/cache";

type SupportRequestInput = {
  name: string;
  email: string;
  phone?: string;
  topic: string;
  message: string;
  website?: string;
};

type SubmitResult = { ok: true } | { ok: false; message: string };

const TOPICS = new Set([
  "general",
  "dealer",
  "buyer",
  "title_payment",
  "transport",
  "partnership",
  "press",
]);

function normalizeEmail(value: string) {
  return value.trim().toLowerCase();
}

function isEmail(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

export async function submitSupportRequest(input: SupportRequestInput): Promise<SubmitResult> {
  const name = input.name.trim();
  const email = normalizeEmail(input.email);
  const message = input.message.trim();

  if (input.website?.trim()) {
    return { ok: true };
  }

  if (name.length < 2 || name.length > 120) {
    return { ok: false, message: "Enter your name." };
  }

  if (!isEmail(email)) {
    return { ok: false, message: "Enter a valid email address." };
  }

  if (!TOPICS.has(input.topic)) {
    return { ok: false, message: "Choose a support topic." };
  }

  if (message.length < 20 || message.length > 4000) {
    return { ok: false, message: "Include at least 20 characters so we can help." };
  }

  const admin = createAdminClient();
  if (!admin) {
    return { ok: false, message: "Support intake is temporarily unavailable." };
  }

  const { error } = await admin.from("support_tickets").insert({
    name,
    email,
    phone: input.phone?.trim().slice(0, 40) || null,
    topic: input.topic,
    message,
  });

  if (error) {
    return { ok: false, message: "Unable to submit your request right now." };
  }

  revalidatePath("/admin");
  return { ok: true };
}

export async function subscribeToMarketplace(input: {
  email: string;
  interest: "auction_alerts" | "dealer_partnerships";
}): Promise<SubmitResult> {
  const email = normalizeEmail(input.email);

  if (!isEmail(email)) {
    return { ok: false, message: "Enter a valid email address." };
  }

  const admin = createAdminClient();
  if (!admin) {
    return { ok: false, message: "Signups are temporarily unavailable." };
  }

  const { error } = await admin.from("marketing_leads").upsert(
    {
      email,
      interest: input.interest,
      source: "homepage",
    },
    { onConflict: "email" },
  );

  if (error) {
    return { ok: false, message: "Unable to save your email right now." };
  }

  revalidatePath("/admin");
  return { ok: true };
}
