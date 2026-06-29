import { redirect } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { getCurrentUser } from "@/lib/session";
import { db } from "@/lib/db";
import { isOnline } from "@/utils/online";

export const metadata = { title: "Messages — Rivora" };

function timeAgo(date: Date | string) {
  const sec = Math.floor((Date.now() - new Date(date).getTime()) / 1000);
  if (sec < 60) return "now";
  if (sec < 3600) return `${Math.floor(sec / 60)}m`;
  if (sec < 86400) return `${Math.floor(sec / 3600)}h`;
  return `${Math.floor(sec / 86400)}d`;
}

function lastSeenLabel(lastSeen: Date | string | null): string {
  if (!lastSeen) return "Never active";
  const ms = Date.now() - new Date(lastSeen).getTime();
  if (ms < 5 * 60 * 1000) return "Active now";
  const minutes = Math.floor(ms / 60000);
  if (minutes < 60) return `Active ${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `Active ${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `Active ${days}d ago`;
}

export default async function MessagesPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string }>;
}) {
  const { tab } = await searchParams;
  const activeTab = tab === "active" ? "active" : "chats";

  const currentUser = await getCurrentUser();
  if (!currentUser) redirect("/login");

  // Tab bar — only shown on mobile (desktop uses sidebar nav)
  const tabBar = (
    <div
      className="-mx-4 mb-5 flex border-b px-1 lg:hidden sm:-mx-6 sm:px-3"
      style={{ borderColor: "var(--border)" }}
    >
      <Link
        href="/messages"
        className={`flex-1 py-3 text-center text-sm font-semibold transition-colors border-b-2 ${
          activeTab === "chats"
            ? "border-primary text-primary"
            : "border-transparent"
        }`}
        style={activeTab !== "chats" ? { color: "var(--text-muted)" } : undefined}
      >
        Chats
      </Link>
      <Link
        href="/messages?tab=active"
        className={`flex-1 py-3 text-center text-sm font-semibold transition-colors border-b-2 ${
          activeTab === "active"
            ? "border-primary text-primary"
            : "border-transparent"
        }`}
        style={activeTab !== "active" ? { color: "var(--text-muted)" } : undefined}
      >
        Active
      </Link>
    </div>
  );

  /* ─── ACTIVE FRIENDS TAB ─── */
  if (activeTab === "active") {
    const rows = await db.friend.findMany({
      where: {
        status: "accepted",
        OR: [{ userId: currentUser.id }, { friendId: currentUser.id }],
      },
      select: {
        id: true,
        userId: true,
        user: { select: { id: true, name: true, username: true, image: true, lastSeen: true } },
        friend: { select: { id: true, name: true, username: true, image: true, lastSeen: true } },
      },
    });

    const friends = rows
      .map((r) => ({
        id: r.id,
        friend: r.userId === currentUser.id ? r.friend : r.user,
      }))
      .sort((a, b) => {
        const aO = isOnline(a.friend.lastSeen);
        const bO = isOnline(b.friend.lastSeen);
        if (aO !== bO) return aO ? -1 : 1;
        const aT = a.friend.lastSeen ? +new Date(a.friend.lastSeen) : 0;
        const bT = b.friend.lastSeen ? +new Date(b.friend.lastSeen) : 0;
        return bT - aT;
      });

    const onlineCount = friends.filter((f) => isOnline(f.friend.lastSeen)).length;

    return (
      <div className="mx-auto max-w-lg px-4 py-6 sm:px-6">
        {tabBar}

        <div className="mb-4 flex items-center gap-3">
          <h1 className="font-heading text-xl font-bold" style={{ color: "var(--text-primary)" }}>
            Active Friends
          </h1>
          {onlineCount > 0 && (
            <span className="flex items-center gap-1.5 rounded-full bg-emerald-500/10 px-2.5 py-0.5 text-xs font-semibold text-emerald-600">
              <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-500" />
              {onlineCount} online
            </span>
          )}
        </div>

        {friends.length === 0 ? (
          <div
            className="rounded-2xl p-8 text-center shadow-sm"
            style={{ background: "var(--surface)", border: "1px solid var(--border)" }}
          >
            <p className="font-semibold" style={{ color: "var(--text-primary)" }}>No friends yet</p>
            <p className="mt-1 text-sm" style={{ color: "var(--text-muted)" }}>
              Add friends to see when they&apos;re active
            </p>
            <Link
              href="/friends"
              className="mt-4 inline-block rounded-xl bg-primary px-5 py-2 text-sm font-semibold text-white transition-colors hover:bg-primary/90"
            >
              Find Friends
            </Link>
          </div>
        ) : (
          <div
            className="overflow-hidden rounded-2xl shadow-sm"
            style={{ background: "var(--surface)", border: "1px solid var(--border)" }}
          >
            {friends.map(({ id, friend }, index) => {
              const online = isOnline(friend.lastSeen);
              const initials = friend.name
                .split(" ")
                .map((n) => n[0])
                .join("")
                .toUpperCase()
                .slice(0, 2);

              return (
                <Link
                  key={id}
                  href={`/${friend.username ?? friend.id}`}
                  className={`flex items-center gap-4 px-5 py-4 transition-colors hover:bg-[var(--surface-hover)] ${
                    index > 0 ? "border-t" : ""
                  }`}
                  style={{ borderColor: "var(--border)" }}
                >
                  <div className="relative shrink-0">
                    <div className="relative h-12 w-12 overflow-hidden rounded-full bg-primary/10">
                      {friend.image ? (
                        <Image src={friend.image} alt={friend.name} fill sizes="48px" className="object-cover" />
                      ) : (
                        <span className="absolute inset-0 flex items-center justify-center text-sm font-semibold text-primary">
                          {initials}
                        </span>
                      )}
                    </div>
                    {online && (
                      <span
                        className="absolute bottom-0 right-0 block h-3.5 w-3.5 rounded-full border-2 bg-emerald-500"
                        style={{ borderColor: "var(--surface)" }}
                      />
                    )}
                  </div>

                  <div className="min-w-0 flex-1">
                    <p className="truncate font-semibold" style={{ color: "var(--text-primary)" }}>
                      {friend.name}
                    </p>
                    <p
                      className={`text-xs ${online ? "font-medium text-emerald-500" : ""}`}
                      style={!online ? { color: "var(--text-muted)" } : undefined}
                    >
                      {lastSeenLabel(friend.lastSeen)}
                    </p>
                  </div>

                  {online && (
                    <span className="shrink-0 rounded-full bg-emerald-500/10 px-2.5 py-0.5 text-xs font-semibold text-emerald-600">
                      Online
                    </span>
                  )}
                </Link>
              );
            })}
          </div>
        )}
      </div>
    );
  }

  /* ─── CHATS TAB (default) ─── */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const dbc = db as any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const conversations: any[] = dbc.conversation
    ? await dbc.conversation.findMany({
        where: { participants: { some: { userId: currentUser.id } } },
        include: {
          participants: {
            where: { userId: { not: currentUser.id } },
            include: {
              user: {
                select: { id: true, name: true, username: true, image: true, lastSeen: true },
              },
            },
          },
          messages: {
            orderBy: { createdAt: "desc" },
            take: 1,
            select: { id: true, content: true, senderId: true, read: true, createdAt: true },
          },
        },
        orderBy: { updatedAt: "desc" },
      })
    : [];

  return (
    <div className="mx-auto max-w-lg px-4 py-6 sm:px-6">
      {tabBar}

      <h1 className="mb-4 font-heading text-xl font-bold" style={{ color: "var(--text-primary)" }}>
        Messages
      </h1>

      {conversations.length === 0 ? (
        <div
          className="rounded-2xl p-10 text-center shadow-sm"
          style={{ background: "var(--surface)", border: "1px solid var(--border)" }}
        >
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-primary/10">
            <svg className="h-7 w-7 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </svg>
          </div>
          <p className="font-semibold" style={{ color: "var(--text-secondary)" }}>
            No conversations yet
          </p>
          <p className="mt-1 text-sm" style={{ color: "var(--text-muted)" }}>
            Visit a friend&apos;s profile and click &quot;Message&quot; to start chatting.
          </p>
        </div>
      ) : (
        <div
          className="flex flex-col gap-1 overflow-hidden rounded-2xl shadow-sm"
          style={{ background: "var(--surface)", border: "1px solid var(--border)" }}
        >
          {conversations.map((c, idx) => {
            const other = c.participants[0]?.user;
            if (!other) return null;
            const lastMsg = c.messages[0];
            const unread = lastMsg && lastMsg.senderId !== currentUser.id && !lastMsg.read;

            return (
              <Link
                key={c.id}
                href={`/messages/${c.id}`}
                className={`flex items-center gap-3 px-4 py-3 transition-colors hover:bg-[var(--surface-hover)] ${
                  idx !== conversations.length - 1 ? "border-b" : ""
                }`}
                style={idx !== conversations.length - 1 ? { borderColor: "var(--border)" } : undefined}
              >
                <div className="relative inline-flex shrink-0">
                  <div className="relative h-12 w-12 overflow-hidden rounded-full bg-primary/10">
                    {other.image ? (
                      <Image src={other.image} alt={other.name} fill sizes="48px" className="object-cover" />
                    ) : (
                      <span className="absolute inset-0 flex items-center justify-center text-sm font-semibold text-primary">
                        {other.name.charAt(0).toUpperCase()}
                      </span>
                    )}
                  </div>
                  {isOnline(other.lastSeen) && (
                    <span
                      className="absolute bottom-0 right-0 block h-3 w-3 rounded-full border-2 bg-primary"
                      style={{ borderColor: "var(--surface)" }}
                    />
                  )}
                </div>

                <div className="min-w-0 flex-1">
                  <div className="flex items-baseline justify-between gap-2">
                    <p
                      className={`truncate text-sm ${unread ? "font-bold" : "font-semibold"}`}
                      style={{ color: "var(--text-primary)" }}
                    >
                      {other.name}
                    </p>
                    {lastMsg && (
                      <span className="shrink-0 text-[11px]" style={{ color: "var(--text-muted)" }}>
                        {timeAgo(lastMsg.createdAt)}
                      </span>
                    )}
                  </div>
                  {lastMsg ? (
                    <p
                      className={`truncate text-xs ${unread ? "font-semibold" : ""}`}
                      style={{ color: unread ? "var(--text-secondary)" : "var(--text-muted)" }}
                    >
                      {lastMsg.senderId === currentUser.id ? "You: " : ""}
                      {lastMsg.content}
                    </p>
                  ) : (
                    <p className="text-xs" style={{ color: "var(--text-muted)" }}>
                      No messages yet
                    </p>
                  )}
                </div>

                {unread && (
                  <span className="h-2.5 w-2.5 shrink-0 rounded-full bg-primary" />
                )}
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
