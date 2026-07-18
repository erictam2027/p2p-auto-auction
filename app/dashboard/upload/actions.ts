"use server";

import { canAccessDashboard } from "@/lib/auth/profile";
import { createClient } from "@/lib/supabase/server";
import { verifyVinWithVinAudit } from "@/lib/trust/vinaudit";
import { revalidatePath } from "next/cache";

export type UploadVehicleResult =
  | { ok: true; message?: string }
  | { ok: false; message: string };

const MAX_VEHICLE_IMAGES = 12;
const AUCTION_DURATION_MS = 7 * 24 * 60 * 60 * 1000;

function splitLines(value: string) {
  return value
    .split(/\n/)
    .map((line) => line.trim())
    .filter(Boolean);
}

function readString(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value.trim() : "";
}

function readInteger(formData: FormData, key: string) {
  const parsed = Number.parseInt(readString(formData, key).replace(/[$,\s]/g, ""), 10);
  return Number.isFinite(parsed) ? parsed : null;
}

function readVehicleImageUrls(formData: FormData, userId: string) {
  const rawValue = readString(formData, "imageUrls");

  if (!rawValue) {
    return null;
  }

  try {
    const parsed = JSON.parse(rawValue);

    if (!Array.isArray(parsed) || parsed.length === 0 || parsed.length > MAX_VEHICLE_IMAGES) {
      return null;
    }

    const storageOrigin = new URL(process.env.NEXT_PUBLIC_SUPABASE_URL!).origin;
    const expectedPrefix = `/storage/v1/object/public/vehicle-images/${userId}/`;
    const urls = parsed.filter((value): value is string => typeof value === "string");

    if (urls.length !== parsed.length || new Set(urls).size !== urls.length) {
      return null;
    }

    const isOwnedStorageUrl = urls.every((value) => {
      try {
        const url = new URL(value);
        return url.origin === storageOrigin && url.pathname.startsWith(expectedPrefix);
      } catch {
        return false;
      }
    });

    return isOwnedStorageUrl ? urls : null;
  } catch {
    return null;
  }
}

export async function uploadVehicle(formData: FormData): Promise<UploadVehicleResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { ok: false, message: "You must be signed in to upload inventory." };
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("role, verification_status")
    .eq("id", user.id)
    .maybeSingle();

  if (!canAccessDashboard(profile)) {
    return { ok: false, message: "You are not authorized to upload inventory." };
  }

  const imageUrls = readVehicleImageUrls(formData, user.id);

  if (!imageUrls) {
    return { ok: false, message: "Upload between 1 and 12 vehicle photos before publishing." };
  }

  const carfax = formData.get("carfax");

  if (carfax instanceof File && carfax.size > 0) {
    const fileName = carfax.name.toLowerCase();

    if (carfax.type !== "application/pdf" && !fileName.endsWith(".pdf")) {
      return { ok: false, message: "Vehicle history report must be a PDF file." };
    }
  }

  const year = readInteger(formData, "year");
  const make = readString(formData, "make");
  const model = readString(formData, "model");
  const vin = readString(formData, "vin");
  const mileage = readInteger(formData, "mileage");
  const engine = readString(formData, "engine");
  const transmission = readString(formData, "transmission");
  const drivetrain = readString(formData, "drivetrain");
  const exteriorColor = readString(formData, "exteriorColor");
  const interiorColor = readString(formData, "interiorColor");
  const titleStatus = readString(formData, "titleStatus");
  const highlights = readString(formData, "highlights");
  const knownFlaws = readString(formData, "knownFlaws");
  const location = readString(formData, "location");
  const reservePrice = readInteger(formData, "reservePrice");
  const shouldPublish = readString(formData, "listingIntent") === "publish";

  if (!year || !make || !model || !vin) {
    return { ok: false, message: "Year, make, model, and VIN are required." };
  }

  if (mileage === null || mileage < 0) {
    return { ok: false, message: "Enter a valid mileage." };
  }

  const vinAudit = await verifyVinWithVinAudit(vin);

  if (!vinAudit.ok) {
    return { ok: false, message: vinAudit.message };
  }

  if (vinAudit.rejected) {
    return {
      ok: false,
      message: vinAudit.message ?? "VIN rejected by NMVTIS verification.",
    };
  }

  let carfaxUrl: string | null = null;

  if (carfax instanceof File && carfax.size > 0) {
    const carfaxPath = `${user.id}/${Date.now()}-${vin}-carfax.pdf`;

    const { error: carfaxUploadError } = await supabase.storage
      .from("vehicle-documents")
      .upload(carfaxPath, carfax, {
        cacheControl: "3600",
        upsert: false,
        contentType: "application/pdf",
      });

    if (carfaxUploadError) {
      return { ok: false, message: carfaxUploadError.message };
    }

    carfaxUrl = supabase.storage.from("vehicle-documents").getPublicUrl(carfaxPath)
      .data.publicUrl;
  }

  const endTime = shouldPublish
    ? new Date(Date.now() + AUCTION_DURATION_MS).toISOString()
    : null;

  const { error: insertError } = await supabase.from("vehicles").insert({
    year,
    make,
    model,
    vin,
    mileage,
    engine,
    transmission,
    drivetrain,
    exterior_color: exteriorColor,
    interior_color: interiorColor,
    title_status: titleStatus,
    highlights: splitLines(highlights).join("\n") || null,
    known_flaws: splitLines(knownFlaws).join("\n") || null,
    image_url: imageUrls[0],
    image_urls: imageUrls,
    carfax_url: carfaxUrl,
    seller_id: user.id,
    current_bid: 0,
    bid_count: 0,
    end_time: endTime,
    status: shouldPublish ? "live" : "draft",
    location: location || null,
    city_state: location || null,
    reserve_price: reservePrice && reservePrice > 0 ? reservePrice : null,
    nmvtis_verified: vinAudit.verified,
    nmvtis_status: vinAudit.status,
    nmvtis_report_url: vinAudit.reportUrl,
    inspection_available: false,
  });

  if (insertError) {
    return { ok: false, message: insertError.message };
  }

  revalidatePath("/dashboard");
  revalidatePath("/dashboard/auctions");
  revalidatePath("/");
  revalidatePath("/browse");

  return {
    ok: true,
    message:
      vinAudit.verified
        ? shouldPublish
          ? "Vehicle published for a seven-day auction."
          : "Vehicle saved as a draft. Publish it from the dealer dashboard when ready."
        : vinAudit.message,
  };
}
