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
    // Soft queue when partner keys are missing so dealers can still mark intent.
    return {
      ok: true,
      orderId: `pending-manual-${input.vehicleId.slice(0, 8)}`,
      status: "pending_manual_review",
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
