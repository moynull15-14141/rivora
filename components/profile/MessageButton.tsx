"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function MessageButton({ userId }: { userId: string }) {
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function openChat() {
    setLoading(true);
    const res = await fetch("/api/conversations", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId }),
    });
    if (res.ok) {
      const { id } = await res.json();
      router.push(`/messages/${id}`);
    }
    setLoading(false);
  }

  return (
    <button
      onClick={openChat}
      disabled={loading}
      className="flex items-center gap-2 rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-primary/90 disabled:opacity-60"
    >
      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
      </svg>
      {loading ? "Opening…" : "Message"}
    </button>
  );
}
