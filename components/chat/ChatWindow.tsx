"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Avatar from "@/components/ui/Avatar";
import { isOnline } from "@/utils/online";
import EditGroupModal from "./EditGroupModal";

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

type GroupParticipant = {
  id: string;
  name: string;
  username: string | null;
  image: string | null;
  isAdmin: boolean;
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
  isGroup,
  groupName,
  groupAvatar,
  participants,
  isAdmin,
  initialMessages,
}: {
  conversationId: string;
  currentUser: CurrentUser;
  otherUser?: OtherUser;
  isGroup?: boolean;
  groupName?: string;
  groupAvatar?: string | null;
  participants?: GroupParticipant[];
  isAdmin?: boolean;
  initialMessages: ChatMessage[];
}) {
  const router = useRouter();
  const [messages, setMessages] = useState<ChatMessage[]>(initialMessages);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editContent, setEditContent] = useState("");
  const [menuOpenId, setMenuOpenId] = useState<string | null>(null);
  const [showGroupMenu, setShowGroupMenu] = useState(false);
  const [showMembersModal, setShowMembersModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [leavingGroup, setLeavingGroup] = useState(false);
  const [localGroupName, setLocalGroupName] = useState(groupName ?? "");
  const [localGroupAvatar, setLocalGroupAvatar] = useState<string | null>(groupAvatar ?? null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const isAtBottomRef = useRef(true);
  const editInputRef = useRef<HTMLInputElement>(null);
  const pendingTempIds = useRef<Set<string>>(new Set());
  const groupMenuRef = useRef<HTMLDivElement>(null);

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

  useEffect(() => {
    if (!menuOpenId) return;
    const close = () => setMenuOpenId(null);
    document.addEventListener("click", close);
    return () => document.removeEventListener("click", close);
  }, [menuOpenId]);

  useEffect(() => {
    if (!showGroupMenu) return;
    const close = (e: MouseEvent) => {
      if (!groupMenuRef.current?.contains(e.target as Node)) setShowGroupMenu(false);
    };
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, [showGroupMenu]);

  const fetchMessages = useCallback(async () => {
    try {
      const res = await fetch(`/api/conversations/${conversationId}/messages`, { cache: "no-store" });
      if (res.ok) {
        const data: ChatMessage[] = await res.json();
        setMessages((prev) => {
          const serverIds = new Set(data.map((m) => m.id));
          const pending = [...pendingTempIds.current];
          const stillWaiting = prev.filter((m) => pending.includes(m.id) && !serverIds.has(m.id));
          return [...data, ...stillWaiting];
        });
      }
    } catch {}
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

    const tempId = `temp-${Date.now()}`;
    pendingTempIds.current.add(tempId);
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

    pendingTempIds.current.delete(tempId);

    if (res.ok) {
      const real: ChatMessage = await res.json();
      setMessages((prev) => prev.map((m) => (m.id === tempId ? real : m)));
    } else {
      setMessages((prev) => prev.filter((m) => m.id !== tempId));
    }

    setSending(false);
  }

  async function saveEdit(msgId: string) {
    const content = editContent.trim();
    if (!content) { setEditingId(null); return; }
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
    if (res.ok) setMessages((prev) => prev.filter((m) => m.id !== msgId));
  }

  async function leaveGroup() {
    if (leavingGroup) return;
    setLeavingGroup(true);
    const res = await fetch(`/api/conversations/${conversationId}`, { method: "DELETE" });
    if (res.ok) router.push("/messages");
    else setLeavingGroup(false);
  }

  function timeStr(date: Date | string) {
    return new Date(date).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" });
  }

  const online = !isGroup && otherUser ? isOnline(otherUser.lastSeen) : false;
  const displayGroupName = localGroupName || groupName || "Group";
  const placeholderName = isGroup ? displayGroupName : (otherUser?.name ?? "");

  // For group: stacked avatars (non-self participants, first 2)
  const groupAvatarUsers = (participants ?? []).filter((p) => p.id !== currentUser.id).slice(0, 2);

  return (
    <div className="flex h-[calc(100dvh-3.5rem)] flex-col" style={{ background: "var(--background)" }}>
      {/* Header */}
      <div
        className="flex items-center gap-3 border-b px-4 py-3 shadow-sm"
        style={{ borderColor: "var(--border)", background: "var(--surface)" }}
      >
        {/* Back button (mobile) */}
        <Link
          href="/messages"
          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg transition-colors hover:bg-[var(--surface-hover)] sm:hidden"
          style={{ color: "var(--text-muted)" }}
        >
          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </Link>

        {isGroup ? (
          /* Group header */
          <>
            <div className="shrink-0">
              {localGroupAvatar ? (
                <div className="relative h-10 w-10 overflow-hidden rounded-full bg-primary/10">
                  <Image src={localGroupAvatar} alt={displayGroupName} fill sizes="40px" className="object-cover" />
                </div>
              ) : groupAvatarUsers.length >= 2 ? (
                <div className="relative h-10 w-10 shrink-0">
                  <div className="absolute bottom-0 left-0 h-6 w-6 overflow-hidden rounded-full border-2 bg-primary/10" style={{ borderColor: "var(--surface)" }}>
                    {groupAvatarUsers[1].image
                      ? <Image src={groupAvatarUsers[1].image} alt={groupAvatarUsers[1].name} fill sizes="24px" className="object-cover" />
                      : <span className="absolute inset-0 flex items-center justify-center text-[8px] font-bold text-primary">{groupAvatarUsers[1].name.charAt(0)}</span>}
                  </div>
                  <div className="absolute right-0 top-0 h-7 w-7 overflow-hidden rounded-full border-2 bg-primary/10" style={{ borderColor: "var(--surface)" }}>
                    {groupAvatarUsers[0].image
                      ? <Image src={groupAvatarUsers[0].image} alt={groupAvatarUsers[0].name} fill sizes="28px" className="object-cover" />
                      : <span className="absolute inset-0 flex items-center justify-center text-[9px] font-bold text-primary">{groupAvatarUsers[0].name.charAt(0)}</span>}
                  </div>
                </div>
              ) : groupAvatarUsers.length === 1 ? (
                <div className="relative h-10 w-10 overflow-hidden rounded-full bg-primary/10">
                  {groupAvatarUsers[0].image
                    ? <Image src={groupAvatarUsers[0].image} alt={groupAvatarUsers[0].name} fill sizes="40px" className="object-cover" />
                    : <span className="absolute inset-0 flex items-center justify-center text-sm font-bold text-primary">{groupAvatarUsers[0].name.charAt(0)}</span>}
                </div>
              ) : (
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
                  <svg className="h-5 w-5 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                </div>
              )}
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold" style={{ color: "var(--text-primary)" }}>
                {displayGroupName}
              </p>
              <p className="text-xs" style={{ color: "var(--text-muted)" }}>
                {(participants ?? []).length} members
              </p>
            </div>
            {/* Group ⋮ menu */}
            <div className="relative shrink-0" ref={groupMenuRef}>
              <button
                onClick={() => setShowGroupMenu((v) => !v)}
                className="flex h-8 w-8 items-center justify-center rounded-lg transition-colors hover:bg-[var(--surface-hover)]"
                style={{ color: "var(--text-muted)" }}
              >
                <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
                  <circle cx="12" cy="5" r="2" />
                  <circle cx="12" cy="12" r="2" />
                  <circle cx="12" cy="19" r="2" />
                </svg>
              </button>
              {showGroupMenu && (
                <div
                  className="absolute right-0 top-10 z-20 min-w-[200px] overflow-hidden rounded-xl shadow-lg"
                  style={{ background: "var(--surface)", border: "1px solid var(--border)" }}
                >
                  {isAdmin && (
                    <button
                      onClick={() => { setShowGroupMenu(false); setShowEditModal(true); }}
                      className="flex w-full items-center gap-3 px-4 py-3 text-sm transition-colors hover:bg-[var(--surface-hover)]"
                      style={{ color: "var(--text-primary)" }}
                    >
                      <svg className="h-4 w-4 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                      </svg>
                      Edit Group
                    </button>
                  )}
                  <button
                    onClick={() => { setShowGroupMenu(false); setShowMembersModal(true); }}
                    className={`flex w-full items-center gap-3 px-4 py-3 text-sm transition-colors hover:bg-[var(--surface-hover)] ${isAdmin ? "border-t" : ""}`}
                    style={{ color: "var(--text-primary)", borderColor: "var(--border)" }}
                  >
                    <svg className="h-4 w-4 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    Members ({(participants ?? []).length})
                  </button>
                  <button
                    onClick={() => { setShowGroupMenu(false); leaveGroup(); }}
                    disabled={leavingGroup}
                    className="flex w-full items-center gap-3 border-t px-4 py-3 text-sm text-red-500 transition-colors hover:bg-red-50 disabled:opacity-60 dark:hover:bg-red-900/20"
                    style={{ borderColor: "var(--border)" }}
                  >
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                    </svg>
                    {leavingGroup ? "Leaving…" : "Leave Group"}
                  </button>
                </div>
              )}
            </div>
          </>
        ) : (
          /* DM header */
          <>
            <Link href={`/${otherUser!.username ?? otherUser!.id}`}>
              <Avatar src={otherUser!.image} name={otherUser!.name} size="md" isOnline={online} />
            </Link>
            <div className="min-w-0 flex-1">
              <Link
                href={`/${otherUser!.username ?? otherUser!.id}`}
                className="block truncate text-sm font-semibold hover:underline"
                style={{ color: "var(--text-primary)" }}
              >
                {otherUser!.name}
              </Link>
              <p className="text-xs" style={{ color: "var(--text-muted)" }}>
                {online ? "Active now" : "Offline"}
              </p>
            </div>
          </>
        )}
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
            {isGroup ? (
              <>
                <div className="flex h-14 w-14 items-center justify-center rounded-full bg-primary/10">
                  <svg className="h-7 w-7 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                </div>
                <p className="font-semibold" style={{ color: "var(--text-primary)" }}>{groupName}</p>
                <p className="text-xs" style={{ color: "var(--text-muted)" }}>
                  {(participants ?? []).length} members · Say hi to kick things off!
                </p>
              </>
            ) : (
              <>
                <Avatar src={otherUser!.image} name={otherUser!.name} size="xl" />
                <p className="font-semibold" style={{ color: "var(--text-primary)" }}>{otherUser!.name}</p>
                <p className="text-xs" style={{ color: "var(--text-muted)" }}>Say hi to start the conversation!</p>
              </>
            )}
          </div>
        )}

        <div className="flex flex-col gap-1">
          {messages.map((msg, i) => {
            const isOwn = msg.senderId === currentUser.id;
            const nextMsg = messages[i + 1];
            const prevMsg = messages[i - 1];
            const isEditing = editingId === msg.id;
            const menuOpen = menuOpenId === msg.id;

            // For group: show sender name when first in a consecutive run from same sender
            const showSenderName = isGroup && !isOwn && (prevMsg?.senderId !== msg.senderId);
            const showAvatar = !isOwn && nextMsg?.senderId !== msg.senderId;

            return (
              <div
                key={msg.id}
                className={`group flex items-end gap-1.5 ${isOwn ? "flex-row-reverse" : "flex-row"}`}
              >
                {/* Avatar slot */}
                {!isOwn && (
                  <div className={`shrink-0 ${isGroup ? "h-7 w-7" : "h-6 w-6"}`}>
                    {showAvatar && (
                      <div className={`relative overflow-hidden rounded-full bg-primary/10 ${isGroup ? "h-7 w-7" : "h-6 w-6"}`}>
                        {msg.sender.image ? (
                          <Image
                            src={msg.sender.image}
                            alt={msg.sender.name}
                            fill
                            sizes={isGroup ? "28px" : "24px"}
                            className="object-cover"
                          />
                        ) : (
                          <span
                            className="absolute inset-0 flex items-center justify-center font-bold text-primary"
                            style={{ fontSize: isGroup ? "10px" : "9px" }}
                          >
                            {msg.sender.name.charAt(0).toUpperCase()}
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                )}

                {/* ⋮ menu for own messages */}
                {isOwn && !isEditing && (
                  <div className="relative shrink-0 self-center">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setMenuOpenId(menuOpen ? null : msg.id);
                      }}
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
                          onClick={() => { setEditingId(msg.id); setEditContent(msg.content); setMenuOpenId(null); }}
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
                  {/* Sender name in group chats */}
                  {showSenderName && (
                    <span className="mb-0.5 ml-1 text-[11px] font-semibold" style={{ color: "var(--text-muted)" }}>
                      {msg.sender.name}
                    </span>
                  )}

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
                      <button
                        onClick={() => saveEdit(msg.id)}
                        disabled={!editContent.trim()}
                        className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary text-white disabled:opacity-40"
                      >
                        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                        </svg>
                      </button>
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
          placeholder={`Message ${placeholderName}…`}
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

      {/* Edit Group modal */}
      {showEditModal && isGroup && (
        <EditGroupModal
          conversationId={conversationId}
          currentName={displayGroupName}
          currentAvatar={localGroupAvatar}
          onClose={() => setShowEditModal(false)}
          onSaved={(name, avatar) => {
            setLocalGroupName(name);
            setLocalGroupAvatar(avatar);
          }}
        />
      )}

      {/* Members modal */}
      {showMembersModal && (
        <div className="fixed inset-0 z-[300] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setShowMembersModal(false)} />
          <div
            className="relative z-10 flex w-full max-w-sm flex-col overflow-hidden rounded-2xl shadow-2xl"
            style={{ background: "var(--surface)", border: "1px solid var(--border)", maxHeight: "80dvh" }}
          >
            <div className="flex items-center justify-between border-b px-5 py-4" style={{ borderColor: "var(--border)" }}>
              <h3 className="font-bold" style={{ color: "var(--text-primary)" }}>
                Members ({(participants ?? []).length})
              </h3>
              <button
                onClick={() => setShowMembersModal(false)}
                className="flex h-8 w-8 items-center justify-center rounded-full hover:bg-[var(--surface-hover)]"
                style={{ color: "var(--text-muted)" }}
              >
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="overflow-y-auto">
              {(participants ?? []).map((p, i) => (
                <div
                  key={p.id}
                  className={`flex items-center gap-3 px-5 py-3 ${i > 0 ? "border-t" : ""}`}
                  style={{ borderColor: "var(--border)" }}
                >
                  <div className="relative h-10 w-10 shrink-0 overflow-hidden rounded-full bg-primary/10">
                    {p.image ? (
                      <Image src={p.image} alt={p.name} fill sizes="40px" className="object-cover" />
                    ) : (
                      <span className="absolute inset-0 flex items-center justify-center text-sm font-bold text-primary">
                        {p.name.charAt(0).toUpperCase()}
                      </span>
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold" style={{ color: "var(--text-primary)" }}>
                      {p.name}
                      {p.id === currentUser.id && (
                        <span className="ml-1 text-xs font-normal" style={{ color: "var(--text-muted)" }}>(You)</span>
                      )}
                    </p>
                    {p.username && (
                      <p className="text-xs" style={{ color: "var(--text-muted)" }}>@{p.username}</p>
                    )}
                  </div>
                  {p.isAdmin && (
                    <span className="shrink-0 rounded-full bg-primary/10 px-2 py-0.5 text-[11px] font-semibold text-primary">
                      Admin
                    </span>
                  )}
                </div>
              ))}
            </div>
            {isAdmin && (
              <div className="border-t px-5 py-4" style={{ borderColor: "var(--border)" }}>
                <p className="text-center text-xs" style={{ color: "var(--text-muted)" }}>
                  You&apos;re an admin of this group
                </p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
