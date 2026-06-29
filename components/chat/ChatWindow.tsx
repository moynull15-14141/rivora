"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import Avatar from "@/components/ui/Avatar";
import { isOnline } from "@/utils/online";

type Sender = { id: string; name: string; image: string | null };

export type ChatMessage = {
  id: string;
  content: string;
  senderId: string;
  read: boolean;
  createdAt: string | Date;
  sender: Sender;
};

type OtherUser = {
  id: string;
  name: string;
  username: string | null;
  image: string | null;
  lastSeen: Date | string | null;
};

type CurrentUser = {
  id: string;
  name: string;
  image: string | null;
};

export default function ChatWindow({
  conversationId,
  currentUser,
  otherUser,
  initialMessages,
}: {
  conversationId: string;
  currentUser: CurrentUser;
  otherUser: OtherUser;
  initialMessages: ChatMessage[];
}) {
  const [messages, setMessages] = useState<ChatMessage[]>(initialMessages);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const isAtBottomRef = useRef(true);
  const router = useRouter();

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "instant" });
  }, []);

  useEffect(() => {
    if (isAtBottomRef.current) {
      bottomRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]);

  const fetchMessages = useCallback(async () => {
    try {
      const res = await fetch(`/api/conversations/${conversationId}/messages`);
      if (res.ok) {
        const data: ChatMessage[] = await res.json();
        setMessages(data);
        router.refresh();
      }
    } catch {
      // ignore network errors silently
    }
  }, [conversationId, router]);

  useEffect(() => {
    const interval = setInterval(fetchMessages, 3000);
    return () => clearInterval(interval);
  }, [fetchMessages]);

  useEffect(() => {
    const key = process.env.NEXT_PUBLIC_PUSHER_KEY;
    const cluster = process.env.NEXT_PUBLIC_PUSHER_CLUSTER;
    if (!key || key === "your_key") return;

    let channel: { unbind_all: () => void; bind: (event: string, cb: () => void) => void } | null = null;
    let pusherClient: { subscribe: (ch: string) => typeof channel; unsubscribe: (ch: string) => void } | null = null;

    import("pusher-js").then(({ default: PusherJs }) => {
      pusherClient = new PusherJs(key, { cluster: cluster! });
      channel = pusherClient.subscribe(`chat-${conversationId}`);
      channel?.bind("new-message", () => {
        fetchMessages();
      });
    }).catch(() => {});

    return () => {
      channel?.unbind_all();
      pusherClient?.unsubscribe(`chat-${conversationId}`);
    };
  }, [conversationId, fetchMessages]);

  async function sendMessage(e: React.FormEvent) {
    e.preventDefault();
    const content = input.trim();
    if (!content || sending) return;

    setSending(true);
    setInput("");

    await fetch("/api/messages", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ conversationId, content }),
    });

    await fetchMessages();
    setSending(false);
  }

  function timeStr(date: Date | string) {
    return new Date(date).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" });
  }

  const online = isOnline(otherUser.lastSeen);

  return (
    <div
      className="flex h-[calc(100dvh-3.5rem)] flex-col"
      style={{ background: "var(--background)" }}
    >
      {/* Header */}
      <div
        className="flex items-center gap-3 border-b px-4 py-3 shadow-sm"
        style={{ borderColor: "var(--border)", background: "var(--surface)" }}
      >
        <Link
          href="/messages"
          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg transition-colors hover:bg-[var(--surface-hover)] sm:hidden"
          style={{ color: "var(--text-muted)" }}
        >
          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </Link>

        <Link href={`/${otherUser.username ?? otherUser.id}`}>
          <Avatar src={otherUser.image} name={otherUser.name} size="md" isOnline={online} />
        </Link>

        <div className="min-w-0 flex-1">
          <Link
            href={`/${otherUser.username ?? otherUser.id}`}
            className="block truncate text-sm font-semibold hover:underline"
            style={{ color: "var(--text-primary)" }}
          >
            {otherUser.name}
          </Link>
          <p className="text-xs" style={{ color: "var(--text-muted)" }}>
            {online ? "Active now" : "Offline"}
          </p>
        </div>
      </div>

      {/* Message list */}
      <div
        className="flex-1 overflow-y-auto px-4 py-4"
        onScroll={(e) => {
          const el = e.currentTarget;
          isAtBottomRef.current = el.scrollHeight - el.scrollTop - el.clientHeight < 80;
        }}
      >
        {messages.length === 0 && (
          <div className="flex flex-col items-center gap-3 py-10 text-center">
            <Avatar src={otherUser.image} name={otherUser.name} size="xl" />
            <p className="font-semibold" style={{ color: "var(--text-primary)" }}>
              {otherUser.name}
            </p>
            <p className="text-xs" style={{ color: "var(--text-muted)" }}>
              Say hi to start the conversation!
            </p>
          </div>
        )}

        <div className="flex flex-col gap-1">
          {messages.map((msg, i) => {
            const isOwn = msg.senderId === currentUser.id;
            const nextMsg = messages[i + 1];
            const showAvatar = !isOwn && nextMsg?.senderId !== msg.senderId;

            return (
              <div
                key={msg.id}
                className={`flex items-end gap-2 ${isOwn ? "flex-row-reverse" : "flex-row"}`}
              >
                {!isOwn && (
                  <div className="h-6 w-6 shrink-0">
                    {showAvatar && (
                      <div className="relative h-6 w-6 overflow-hidden rounded-full bg-primary/10">
                        {otherUser.image ? (
                          <Image
                            src={otherUser.image}
                            alt={otherUser.name}
                            fill
                            sizes="24px"
                            className="object-cover"
                          />
                        ) : (
                          <span className="absolute inset-0 flex items-center justify-center text-[9px] font-bold text-primary">
                            {otherUser.name.charAt(0).toUpperCase()}
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                )}

                <div className={`group flex max-w-[72%] flex-col ${isOwn ? "items-end" : "items-start"}`}>
                  <div
                    className={`rounded-2xl px-4 py-2.5 text-sm leading-relaxed ${
                      isOwn ? "rounded-br-sm bg-primary text-white" : "rounded-bl-sm shadow-sm"
                    }`}
                    style={
                      isOwn
                        ? undefined
                        : { background: "var(--surface)", color: "var(--text-primary)" }
                    }
                  >
                    {msg.content}
                  </div>
                  <span
                    className="mt-0.5 hidden text-[10px] group-hover:block"
                    style={{ color: "var(--text-muted)" }}
                  >
                    {timeStr(msg.createdAt)}
                  </span>
                </div>
              </div>
            );
          })}
          <div ref={bottomRef} />
        </div>
      </div>

      {/* Input */}
      <form
        onSubmit={sendMessage}
        className="flex items-center gap-2 border-t px-4 py-3"
        style={{ borderColor: "var(--border)", background: "var(--surface)" }}
      >
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder={`Message ${otherUser.name}…`}
          disabled={sending}
          className="flex-1 rounded-full border px-4 py-2.5 text-sm outline-none transition-colors focus:border-primary placeholder:text-[var(--text-muted)]"
          style={{
            borderColor: "var(--border)",
            background: "var(--surface-hover)",
            color: "var(--text-primary)",
          }}
        />
        <button
          type="submit"
          disabled={!input.trim() || sending}
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary text-white transition-opacity disabled:opacity-40"
        >
          <svg className="h-5 w-5 rotate-90" fill="currentColor" viewBox="0 0 24 24">
            <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z" />
          </svg>
        </button>
      </form>
    </div>
  );
}
