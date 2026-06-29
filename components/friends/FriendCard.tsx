"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { isOnline } from "@/utils/online";

type Props = {
  friendship: {
    id: string;
    friend: {
      id: string;
      name: string;
      username: string | null;
      image: string | null;
      bio: string | null;
      lastSeen: Date | string | null;
    };
  };
};

export default function FriendCard({ friendship }: Props) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [removed, setRemoved] = useState(false);

  const { id, friend } = friendship;

  const initials = friend.name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  async function unfriend() {
    setLoading(true);
    await fetch(`/api/friends/${id}`, { method: "DELETE" });
    setRemoved(true);
    setLoading(false);
    router.refresh();
  }

  if (removed) return null;

  return (
    <div
      className="flex items-center gap-4 rounded-2xl p-4 shadow-sm"
      style={{ background: "var(--surface)", border: "1px solid var(--border)" }}
    >
      {/* Avatar with online dot */}
      <Link href={`/${friend.username ?? friend.id}`} className="shrink-0">
        <div className="relative inline-flex">
          <div className="relative h-12 w-12 overflow-hidden rounded-full bg-primary/10">
            {friend.image ? (
              <Image src={friend.image} alt={friend.name} fill sizes="48px" className="object-cover" />
            ) : (
              <span className="absolute inset-0 flex items-center justify-center text-sm font-semibold text-primary">
                {initials}
              </span>
            )}
          </div>
          {isOnline(friend.lastSeen) && (
            <span
              className="absolute bottom-0 right-0 block h-3 w-3 rounded-full border-2 bg-primary"
              style={{ borderColor: "var(--surface)" }}
            />
          )}
        </div>
      </Link>

      {/* Info */}
      <div className="min-w-0 flex-1">
        <Link href={`/${friend.username ?? friend.id}`}>
          <p className="truncate font-semibold hover:underline" style={{ color: "var(--text-primary)" }}>
            {friend.name}
          </p>
        </Link>
        {friend.username && (
          <p className="text-xs" style={{ color: "var(--text-secondary)" }}>@{friend.username}</p>
        )}
        {friend.bio && (
          <p className="mt-0.5 truncate text-xs" style={{ color: "var(--text-muted)" }}>{friend.bio}</p>
        )}
      </div>

      {/* Unfriend */}
      <button
        disabled={loading}
        onClick={unfriend}
        className="shrink-0 rounded-xl border px-4 py-2 text-sm font-semibold transition-colors hover:border-red-200 hover:bg-red-50 hover:text-red-600 disabled:opacity-60"
        style={{ borderColor: "var(--border)", color: "var(--text-secondary)" }}
      >
        {loading ? "…" : "Unfriend"}
      </button>
    </div>
  );
}
