"use client";

import { useCallback, useEffect, useRef, useState } from "react";
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
  editedAt?: string | Date | null;
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
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editContent, setEditContent] = useState("");
  const [menuOpenId, setMenuOpenId] = useState<string | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const isAtBottomRef = useRef(true);
  const editInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "instant" });
  }, []);

  useEffect(() => {
    if (isAtBottomRef.current) {
      bottomRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]);

  useEffect(() => {
    if (editingId) {
      setTimeout(() => editInputRef.current?.focus(), 50);
    }
  }, [editingId]);

  // Close menu on outside click
  useEffect(() => {
    if (!menuOpenId) return;
    const close = () => setMenuOpenId(null);
    document.addEventListener("click", close);
    return () => document.removeEventListener("click", close);
  }, [menuOpenId]);

  const fetchMessages = useCallback(async () => {
    try {
      const res = await fetch(`/api/conversations/${conversationId}/messages`);
      if (res.ok) {
        const data: ChatMessage[] = await res.json();
        setMessages((prev) => {
          // Keep optimistic temp messages that server hasn't confirmed yet
          const serverIds = new Set(data.map((m) => m.id));
          const stillPending = prev.filter(
            (m) => m.id.startsWith("temp-") && !serverIds.has(m.id)
          );
          return [...data, ...stillPending];
        });
      }
    } catch {
      // ignore
    }
  }, [conversationId]);

  useEffect(() => {
    const interval = setInterval(fetchMessages, 3000);
    return () => clearInterval(interval);
  }, [fetchMessages]);

  useEffect(() => {
    const key = process.env.NEXT_PUBLIC_PUSHER_KEY;
    const cluster = process.env.NEXT_PUBLIC_PUSHER_CLUSTER;
    if (!key || key === "your_key") return;

    let channel: { unbind_all: () => void; bind: (event: string, cb: (data: unknown) => void) => void } | null = null;
    let pusherClient: { subscribe: (ch: string) => typeof channel; unsubscribe: (ch: string) => void } | null = null;

    import("pusher-js").then(({ default: PusherJs }) => {
      pusherClient = new PusherJs(key, { cluster: cluster! });
      channel = pusherClient.subscribe(`chat-${conversationId}`);
      channel?.bind("new-message", () => fetchMessages());
      channel?.bind("message-updated", (updated: unknown) => {
        const msg = updated as ChatMessage;
        setMessages((prev) => prev.map((m) => (m.id === msg.id ? msg : m)));
      });
      channel?.bind("message-deleted", (data: unknown) => {
        const { id } = data as { id: string };
        setMessages((prev) => prev.filter((m) => m.id !== id));
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

    // Optimistic: show message instantly before server confirms
    const tempId = `temp-${Date.now()}`;
    const tempMsg: ChatMessage = {
      id: tempId,
      content,
      senderId: currentUser.id,
      read: false,
      createdAt: new Date(),
      sender: { id: currentUser.id, name: currentUser.name, image: currentUser.image },
    };
    setMessages((prev) => [...prev, tempMsg]);

    const res = await fetch("/api/messages", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ conversationId, content }),
    });

    if (res.ok) {
      const real: ChatMessage = await res.json();
      // Replace temp message with real one from server
      setMessages((prev) => prev.map((m) => (m.id === tempId ? real : m)));
    } else {
      // Remove temp message on failure
      setMessages((prev) => prev.filter((m) => m.id !== tempId));
    }

    setSending(false);
  }

  async function saveEdit(msgId: string) {
    const content = editContent.trim();
    if (!content) {
      setEditingId(null);
      return;
    }
    const res = await fetch(`/api/messages/${msgId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ content }),
    });
    if (res.ok) {
      const updated: ChatMessage = await res.json();
      setMessages((prev) => prev.map((m) => (m.id === msgId ? updated : m)));
    }
    setEditingId(null);
  }

  async function deleteMessage(msgId: string) {
    setMenuOpenId(null);
    const res = await fetch(`/api/messages/${msgId}`, { method: "DELETE" });
    if (res.ok) {
      setMessages((prev) => prev.filter((m) => m.id !== msgId));
    }
  }

  function timeStr(date: Date | string) {
    return new Date(date).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" });
  }

  const online = isOnline(otherUser.lastSeen);

  return (
    <div className="flex h-[calc(100dvh-3.5rem)] flex-col" style={{ background: "var(--background)" }}>
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
            <p className="font-semibold" style={{ color: "var(--text-primary)" }}>{otherUser.name}</p>
            <p className="text-xs" style={{ color: "var(--text-muted)" }}>Say hi to start the conversation!</p>
          </div>
        )}

        <div className="flex flex-col gap-1">
          {messages.map((msg, i) => {
            const isOwn = msg.senderId === currentUser.id;
            const nextMsg = messages[i + 1];
            const showAvatar = !isOwn && nextMsg?.senderId !== msg.senderId;
            const isEditing = editingId === msg.id;
            const menuOpen = menuOpenId === msg.id;

            return (
              // group is on the outermost row — hover covers button + bubble together
              <div
                key={msg.id}
                className={`group flex items-end gap-1.5 ${isOwn ? "flex-row-reverse" : "flex-row"}`}
              >
                {/* Avatar slot for other user */}
                {!isOwn && (
                  <div className="h-6 w-6 shrink-0">
                    {showAvatar && (
                      <div className="relative h-6 w-6 overflow-hidden rounded-full bg-primary/10">
                        {otherUser.image ? (
                          <Image src={otherUser.image} alt={otherUser.name} fill sizes="24px" className="object-cover" />
                        ) : (
                          <span className="absolute inset-0 flex items-center justify-center text-[9px] font-bold text-primary">
                            {otherUser.name.charAt(0).toUpperCase()}
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                )}

                {/* ... menu button — sibling of bubble so hover zone is shared */}
                {isOwn && !isEditing && (
                  <div className="relative shrink-0 self-center">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setMenuOpenId(menuOpen ? null : msg.id);
                      }}
                      // mobile: always slightly visible; desktop: show on group-hover
                      className="flex h-6 w-6 items-center justify-center rounded-full transition-all hover:bg-[var(--surface-hover)] opacity-60 sm:opacity-0 sm:group-hover:opacity-100"
                      style={{ color: "var(--text-muted)" }}
                    >
                      <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
                        <circle cx="5" cy="12" r="2" />
                        <circle cx="12" cy="12" r="2" />
                        <circle cx="19" cy="12" r="2" />
                      </svg>
                    </button>

                    {menuOpen && (
                      <div
                        className="absolute bottom-8 right-0 z-10 min-w-[120px] overflow-hidden rounded-xl shadow-lg"
                        style={{ background: "var(--surface)", border: "1px solid var(--border)" }}
                        onClick={(e) => e.stopPropagation()}
                      >
                        <button
                          onClick={() => {
                            setEditingId(msg.id);
                            setEditContent(msg.content);
                            setMenuOpenId(null);
                          }}
                          className="flex w-full items-center gap-2 px-4 py-2.5 text-sm transition-colors hover:bg-[var(--surface-hover)]"
                          style={{ color: "var(--text-primary)" }}
                        >
                          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                          </svg>
                          Edit
                        </button>
                        <button
                          onClick={() => deleteMessage(msg.id)}
                          className="flex w-full items-center gap-2 px-4 py-2.5 text-sm text-red-500 transition-colors hover:bg-red-50"
                        >
                          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                          Delete
                        </button>
                      </div>
                    )}
                  </div>
                )}

                {/* Bubble column */}
                <div className={`flex max-w-[72%] flex-col ${isOwn ? "items-end" : "items-start"}`}>
                  {isEditing ? (
                    <div className="flex items-center gap-2">
                      <input
                        ref={editInputRef}
                        value={editContent}
                        onChange={(e) => setEditContent(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") { e.preventDefault(); saveEdit(msg.id); }
                          if (e.key === "Escape") setEditingId(null);
                        }}
                        className="rounded-2xl border px-4 py-2.5 text-sm outline-none focus:border-primary"
                        style={{
                          borderColor: "var(--border)",
                          background: "var(--surface-hover)",
                          color: "var(--text-primary)",
                          minWidth: "160px",
                        }}
                      />
                      {/* Save */}
                      <button
                        onClick={() => saveEdit(msg.id)}
                        disabled={!editContent.trim()}
                        className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary text-white disabled:opacity-40"
                      >
                        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                        </svg>
                      </button>
                      {/* Cancel */}
                      <button
                        onClick={() => setEditingId(null)}
                        className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full hover:bg-[var(--surface-hover)]"
                        style={{ color: "var(--text-muted)" }}
                      >
                        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </div>
                  ) : (
                    <div
                      className={`rounded-2xl px-4 py-2.5 text-sm leading-relaxed ${
                        isOwn ? "rounded-br-sm bg-primary text-white" : "rounded-bl-sm shadow-sm"
                      }`}
                      style={isOwn ? undefined : { background: "var(--surface)", color: "var(--text-primary)" }}
                    >
                      {msg.content}
                    </div>
                  )}

                  {!isEditing && (
                    <span
                      className="mt-0.5 hidden text-[10px] group-hover:block"
                      style={{ color: "var(--text-muted)" }}
                    >
                      {timeStr(msg.createdAt)}
                      {msg.editedAt && " · edited"}
                    </span>
                  )}
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
