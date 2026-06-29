"use client";

import { useState } from "react";

export default function LikeButton({
  postId,
  initialCount,
  initialLikeId,
}: {
  postId: string;
  initialCount: number;
  initialLikeId: string | null;
}) {
  const [likeId, setLikeId] = useState<string | null>(initialLikeId);
  const [count, setCount] = useState(initialCount);
  const [loading, setLoading] = useState(false);

  const liked = !!likeId;

  async function toggle() {
    if (loading) return;
    setLoading(true);

    if (likeId) {
      const res = await fetch(`/api/likes/${likeId}`, { method: "DELETE" });
      if (res.ok) {
        setLikeId(null);
        setCount((c) => Math.max(0, c - 1));
      }
    } else {
      const res = await fetch("/api/likes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ postId }),
      });
      const json = await res.json();
      if (json.success && json.data?.id) {
        setLikeId(json.data.id);
        setCount((c) => c + 1);
      }
    }

    setLoading(false);
  }

  return (
    <button
      onClick={toggle}
      disabled={loading}
      className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium transition-colors disabled:opacity-60 ${
        liked
          ? "text-rose-500 bg-rose-50 hover:bg-rose-100"
          : "hover:bg-[var(--surface-hover)] hover:text-[var(--text-primary)]"
      }`}
      style={!liked ? { color: "var(--text-secondary)" } : undefined}
    >
      <svg
        className="h-4 w-4"
        fill={liked ? "currentColor" : "none"}
        viewBox="0 0 24 24"
        stroke="currentColor"
        strokeWidth={2}
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
        />
      </svg>
      <span>{count > 0 ? count : ""}</span>
      <span className="hidden sm:inline">{liked ? "Liked" : "Like"}</span>
    </button>
  );
}
