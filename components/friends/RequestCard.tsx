"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";

type Props = {
  friendship: {
    id: string;
    user: {
      id: string;
      name: string;
      username: string | null;
      image: string | null;
      bio: string | null;
    };
  };
};

export default function RequestCard({ friendship }: Props) {
  const router = useRouter();
  const [loading, setLoading] = useState<"accept" | "decline" | null>(null);
  const [done, setDone] = useState(false);

  const { id, user } = friendship;

  const initials = user.name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  async function handle(action: "accept" | "reject") {
    setLoading(action === "accept" ? "accept" : "decline");
    await fetch(`/api/friends/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action }),
    });
    setDone(true);
    setLoading(null);
    router.refresh();
  }

  if (done) return null;

  return (
    <div
      className="flex items-center gap-4 rounded-2xl p-4 shadow-sm"
      style={{ background: "var(--surface)", border: "1px solid var(--border)" }}
    >
      {/* Avatar */}
      <Link href={`/${user.username ?? user.id}`} className="shrink-0">
        <div className="relative h-14 w-14 overflow-hidden rounded-full bg-primary/10">
          {user.image ? (
            <Image src={user.image} alt={user.name} fill sizes="56px" className="object-cover" />
          ) : (
            <span className="absolute inset-0 flex items-center justify-center text-base font-semibold text-primary">
              {initials}
            </span>
          )}
        </div>
      </Link>

      {/* Info */}
      <div className="min-w-0 flex-1">
        <Link href={`/${user.username ?? user.id}`}>
          <p className="truncate font-semibold hover:underline" style={{ color: "var(--text-primary)" }}>
            {user.name}
          </p>
        </Link>
        {user.username && (
          <p className="text-xs" style={{ color: "var(--text-secondary)" }}>@{user.username}</p>
        )}
        {user.bio && (
          <p className="mt-0.5 truncate text-xs" style={{ color: "var(--text-muted)" }}>{user.bio}</p>
        )}
      </div>

      {/* Actions */}
      <div className="flex shrink-0 gap-2">
        <button
          disabled={!!loading}
          onClick={() => handle("accept")}
          className="rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-primary/90 disabled:opacity-60"
        >
          {loading === "accept" ? "…" : "Accept"}
        </button>
        <button
          disabled={!!loading}
          onClick={() => handle("reject")}
          className="rounded-xl border px-4 py-2 text-sm font-semibold transition-colors hover:bg-[var(--surface-hover)] disabled:opacity-60"
          style={{
            borderColor: "var(--border)",
            background: "var(--surface)",
            color: "var(--text-secondary)",
          }}
        >
          {loading === "decline" ? "…" : "Decline"}
        </button>
      </div>
    </div>
  );
}
