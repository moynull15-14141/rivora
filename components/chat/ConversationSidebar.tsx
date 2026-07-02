"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import CreateGroupModal from "./CreateGroupModal";

type AvatarUser = { id: string; name: string; image: string | null };

type Conversation = {
  id: string;
  isGroup: boolean;
  name: string | null;
  avatar: string | null;
  lastMessageAt: string;
  otherUser: { id: string; name: string; username: string | null; image: string | null; lastSeen: string | null } | null;
  participantCount: number;
  avatarUsers: AvatarUser[];
  lastMessage: {
    content: string;
    senderId: string;
    senderName: string | null;
    read: boolean;
    createdAt: string;
  } | null;
  unread: boolean;
};

type Friend = { id: string; name: string; username: string | null; image: string | null };

type CurrentUser = { id: string; name: string; image: string | null };

function timeAgo(date: string) {
  const sec = Math.floor((Date.now() - new Date(date).getTime()) / 1000);
  if (sec < 60) return "now";
  if (sec < 3600) return `${Math.floor(sec / 60)}m`;
  if (sec < 86400) return `${Math.floor(sec / 3600)}h`;
  return `${Math.floor(sec / 86400)}d`;
}

function StackedAvatars({ users, size = 48 }: { users: AvatarUser[]; size?: number }) {
  const u0 = users[0];
  const u1 = users[1];
  const s = size;
  const sm = Math.round(s * 0.6);
  const borderW = 2;

  if (!u0) {
    return (
      <div
        className="flex shrink-0 items-center justify-center rounded-full bg-primary/10"
        style={{ width: s, height: s }}
      >
        <svg className="text-primary" style={{ width: s * 0.45, height: s * 0.45 }} fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
      </div>
    );
  }

  if (!u1) {
    return (
      <div className="relative shrink-0 overflow-hidden rounded-full bg-primary/10" style={{ width: s, height: s }}>
        {u0.image ? (
          <Image src={u0.image} alt={u0.name} fill sizes={`${s}px`} className="object-cover" />
        ) : (
          <span className="absolute inset-0 flex items-center justify-center font-bold text-primary" style={{ fontSize: s * 0.35 }}>
            {u0.name.charAt(0).toUpperCase()}
          </span>
        )}
      </div>
    );
  }

  return (
    <div className="relative shrink-0" style={{ width: s, height: s }}>
      {/* Bottom-left: second user */}
      <div
        className="absolute bottom-0 left-0 overflow-hidden rounded-full bg-primary/10"
        style={{ width: sm, height: sm, border: `${borderW}px solid var(--surface)` }}
      >
        {u1.image ? (
          <Image src={u1.image} alt={u1.name} fill sizes={`${sm}px`} className="object-cover" />
        ) : (
          <span className="absolute inset-0 flex items-center justify-center font-bold text-primary" style={{ fontSize: sm * 0.38 }}>
            {u1.name.charAt(0).toUpperCase()}
          </span>
        )}
      </div>
      {/* Top-right: first user */}
      <div
        className="absolute right-0 top-0 overflow-hidden rounded-full bg-primary/10"
        style={{ width: sm + 4, height: sm + 4, border: `${borderW}px solid var(--surface)` }}
      >
        {u0.image ? (
          <Image src={u0.image} alt={u0.name} fill sizes={`${sm + 4}px`} className="object-cover" />
        ) : (
          <span className="absolute inset-0 flex items-center justify-center font-bold text-primary" style={{ fontSize: (sm + 4) * 0.38 }}>
            {u0.name.charAt(0).toUpperCase()}
          </span>
        )}
      </div>
    </div>
  );
}

