"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { createClient } from "@/lib/supabase/client";
import { Loader2, Send } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";

export type ChatMessage = {
  id: string;
  content: string;
  vehicle_id: string;
  sender_id: string;
  receiver_id: string;
  created_at: string;
};

type MessageSheetProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  vehicleId: string;
  sellerId: string;
  sellerName?: string;
};

function formatMessageTime(timestamp: string) {
  return new Intl.DateTimeFormat("en-US", {
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(timestamp));
}

export function MessageSheet({
  open,
  onOpenChange,
  vehicleId,
  sellerId,
  sellerName = "Seller",
}: MessageSheetProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [draft, setDraft] = useState("");
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) {
      return;
    }

    const supabase = createClient();
    let isMounted = true;

    async function loadMessages() {
      setIsLoading(true);

      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        if (isMounted) {
          setCurrentUserId(null);
          setMessages([]);
          setIsLoading(false);
        }
        return;
      }

      if (isMounted) {
        setCurrentUserId(user.id);
      }

      const { data, error } = await supabase
        .from("messages")
        .select("id, content, vehicle_id, sender_id, receiver_id, created_at")
        .eq("vehicle_id", vehicleId)
        .or(`sender_id.eq.${user.id},receiver_id.eq.${user.id}`)
        .order("created_at", { ascending: true });

      if (!isMounted) {
        return;
      }

      if (error) {
        toast.error(error.message);
        setMessages([]);
      } else {
        setMessages((data as ChatMessage[]) ?? []);
      }

      setIsLoading(false);
    }

    void loadMessages();

    return () => {
      isMounted = false;
    };
  }, [open, vehicleId]);

  useEffect(() => {
    if (!open || !currentUserId) {
      return;
    }

    const supabase = createClient();

    const channel = supabase
      .channel(`messages-${vehicleId}-${currentUserId}`)
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
  }, [open, vehicleId, currentUserId]);

  useEffect(() => {
    if (!scrollRef.current) {
      return;
    }

    scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [messages, open]);

  async function handleSend() {
    const trimmed = draft.trim();

    if (!trimmed) {
      return;
    }

    if (!sellerId) {
      toast.error("Seller information is unavailable for this listing.");
      return;
    }

    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      toast.error("You must be signed in to send messages.");
      return;
    }

    if (user.id === sellerId) {
      toast.error("You cannot message yourself.");
      return;
    }

    setIsSending(true);

    const { error } = await supabase.from("messages").insert({
      content: trimmed,
      vehicle_id: vehicleId,
      sender_id: user.id,
      receiver_id: sellerId,
    });

    setIsSending(false);

    if (error) {
      toast.error(error.message);
      return;
    }

    setDraft("");
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent showCloseButton className="gap-0 p-0">
        <SheetHeader>
          <SheetTitle>Message {sellerName}</SheetTitle>
          <SheetDescription>
            Ask questions about this vehicle before you bid.
          </SheetDescription>
        </SheetHeader>

        <div
          ref={scrollRef}
          className="flex-1 overflow-y-auto bg-slate-50 px-4 py-4"
        >
          {isLoading ? (
            <div className="flex h-full min-h-48 items-center justify-center text-sm text-slate-600">
              <Loader2 className="mr-2 size-4 animate-spin" />
              Loading conversation…
            </div>
          ) : !currentUserId ? (
            <div className="flex h-full min-h-48 items-center justify-center px-6 text-center text-sm text-slate-600">
              Sign in to view and send messages to the seller.
            </div>
          ) : messages.length === 0 ? (
            <div className="flex h-full min-h-48 items-center justify-center px-6 text-center text-sm text-slate-600">
              No messages yet. Start the conversation with a question about this
              listing.
            </div>
          ) : (
            <div className="space-y-3">
              {messages.map((message) => {
                const isOwnMessage = message.sender_id === currentUserId;

                return (
                  <div
                    key={message.id}
                    className={`flex ${isOwnMessage ? "justify-end" : "justify-start"}`}
                  >
                    <div
                      className={`max-w-[85%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed shadow-sm ${
                        isOwnMessage
                          ? "rounded-br-md bg-slate-900 text-white"
                          : "rounded-bl-md border border-slate-200 bg-white text-slate-900"
                      }`}
                    >
                      <p>{message.content}</p>
                      <p
                        className={`mt-1 text-[10px] ${
                          isOwnMessage ? "text-slate-300" : "text-slate-500"
                        }`}
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

        <SheetFooter className="mt-auto">
          <form
            className="flex w-full items-center gap-2"
            onSubmit={(event) => {
              event.preventDefault();
              void handleSend();
            }}
          >
            <Input
              value={draft}
              onChange={(event) => setDraft(event.target.value)}
              placeholder="Type your message…"
              disabled={!currentUserId || isSending}
              className="h-11 flex-1 border-slate-300 bg-white text-slate-900"
            />
            <Button
              type="submit"
              disabled={!currentUserId || isSending || !draft.trim()}
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
          </form>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
