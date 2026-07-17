type LemonSquadBookingInput = {
  vin: string;
  vehicleId: string;
  address: string;
  preferredDate?: string;
};

type LemonSquadBookingResult =
  | { ok: true; orderId: string; status: string }
  | { ok: false; message: string };

/**
 * Lemon Squad inspection booking broker.
 * Requires LEMON_SQUAD_API_KEY for live bookings.
 */
export async function bookLemonSquadInspection(
  input: LemonSquadBookingInput,
): Promise<LemonSquadBookingResult> {
  const apiKey = process.env.LEMON_SQUAD_API_KEY?.trim();
  const apiBase =
    process.env.LEMON_SQUAD_API_BASE_URL?.trim() ||
    "https://api.lemonsquad.com/v1";

  if (!apiKey) {
    return {
      ok: false,
      message:
        "Lemon Squad is not configured. Set LEMON_SQUAD_API_KEY to enable inspections.",
    };
  }

  try {
    const response = await fetch(`${apiBase.replace(/\/$/, "")}/inspections`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        vin: input.vin,
        external_reference: input.vehicleId,
        address: input.address,
        preferred_date: input.preferredDate,
      }),
    });

    if (!response.ok) {
      return {
        ok: false,
        message: `Lemon Squad booking failed (${response.status}).`,
      };
    }

    const payload = (await response.json()) as {
      id?: string;
      order_id?: string;
      status?: string;
    };

    return {
      ok: true,
      orderId: payload.order_id ?? payload.id ?? "unknown",
      status: payload.status ?? "scheduled",
    };
  } catch (error) {
    return {
      ok: false,
      message:
        error instanceof Error ? error.message : "Lemon Squad request failed.",
    };
  }
}
