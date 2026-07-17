type VinAuditResult =
  | {
      ok: true;
      verified: boolean;
      status: string;
      reportUrl: string | null;
      brands: string[];
      rejected: boolean;
      message?: string;
    }
  | {
      ok: false;
      message: string;
    };

const SEVERE_BRANDS = ["salvage", "flood", "total loss", "totalled", "junk", "rebuilt"];

function normalizeBrand(value: string) {
  return value.trim().toLowerCase();
}

function hasSevereBrand(brands: string[]) {
  return brands.some((brand) =>
    SEVERE_BRANDS.some((severe) => normalizeBrand(brand).includes(severe)),
  );
}

/**
 * VinAudit / NMVTIS verification broker.
 * Uses VINAUDIT_API_KEY when present; otherwise runs a safe local VIN format check
 * and marks the listing for manual review (not auto-verified).
 */
export async function verifyVinWithVinAudit(vin: string): Promise<VinAuditResult> {
  const cleaned = vin.trim().toUpperCase();

  if (cleaned.length < 11 || cleaned.length > 17) {
    return { ok: false, message: "VIN must be between 11 and 17 characters." };
  }

  const apiKey = process.env.VINAUDIT_API_KEY?.trim();
  const apiBase =
    process.env.VINAUDIT_API_BASE_URL?.trim() || "https://api.vinaudit.com/v2";

  if (!apiKey) {
    return {
      ok: true,
      verified: false,
      status: "pending_manual_review",
      reportUrl: null,
      brands: [],
      rejected: false,
      message:
        "VinAudit API key not configured. Listing saved without NMVTIS auto-verify.",
    };
  }

  try {
    const url = new URL(`${apiBase.replace(/\/$/, "")}/query`);
    url.searchParams.set("vin", cleaned);
    url.searchParams.set("key", apiKey);
    url.searchParams.set("format", "json");

    const response = await fetch(url.toString(), {
      method: "GET",
      headers: { Accept: "application/json" },
      cache: "no-store",
    });

    if (!response.ok) {
      return {
        ok: false,
        message: `VinAudit request failed (${response.status}).`,
      };
    }

    const payload = (await response.json()) as {
      brands?: string[] | string;
      titles?: Array<{ brand?: string }>;
      report_url?: string;
      url?: string;
      error?: string;
    };

    if (payload.error) {
      return { ok: false, message: payload.error };
    }

    const brands = Array.isArray(payload.brands)
      ? payload.brands
      : typeof payload.brands === "string"
        ? payload.brands.split(",").map((item) => item.trim())
        : (payload.titles ?? [])
            .map((entry) => entry.brand)
            .filter((brand): brand is string => Boolean(brand));

    if (hasSevereBrand(brands)) {
      return {
        ok: true,
        verified: false,
        status: "rejected_severe_brand",
        reportUrl: payload.report_url ?? payload.url ?? null,
        brands,
        rejected: true,
        message:
          "NMVTIS returned a severe title brand (salvage/flood/total loss). Listing rejected.",
      };
    }

    return {
      ok: true,
      verified: true,
      status: "clean",
      reportUrl: payload.report_url ?? payload.url ?? null,
      brands,
      rejected: false,
    };
  } catch (error) {
    return {
      ok: false,
      message:
        error instanceof Error ? error.message : "VinAudit verification failed.",
    };
  }
}
