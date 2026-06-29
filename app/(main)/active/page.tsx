import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/session";
import { db } from "@/lib/db";
import { isOnline } from "@/utils/online";
import Link from "next/link";
import Image from "next/image";

export const metadata = { title: "Active Friends — Rivora" };

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

export default async function ActivePage() {
  const currentUser = await getCurrentUser();
  if (!currentUser) redirect("/login");

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
    <div className="mx-auto max-w-2xl px-4 py-6 sm:px-6">
      {/* Header */}
      <div className="mb-5 flex items-center gap-3">
        <h1 className="font-heading text-2xl font-bold" style={{ color: "var(--text-primary)" }}>
          Active Friends
        </h1>
        {onlineCount > 0 && (
          <span className="flex items-center gap-1.5 rounded-full bg-emerald-500/10 px-3 py-1 text-sm font-semibold text-emerald-600">
            <span className="h-2 w-2 animate-pulse rounded-full bg-emerald-500" />
            {onlineCount} online
          </span>
        )}
      </div>

      {friends.length === 0 ? (
        <div
          className="rounded-2xl p-8 text-center shadow-sm"
          style={{ background: "var(--surface)", border: "1px solid var(--border)" }}
        >
          <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-primary/10">
            <svg className="h-7 w-7 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          </div>
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
                className={`flex items-center gap-4 px-5 py-4 transition-colors hover:bg-[var(--surface-hover)] ${index > 0 ? "border-t" : ""}`}
                style={{ borderColor: "var(--border)" }}
              >
                {/* Avatar with online indicator */}
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

                {/* Info */}
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
