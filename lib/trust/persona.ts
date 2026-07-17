type PersonaCreateResult =
  | { ok: true; inquiryId: string; sessionToken?: string; hostedUrl?: string }
  | { ok: false; message: string };

type PersonaStatusResult =
  | { ok: true; status: "unverified" | "pending" | "verified" | "failed" }
  | { ok: false; message: string };

/**
 * Persona identity verification broker.
 * Requires PERSONA_API_KEY + PERSONA_TEMPLATE_ID for live mode.
 */
export async function createPersonaInquiry(input: {
  referenceId: string;
  email?: string;
}): Promise<PersonaCreateResult> {
  const apiKey = process.env.PERSONA_API_KEY?.trim();
  const templateId = process.env.PERSONA_TEMPLATE_ID?.trim();
  const apiBase =
    process.env.PERSONA_API_BASE_URL?.trim() || "https://withpersona.com/api/v1";

  if (!apiKey || !templateId) {
    return {
      ok: false,
      message:
        "Persona is not configured. Set PERSONA_API_KEY and PERSONA_TEMPLATE_ID.",
    };
  }

  try {
    const response = await fetch(`${apiBase.replace(/\/$/, "")}/inquiries`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
        "Persona-Version": "2023-01-05",
      },
      body: JSON.stringify({
        data: {
          attributes: {
            "inquiry-template-id": templateId,
            "reference-id": input.referenceId,
            "email-address": input.email,
          },
        },
      }),
    });

    if (!response.ok) {
      const text = await response.text();
      return { ok: false, message: text || `Persona error (${response.status})` };
    }

    const payload = (await response.json()) as {
      data?: {
        id?: string;
        attributes?: {
          status?: string;
          "session-token"?: string;
        };
      };
    };

    const inquiryId = payload.data?.id;

    if (!inquiryId) {
      return { ok: false, message: "Persona did not return an inquiry id." };
    }

    return {
      ok: true,
      inquiryId,
      sessionToken: payload.data?.attributes?.["session-token"],
      hostedUrl: `https://withpersona.com/verify?inquiry-id=${inquiryId}`,
    };
  } catch (error) {
    return {
      ok: false,
      message: error instanceof Error ? error.message : "Persona request failed.",
    };
  }
}

export async function getPersonaInquiryStatus(
  inquiryId: string,
): Promise<PersonaStatusResult> {
  const apiKey = process.env.PERSONA_API_KEY?.trim();
  const apiBase =
    process.env.PERSONA_API_BASE_URL?.trim() || "https://withpersona.com/api/v1";

  if (!apiKey) {
    return { ok: false, message: "PERSONA_API_KEY is not configured." };
  }

  try {
    const response = await fetch(
      `${apiBase.replace(/\/$/, "")}/inquiries/${inquiryId}`,
      {
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Persona-Version": "2023-01-05",
        },
        cache: "no-store",
      },
    );

    if (!response.ok) {
      return { ok: false, message: `Persona status check failed (${response.status}).` };
    }

    const payload = (await response.json()) as {
      data?: { attributes?: { status?: string } };
    };

    const raw = payload.data?.attributes?.status?.toLowerCase() ?? "pending";

    if (raw === "completed" || raw === "approved") {
      return { ok: true, status: "verified" };
    }

    if (raw === "failed" || raw === "declined") {
      return { ok: true, status: "failed" };
    }

    if (raw === "created" || raw === "pending" || raw === "needs_review") {
      return { ok: true, status: "pending" };
    }

    return { ok: true, status: "unverified" };
  } catch (error) {
    return {
      ok: false,
      message: error instanceof Error ? error.message : "Persona status check failed.",
    };
  }
}

/** Dev-only helper when Persona keys are missing. */
export function markIdentityVerifiedLocallyAllowed() {
  return process.env.NODE_ENV === "development" && !process.env.PERSONA_API_KEY;
}
