"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { createClient } from "@/lib/supabase/client";
import type { ChatMessage, ConversationSummary } from "@/lib/messaging/types";
import {
  buildConversationSummaries,
  filterThreadMessages,
  formatMessageTime,
  getCounterpartyId,
} from "@/lib/messaging/conversations";
import { cn } from "@/lib/utils";
import { Loader2, Mail, Send } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";

type VehicleRecord = {
  id: string;
  year: number | null;
  make: string | null;
  model: string | null;
};

type ProfileRecord = {
  id: string;
  email: string | null;
  dealership_name: string | null;
};

type DealerInboxProps = {
  currentUserId: string;
  initialMessages: ChatMessage[];
  initialVehicles: VehicleRecord[];
  initialProfiles: ProfileRecord[];
};

const scrollContainerClassName =
  "overflow-y-auto [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden";

function buildVehicleNames(vehicles: VehicleRecord[]) {
  return Object.fromEntries(
    vehicles.map((vehicle) => [
      vehicle.id,
      `${vehicle.year ?? ""} ${vehicle.make ?? "Vehicle"} ${vehicle.model ?? "Listing"}`.trim(),
    ]),
  );
}

function buildBuyerLabels(profiles: ProfileRecord[]) {
  return Object.fromEntries(
    profiles.map((profile) => [
      profile.id,
      profile.email ?? profile.dealership_name ?? "Buyer",
    ]),
  );
}

