"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";

type NotifActor = {
  id: string;
  name: string;
  username: string | null;
  image: string | null;
};

export type NotificationData = {
  id: string;
  type: string;
  postId: string | null;
  read: boolean;
  createdAt: Date | string;
  actor: NotifActor;
};

const NOTIF_TEXT: Record<string, string> = {
  like: "liked your post",
  comment: "commented on your post",
  friend_request: "sent you a friend request",
  friend_accept: "accepted your friend request",
};

const NOTIF_ICON: Record<string, React.ReactNode> = {
  like: (
    <svg className="h-4 w-4 text-rose-500" fill="currentColor" viewBox="0 0 24 24">
      <path d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
    </svg>
  ),
  comment: (
    <svg className="h-4 w-4 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
    </svg>
  ),
  friend_request: (
    <svg className="h-4 w-4 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
    </svg>
  ),
  friend_accept: (
    <svg className="h-4 w-4 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  ),
};

function timeAgo(date: Date | string) {
  const now = new Date();
  const d = new Date(date);
  const sec = Math.floor((now.getTime() - d.getTime()) / 1000);
  if (sec < 60) return "just now";
  if (sec < 3600) return `${Math.floor(sec / 60)}m ago`;
  if (sec < 86400) return `${Math.floor(sec / 3600)}h ago`;
  if (sec < 604800) return `${Math.floor(sec / 86400)}d ago`;
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

export default function NotificationList({
  notifications,
}: {
  notifications: NotificationData[];
}) {
  const router = useRouter();
  const markedRef = useRef(false);

  useEffect(() => {
    if (markedRef.current) return;
    const hasUnread = notifications.some((n) => !n.read);
    if (!hasUnread) return;
    markedRef.current = true;
    fetch("/api/notifications/read", { method: "PATCH" }).then(() => {
      router.refresh();
    });
  }, [notifications, router]);

  if (notifications.length === 0) {
    return (
      <div
        className="rounded-2xl p-12 text-center shadow-sm"
        style={{ background: "var(--surface)", border: "1px solid var(--border)" }}
      >
        <div
          className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full"
          style={{ background: "var(--surface-hover)" }}
        >
          <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" style={{ color: "var(--text-muted)" }}>
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
          </svg>
        </div>
        <p className="text-sm font-medium" style={{ color: "var(--text-secondary)" }}>
          No notifications yet
        </p>
        <p className="mt-1 text-xs" style={{ color: "var(--text-muted)" }}>
          When someone likes or comments on your posts, you&apos;ll see it here.
        </p>
      </div>
    );
  }

  return (
    <div
      className="overflow-hidden rounded-2xl shadow-sm"
      style={{ background: "var(--surface)", border: "1px solid var(--border)" }}
    >
      {notifications.map((n, i) => {
        const isPostAction = (n.type === "like" || n.type === "comment") && n.postId;
        const href = isPostAction
          ? `/posts/${n.postId}`
          : `/${n.actor.username ?? n.actor.id}`;
        const isLast = i === notifications.length - 1;

        return (
          <Link
            key={n.id}
            href={href}
            className={`flex items-center gap-3 px-4 py-3.5 transition-colors hover:bg-[var(--surface-hover)] ${
              !n.read ? "bg-primary/5" : ""
            } ${!isLast ? "border-b" : ""}`}
            style={!isLast ? { borderColor: "var(--border)" } : undefined}
          >
            {/* Actor avatar */}
            <div className="relative h-11 w-11 shrink-0 overflow-hidden rounded-full bg-primary/10">
              {n.actor.image ? (
                <Image
                  src={n.actor.image}
                  alt={n.actor.name}
                  fill
                  sizes="44px"
                  className="object-cover"
                />
              ) : (
                <span className="absolute inset-0 flex items-center justify-center text-sm font-semibold text-primary">
                  {n.actor.name[0].toUpperCase()}
                </span>
              )}
            </div>

            {/* Notification icon badge */}
            <div
              className="relative -ml-5 -mt-6 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 shadow-sm"
              style={{ borderColor: "var(--surface)", background: "var(--surface)" }}
            >
              {NOTIF_ICON[n.type]}
            </div>

            {/* Text */}
            <div className="min-w-0 flex-1">
              <p className="text-sm" style={{ color: "var(--text-primary)" }}>
                <span className="font-semibold">{n.actor.name}</span>{" "}
                <span style={{ color: !n.read ? "var(--text-secondary)" : "var(--text-muted)" }}>
                  {NOTIF_TEXT[n.type] ?? "interacted with you"}
                </span>
              </p>
              <p className="mt-0.5 text-xs" style={{ color: "var(--text-muted)" }}>
                {timeAgo(n.createdAt)}
              </p>
            </div>

            {/* Unread dot */}
            {!n.read && (
              <div className="h-2.5 w-2.5 shrink-0 rounded-full bg-primary" />
            )}
          </Link>
        );
      })}
    </div>
  );
}
