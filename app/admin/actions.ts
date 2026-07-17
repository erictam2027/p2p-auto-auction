"use server";

import { finalizeClosedAuctions } from "@/lib/auctions/finalize-closed-auctions";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

async function assertAdmin() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error("Unauthorized");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .maybeSingle();

  if (profile?.role !== "admin") {
    throw new Error("Unauthorized");
  }

  return supabase;
}

export async function approveDealer(userId: string) {
  const supabase = await assertAdmin();

  const { error } = await supabase
    .from("profiles")
    .update({ verification_status: "verified" })
    .eq("id", userId);

  if (error) {
    throw new Error(error.message);
  }

  revalidatePath("/admin");
}

export async function rejectDealer(userId: string) {
  const supabase = await assertAdmin();

  const { error } = await supabase
    .from("profiles")
    .update({ verification_status: "rejected" })
    .eq("id", userId);

  if (error) {
    throw new Error(error.message);
  }

  revalidatePath("/admin");
}

export async function forceCloseAuction(vehicleId: string) {
  await assertAdmin();

  const admin = createAdminClient();
  const client = admin ?? (await createClient());

  const { data: topBid } = await client
    .from("bids")
    .select("user_id, amount")
    .eq("vehicle_id", vehicleId)
    .order("amount", { ascending: false })
    .limit(1)
    .maybeSingle();

  const { error } = await client
    .from("vehicles")
    .update({
      status: "ended",
      winner_id: topBid?.user_id ?? null,
      end_time: new Date().toISOString(),
    })
    .eq("id", vehicleId);

  if (error) {
    throw new Error(error.message);
  }

  if (topBid?.user_id) {
    const { data: vehicle } = await client
      .from("vehicles")
      .select("seller_id, current_bid")
      .eq("id", vehicleId)
      .maybeSingle();

    if (vehicle?.seller_id && topBid.amount) {
      const { data: existingEscrow } = await client
        .from("escrow_transactions")
        .select("id")
        .eq("vehicle_id", vehicleId)
        .maybeSingle();

      if (!existingEscrow) {
        await client.from("escrow_transactions").insert({
          vehicle_id: vehicleId,
          buyer_id: topBid.user_id,
          seller_id: vehicle.seller_id,
          sale_price: topBid.amount,
          status: "pending",
          platform_fee_status: "pending",
          platform_fee_cents: Math.round(topBid.amount * 100 * 0.05),
          updated_at: new Date().toISOString(),
        });
      }
    }

    await client.from("notifications").insert({
      user_id: topBid.user_id,
      type: "auction_won",
      title: "You won an auction",
      body: "This auction was closed and you are the high bidder. Complete KeySavvy checkout.",
      href: `/auctions/${vehicleId}`,
      vehicle_id: vehicleId,
    });
  }

  await finalizeClosedAuctions(client);

  revalidatePath("/admin");
  revalidatePath(`/auctions/${vehicleId}`);
  revalidatePath("/notifications");
  revalidatePath("/");
}
