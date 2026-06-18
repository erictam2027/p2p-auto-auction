import type { ChatMessage, ConversationSummary } from "@/lib/messaging/types";

export function formatMessageTime(timestamp: string) {
  return new Intl.DateTimeFormat("en-US", {
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(timestamp));
}

export function getConversationKey(vehicleId: string, counterpartyId: string) {
  return `${vehicleId}:${counterpartyId}`;
}

export function getCounterpartyId(message: ChatMessage, currentUserId: string) {
  return message.sender_id === currentUserId ? message.receiver_id : message.sender_id;
}

export function buildConversationSummaries(
  messages: ChatMessage[],
  currentUserId: string,
  vehicleNames: Record<string, string>,
  buyerLabels: Record<string, string>,
  viewedKeys: Set<string>,
): ConversationSummary[] {
  const grouped = new Map<string, ChatMessage[]>();

  for (const message of messages) {
    const counterpartyId = getCounterpartyId(message, currentUserId);
    const key = getConversationKey(message.vehicle_id, counterpartyId);
    const existing = grouped.get(key) ?? [];
    existing.push(message);
    grouped.set(key, existing);
  }

  const summaries: ConversationSummary[] = [];

  for (const [key, threadMessages] of grouped) {
    const sorted = [...threadMessages].sort(
      (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime(),
    );
    const latest = sorted[sorted.length - 1];
    const [vehicleId, buyerId] = key.split(":");

    if (!vehicleId || !buyerId || !latest) {
      continue;
    }

    const unreadCount = viewedKeys.has(key)
      ? 0
      : sorted.filter((message) => message.receiver_id === currentUserId).length;

    summaries.push({
      key,
      vehicleId,
      buyerId,
      vehicleName: vehicleNames[vehicleId] ?? "Vehicle listing",
      buyerLabel: buyerLabels[buyerId] ?? "Buyer",
      lastMessage: latest.content,
      lastMessageAt: latest.created_at,
      unreadCount,
    });
  }

  return summaries.sort(
    (a, b) => new Date(b.lastMessageAt).getTime() - new Date(a.lastMessageAt).getTime(),
  );
}

export function filterThreadMessages(
  messages: ChatMessage[],
  vehicleId: string,
  buyerId: string,
  currentUserId: string,
) {
  return messages
    .filter(
      (message) =>
        message.vehicle_id === vehicleId &&
        ((message.sender_id === buyerId && message.receiver_id === currentUserId) ||
          (message.sender_id === currentUserId && message.receiver_id === buyerId)),
    )
    .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
}