export default function ConversationSidebar({ currentUser }: { currentUser: CurrentUser }) {
  const pathname = usePathname();
  const router = useRouter();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [search, setSearch] = useState("");
  const [showMenu, setShowMenu] = useState(false);
  const [showGroupModal, setShowGroupModal] = useState(false);
  const [showNewDM, setShowNewDM] = useState(false);
  const [dmSearch, setDmSearch] = useState("");
  const [dmFriends, setDmFriends] = useState<Friend[]>([]);
  const [dmCreating, setDmCreating] = useState<string | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const dmSearchRef = useRef<HTMLInputElement>(null);

  const fetchConversations = useCallback(async () => {
    try {
      const res = await fetch("/api/conversations", { cache: "no-store" });
      if (res.ok) setConversations(await res.json());
    } catch {}
  }, []);

  useEffect(() => {
    fetchConversations();
    const timer = setInterval(fetchConversations, 5000);
    return () => clearInterval(timer);
  }, [fetchConversations]);

  // Fetch friends for DM
  useEffect(() => {
    if (!showNewDM) return;
    fetch("/api/friends?status=accepted&limit=100")
      .then((r) => r.json())
      .then((data) => {
        const list = Array.isArray(data) ? data : (data.data ?? []);
        setDmFriends(list);
      })
      .catch(() => {});
    setTimeout(() => dmSearchRef.current?.focus(), 50);
  }, [showNewDM]);

  // Close menu on outside click
  useEffect(() => {
    if (!showMenu) return;
    const close = (e: MouseEvent) => {
      if (!menuRef.current?.contains(e.target as Node)) setShowMenu(false);
    };
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, [showMenu]);

  async function startDM(friendId: string) {
    setDmCreating(friendId);
    try {
      const res = await fetch("/api/conversations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isGroup: false, userId: friendId }),
      });
      if (res.ok) {
        const json = await res.json();
        setShowNewDM(false);
        setDmSearch("");
        router.push(`/messages/${json.id}`);
        fetchConversations();
      }
    } finally {
      setDmCreating(null);
    }
  }

  const activeId = pathname.startsWith("/messages/") ? pathname.split("/")[2] : null;

  const filtered = conversations.filter((c) => {
    const q = search.toLowerCase();
    if (!q) return true;
    if (c.isGroup) return (c.name ?? "").toLowerCase().includes(q);
    return (
      (c.otherUser?.name ?? "").toLowerCase().includes(q) ||
      (c.otherUser?.username ?? "").toLowerCase().includes(q)
    );
  });

  const filteredDmFriends = dmFriends.filter((f) => {
    const q = dmSearch.toLowerCase();
    return f.name.toLowerCase().includes(q) || (f.username ?? "").toLowerCase().includes(q);
  });

  return (
    <>
      {/* New DM overlay */}
      {showNewDM && (
        <div className="absolute inset-0 z-20 flex flex-col" style={{ background: "var(--surface)" }}>
          <div className="flex items-center gap-3 border-b px-4 py-3" style={{ borderColor: "var(--border)" }}>
            <button
              onClick={() => { setShowNewDM(false); setDmSearch(""); }}
              className="flex h-8 w-8 items-center justify-center rounded-lg hover:bg-[var(--surface-hover)]"
              style={{ color: "var(--text-muted)" }}
            >
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <input
              ref={dmSearchRef}
              value={dmSearch}
              onChange={(e) => setDmSearch(e.target.value)}
              placeholder="Search friends…"
              className="flex-1 bg-transparent text-sm outline-none"
              style={{ color: "var(--text-primary)" }}
            />
          </div>
          <div className="flex-1 overflow-y-auto">
            {filteredDmFriends.length === 0 ? (
              <p className="px-4 py-8 text-center text-sm" style={{ color: "var(--text-muted)" }}>
                {dmFriends.length === 0 ? "No friends yet" : "No results"}
              </p>
            ) : (
              filteredDmFriends.map((f) => (
                <button
                  key={f.id}
                  onClick={() => startDM(f.id)}
                  disabled={dmCreating === f.id}
                  className="flex w-full items-center gap-3 border-b px-4 py-3 text-left transition-colors hover:bg-[var(--surface-hover)] disabled:opacity-60"
                  style={{ borderColor: "var(--border)" }}
                >
                  <div className="relative h-10 w-10 shrink-0 overflow-hidden rounded-full bg-primary/10">
                    {f.image ? (
                      <Image src={f.image} alt={f.name} fill sizes="40px" className="object-cover" />
                    ) : (
                      <span className="absolute inset-0 flex items-center justify-center text-sm font-bold text-primary">
                        {f.name.charAt(0).toUpperCase()}
                      </span>
                    )}
                  </div>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold" style={{ color: "var(--text-primary)" }}>{f.name}</p>
                    {f.username && <p className="text-xs" style={{ color: "var(--text-muted)" }}>@{f.username}</p>}
                  </div>
                  {dmCreating === f.id && (
                    <svg className="ml-auto h-4 w-4 animate-spin text-primary" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"/>
                    </svg>
                  )}
                </button>
              ))
            )}
          </div>
        </div>
      )}

      {/* Header */}
      <div
        className="flex items-center justify-between border-b px-4 py-3"
        style={{ borderColor: "var(--border)" }}
      >
        <h2 className="font-heading text-base font-bold" style={{ color: "var(--text-primary)" }}>
          Messages
        </h2>
        <div className="relative" ref={menuRef}>
          <button
            onClick={() => setShowMenu((v) => !v)}
            className="flex h-8 w-8 items-center justify-center rounded-lg transition-colors hover:bg-[var(--surface-hover)]"
            style={{ color: "var(--text-muted)" }}
          >
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
          </button>
          {showMenu && (
            <div
              className="absolute right-0 top-10 z-10 min-w-[180px] overflow-hidden rounded-xl shadow-lg"
              style={{ background: "var(--surface)", border: "1px solid var(--border)" }}
            >
              <button
                onClick={() => { setShowMenu(false); setShowNewDM(true); }}
                className="flex w-full items-center gap-3 px-4 py-3 text-sm transition-colors hover:bg-[var(--surface-hover)]"
                style={{ color: "var(--text-primary)" }}
              >
                <svg className="h-4 w-4 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
                New Message
              </button>
              <button
                onClick={() => { setShowMenu(false); setShowGroupModal(true); }}
                className="flex w-full items-center gap-3 border-t px-4 py-3 text-sm transition-colors hover:bg-[var(--surface-hover)]"
                style={{ color: "var(--text-primary)", borderColor: "var(--border)" }}
              >
                <svg className="h-4 w-4 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
                New Group Chat
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Search */}
      <div className="px-3 py-2">
        <div className="relative">
          <svg
            className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2"
            style={{ color: "var(--text-muted)" }}
            fill="none" viewBox="0 0 24 24" stroke="currentColor"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search conversations…"
            className="w-full rounded-xl border py-2 pl-9 pr-4 text-sm outline-none focus:border-primary"
            style={{
              borderColor: "var(--border)",
              background: "var(--surface-hover)",
              color: "var(--text-primary)",
            }}
          />
        </div>
      </div>

      {/* Conversation list */}
      <div className="flex-1 overflow-y-auto">
        {filtered.length === 0 ? (
          <div className="px-4 py-10 text-center">
            <p className="text-sm" style={{ color: "var(--text-muted)" }}>
              {search ? "No results" : "No conversations yet"}
            </p>
            {!search && (
              <button
                onClick={() => setShowNewDM(true)}
                className="mt-3 text-xs font-semibold text-primary hover:underline"
              >
                Start a conversation
              </button>
            )}
          </div>
        ) : (
          filtered.map((c) => {
            const isActive = activeId === c.id;
            const displayName = c.isGroup ? (c.name ?? "Group") : (c.otherUser?.name ?? "Unknown");
            const lastMsg = c.lastMessage;
            const lastMsgText = lastMsg
              ? c.isGroup
                ? `${lastMsg.senderId === currentUser.id ? "You" : (lastMsg.senderName ?? "")}: ${lastMsg.content}`
                : lastMsg.senderId === currentUser.id
                ? `You: ${lastMsg.content}`
                : lastMsg.content
              : null;
            const ts = lastMsg ? timeAgo(lastMsg.createdAt) : "";

            return (
              <Link
                key={c.id}
                href={`/messages/${c.id}`}
                className={`flex items-center gap-3 border-b px-4 py-3 transition-colors ${
                  isActive ? "bg-primary/10" : "hover:bg-[var(--surface-hover)]"
                }`}
                style={{ borderColor: "var(--border)" }}
              >
                {/* Avatar */}
                {c.isGroup ? (
                  c.avatar ? (
                    <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-full bg-primary/10">
                      <Image src={c.avatar} alt={displayName} fill sizes="48px" className="object-cover" />
                    </div>
                  ) : (
                    <StackedAvatars users={c.avatarUsers} size={48} />
                  )
                ) : (
                  <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-full bg-primary/10">
                    {c.otherUser?.image ? (
                      <Image src={c.otherUser.image} alt={displayName} fill sizes="48px" className="object-cover" />
                    ) : (
                      <span className="absolute inset-0 flex items-center justify-center text-sm font-bold text-primary">
                        {displayName.charAt(0).toUpperCase()}
                      </span>
                    )}
                  </div>
                )}

                {/* Text */}
                <div className="min-w-0 flex-1">
                  <div className="flex items-baseline justify-between gap-1">
                    <p
                      className={`truncate text-sm ${c.unread ? "font-bold" : "font-semibold"}`}
                      style={{ color: isActive ? "var(--primary)" : "var(--text-primary)" }}
                    >
                      {displayName}
                    </p>
                    {ts && (
                      <span className="shrink-0 text-[11px]" style={{ color: "var(--text-muted)" }}>
                        {ts}
                      </span>
                    )}
                  </div>
                  {lastMsgText ? (
                    <p
                      className={`truncate text-xs ${c.unread ? "font-semibold" : ""}`}
                      style={{ color: c.unread ? "var(--text-secondary)" : "var(--text-muted)" }}
                    >
                      {lastMsgText}
                    </p>
                  ) : (
                    <p className="text-xs" style={{ color: "var(--text-muted)" }}>
                      {c.isGroup ? `${c.participantCount} members` : "No messages yet"}
                    </p>
                  )}
                </div>

                {/* Unread dot */}
                {c.unread && <span className="h-2.5 w-2.5 shrink-0 rounded-full bg-primary" />}
              </Link>
            );
          })
        )}
      </div>

      {showGroupModal && (
        <CreateGroupModal onClose={() => { setShowGroupModal(false); fetchConversations(); }} />
      )}
    </>
  );
}
