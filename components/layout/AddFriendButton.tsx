"use client";

import { useState } from "react";

export default function AddFriendButton({ userId }: { userId: string }) {
  const [state, setState] = useState<"idle" | "loading" | "sent">("idle");

  async function handleAdd() {
    setState("loading");
    const res = await fetch("/api/friends", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ friendId: userId }),
    });
    setState(res.ok ? "sent" : "idle");
  }

  if (state === "sent") {
    return (
      <span className="text-xs font-medium text-gray-400">Request sent</span>
    );
  }

  return (
    <button
      onClick={handleAdd}
      disabled={state === "loading"}
      className="rounded-lg bg-primary/10 px-3 py-1.5 text-xs font-semibold text-primary transition-colors hover:bg-primary/20 disabled:opacity-60"
    >
      {state === "loading" ? "…" : "Add"}
    </button>
  );
}