export function DealerInbox({
  currentUserId,
  initialMessages,
  initialVehicles,
  initialProfiles,
}: DealerInboxProps) {
  const [messages, setMessages] = useState<ChatMessage[]>(initialMessages);
  const [vehicleNames, setVehicleNames] = useState<Record<string, string>>(
    () => buildVehicleNames(initialVehicles),
  );
  const [buyerLabels, setBuyerLabels] = useState<Record<string, string>>(
    () => buildBuyerLabels(initialProfiles),
  );
  const [selectedKey, setSelectedKey] = useState<string | null>(null);
  const [viewedKeys, setViewedKeys] = useState<Set<string>>(() => new Set());
  const [draft, setDraft] = useState("");
  const [isLoading, setIsLoading] = useState(initialMessages.length === 0);
  const [isSending, setIsSending] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  const conversations = useMemo(
    () =>
      buildConversationSummaries(
        messages,
        currentUserId,
        vehicleNames,
        buyerLabels,
        viewedKeys,
      ),
    [messages, currentUserId, vehicleNames, buyerLabels, viewedKeys],
  );

  const activeKey = selectedKey ?? conversations[0]?.key ?? null;

  const selectedConversation = useMemo(
    () => conversations.find((conversation) => conversation.key === activeKey) ?? null,
    [conversations, activeKey],
  );

  const activeMessages = useMemo(() => {
    if (!selectedConversation) {
      return [];
    }

    return filterThreadMessages(
      messages,
      selectedConversation.vehicleId,
      selectedConversation.buyerId,
      currentUserId,
    );
  }, [messages, selectedConversation, currentUserId]);

  function handleSelectConversation(key: string) {
    setSelectedKey(key);
    setViewedKeys((current) => {
      if (current.has(key)) {
        return current;
      }

      const next = new Set(current);
      next.add(key);
      return next;
    });
  }

  useEffect(() => {
    const supabase = createClient();
    let isMounted = true;

    async function refreshInbox() {
      setIsLoading(true);

      const { data, error } = await supabase
        .from("messages")
        .select("id, content, vehicle_id, sender_id, receiver_id, created_at")
        .or(`sender_id.eq.${currentUserId},receiver_id.eq.${currentUserId}`)
        .order("created_at", { ascending: true });

      if (!isMounted) {
        return;
      }

      if (error) {
        toast.error(error.message);
        setIsLoading(false);
        return;
      }

      const nextMessages = (data as ChatMessage[]) ?? [];
      setMessages(nextMessages);

      const vehicleIds = [...new Set(nextMessages.map((message) => message.vehicle_id))];
      const profileIds = [
        ...new Set(
          nextMessages.map((message) => getCounterpartyId(message, currentUserId)),
        ),
      ];

      if (vehicleIds.length > 0) {
        const { data: vehicles } = await supabase
          .from("vehicles")
          .select("id, year, make, model")
          .in("id", vehicleIds);

        if (vehicles && isMounted) {
          setVehicleNames(buildVehicleNames(vehicles));
        }
      }

      if (profileIds.length > 0) {
        const { data: profiles } = await supabase
          .from("profiles")
          .select("id, email, dealership_name")
          .in("id", profileIds);

        if (profiles && isMounted) {
          setBuyerLabels(buildBuyerLabels(profiles));
        }
      }

      setIsLoading(false);
    }

    void refreshInbox();

    const channel = supabase
      .channel(`dealer-inbox-${currentUserId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "messages",
          filter: `receiver_id=eq.${currentUserId}`,
        },
        (payload) => {
          const incoming = payload.new as ChatMessage;

          setMessages((current) => {
            if (current.some((message) => message.id === incoming.id)) {
              return current;
            }

            return [...current, incoming];
          });
        },
      )
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "messages",
          filter: `sender_id=eq.${currentUserId}`,
        },
        (payload) => {
          const incoming = payload.new as ChatMessage;

          setMessages((current) => {
            if (current.some((message) => message.id === incoming.id)) {
              return current;
            }

            return [...current, incoming];
          });
        },
      )
      .subscribe();

    return () => {
      isMounted = false;
      void supabase.removeChannel(channel);
    };
  }, [currentUserId]);

  useEffect(() => {
    if (!selectedConversation) {
      return;
    }

    const supabase = createClient();
    const { vehicleId } = selectedConversation;

    const channel = supabase
      .channel(`dealer-thread-${vehicleId}-${currentUserId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "messages",
          filter: `vehicle_id=eq.${vehicleId}`,
        },
        (payload) => {
          const incoming = payload.new as ChatMessage;

          if (
            incoming.sender_id !== currentUserId &&
            incoming.receiver_id !== currentUserId
          ) {
            return;
          }

          setMessages((current) => {
            if (current.some((message) => message.id === incoming.id)) {
              return current;
            }

            return [...current, incoming];
          });
        },
      )
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [selectedConversation, currentUserId]);

  useEffect(() => {
    if (!scrollRef.current) {
      return;
    }

    scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [activeMessages, activeKey]);

  async function handleSend() {
    const trimmed = draft.trim();

    if (!trimmed || !selectedConversation) {
      return;
    }

    setIsSending(true);

    const supabase = createClient();
    const { error } = await supabase.from("messages").insert({
      content: trimmed,
      vehicle_id: selectedConversation.vehicleId,
      sender_id: currentUserId,
      receiver_id: selectedConversation.buyerId,
    });

    setIsSending(false);

    if (error) {
      toast.error(error.message);
      return;
    }

    setDraft("");
  }

  function renderConversationCard(conversation: ConversationSummary) {
    const isSelected = conversation.key === activeKey;

    return (
      <button
        key={conversation.key}
        type="button"
        onClick={() => handleSelectConversation(conversation.key)}
        className={cn(
          "w-full rounded-md border px-4 py-3 text-left transition-colors",
          isSelected
            ? "border-slate-900 bg-slate-900 text-white"
            : "border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50",
        )}
      >
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p
              className={cn(
                "truncate text-sm font-semibold",
                isSelected ? "text-white" : "text-slate-900",
              )}
            >
              {conversation.vehicleName}
            </p>
            <p
              className={cn(
                "mt-0.5 truncate text-xs",
                isSelected ? "text-slate-200" : "text-slate-600",
              )}
            >
              {conversation.buyerLabel}
            </p>
            <p
              className={cn(
                "mt-2 line-clamp-2 text-xs",
                isSelected ? "text-slate-300" : "text-slate-500",
              )}
            >
              {conversation.lastMessage}
            </p>
          </div>
          {conversation.unreadCount > 0 ? (
            <Badge
              variant={isSelected ? "secondary" : "default"}
              className={cn(
                "shrink-0",
                isSelected ? "bg-white text-slate-900" : "bg-red-600 text-white",
              )}
            >
              {conversation.unreadCount}
            </Badge>
          ) : null}
        </div>
      </button>
    );
  }

  return (
    <div className="flex h-[calc(100vh-100px)] flex-col overflow-hidden rounded-md border border-slate-200 bg-white shadow-sm lg:flex-row">
      <aside className="flex w-full flex-col border-b border-slate-200 lg:w-[360px] lg:border-r lg:border-b-0">
        <div className="border-b border-slate-200 px-4 py-4">
          <div className="flex items-center gap-2">
            <Mail className="size-4 text-slate-600" />
            <h2 className="text-sm font-semibold text-slate-900">Conversations</h2>
          </div>
          <p className="mt-1 text-xs text-slate-600">
            Buyer inquiries grouped by listing.
          </p>
        </div>

        <div className={cn("flex-1 space-y-2 p-3", scrollContainerClassName)}>
          {isLoading ? (
            <div className="flex h-full min-h-40 items-center justify-center text-sm text-slate-600">
              <Loader2 className="mr-2 size-4 animate-spin" />
              Loading inbox…
            </div>
          ) : conversations.length === 0 ? (
            <div className="flex h-full min-h-40 items-center justify-center px-4 text-center text-sm text-slate-600">
              No buyer messages yet. Inquiries will appear here when shoppers reach
              out about your listings.
            </div>
          ) : (
            conversations.map(renderConversationCard)
          )}
        </div>
      </aside>

      <section className="flex min-h-0 flex-1 flex-col">
        {selectedConversation ? (
          <>
            <div className="border-b border-slate-200 px-5 py-4">
              <p className="text-sm font-semibold text-slate-900">
                {selectedConversation.vehicleName}
              </p>
              <p className="mt-0.5 text-xs text-slate-600">
                {selectedConversation.buyerLabel}
              </p>
            </div>

            <div
              ref={scrollRef}
              className={cn("flex-1 bg-slate-50 px-5 py-4", scrollContainerClassName)}
            >
              {activeMessages.length === 0 ? (
                <div className="flex h-full min-h-48 items-center justify-center text-sm text-slate-600">
                  No messages in this thread yet.
                </div>
              ) : (
                <div className="space-y-3">
                  {activeMessages.map((message) => {
                    const isOwnMessage = message.sender_id === currentUserId;

                    return (
                      <div
                        key={message.id}
                        className={cn("flex", isOwnMessage ? "justify-end" : "justify-start")}
                      >
                        <div
                          className={cn(
                            "max-w-[75%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed shadow-sm",
                            isOwnMessage
                              ? "rounded-br-md bg-slate-900 text-white"
                              : "rounded-bl-md border border-slate-200 bg-white text-slate-900",
                          )}
                        >
                          <p>{message.content}</p>
                          <p
                            className={cn(
                              "mt-1 text-[10px]",
                              isOwnMessage ? "text-slate-300" : "text-slate-500",
                            )}
                          >
                            {formatMessageTime(message.created_at)}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            <form
              className="border-t border-slate-200 bg-white px-5 py-4"
              onSubmit={(event) => {
                event.preventDefault();
                void handleSend();
              }}
            >
              <div className="flex items-center gap-2">
                <Input
                  value={draft}
                  onChange={(event) => setDraft(event.target.value)}
                  placeholder="Type your reply…"
                  disabled={isSending}
                  className="h-11 flex-1 border-slate-300 bg-white text-slate-900"
                />
                <Button
                  type="submit"
                  disabled={isSending || !draft.trim()}
                  className="h-11 shrink-0 bg-slate-900 px-4 text-white hover:bg-slate-800"
                >
                  {isSending ? (
                    <Loader2 className="size-4 animate-spin" />
                  ) : (
                    <>
                      <Send className="size-4" />
                      Send
                    </>
                  )}
                </Button>
              </div>
            </form>
          </>
        ) : (
          <div className="flex flex-1 items-center justify-center px-6 text-center">
            <Card className="max-w-md border-dashed border-slate-300 bg-slate-50 px-6 py-10 shadow-none">
              <Mail className="mx-auto size-8 text-slate-400" />
              <p className="mt-4 text-sm font-semibold text-slate-900">
                Select a conversation
              </p>
              <p className="mt-2 text-sm text-slate-600">
                Choose a buyer thread from the left sidebar to view the full message
                history and send a reply.
              </p>
            </Card>
          </div>
        )}
      </section>
    </div>
  );
}
