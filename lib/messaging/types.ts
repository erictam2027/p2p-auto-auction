export type ChatMessage = {
  id: string;
  content: string;
  vehicle_id: string;
  sender_id: string;
  receiver_id: string;
  created_at: string;
};

export type ConversationSummary = {
  key: string;
  vehicleId: string;
  buyerId: string;
  vehicleName: string;
  buyerLabel: string;
  lastMessage: string;
  lastMessageAt: string;
  unreadCount: number;
};
