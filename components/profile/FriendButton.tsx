"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type Friendship = {
  id: string;
  status: string;
  requestedBy: string;
} | null;

export default function FriendButton({
  profileUserId,
  currentUserId,
  initialFriendship,
}: {
  profileUserId: string;
  currentUserId: string;
  initialFriendship: Friendship;
}) {
  const router = useRouter();
  const [friendship, setFriendship] = useState<Friendship>(initialFriendship);
  const [loading, setLoading] = useState(false);

  async function sendRequest() {
    setLoading(true);
    const res = await fetch("/api/friends", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ friendId: profileUserId }),
    });
    const json = await res.json();
    if (json.success) setFriendship(json.data);
    setLoading(false);
    router.refresh();
  }

  async function cancelOrUnfriend() {
    if (!friendship) return;
    setLoading(true);
    await fetch(`/api/friends/${friendship.id}`, { method: "DELETE" });
    setFriendship(null);
    setLoading(false);
    router.refresh();
  }

  async function accept() {
    if (!friendship) return;
    setLoading(true);
    const res = await fetch(`/api/friends/${friendship.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "accept" }),
    });
    const json = await res.json();
    if (json.success) setFriendship(json.data);
    setLoading(false);
    router.refresh();
  }

  async function decline() {
    if (!friendship) return;
    setLoading(true);
    await fetch(`/api/friends/${friendship.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "reject" }),
    });
    setFriendship(null);
    setLoading(false);
    router.refresh();
  }

  const base = "rounded-xl px-5 py-2 text-sm font-semibold transition-colors disabled:opacity-60";

  // No relationship
  if (!friendship) {
    return (
      <button
        disabled={loading}
        onClick={sendRequest}
        className={`${base} bg-primary text-white hover:bg-primary/90`}
      >
        {loading ? "Sending…" : "Add Friend"}
      </button>
    );
  }

  // Already friends
  if (friendship.status === "accepted") {
    return (
      <button
        disabled={loading}
        onClick={cancelOrUnfriend}
        className={`${base} group border hover:border-red-200 hover:bg-red-50 hover:text-red-600`}
        style={{ borderColor: "var(--border)", background: "var(--surface)", color: "var(--text-secondary)" }}
      >
        <span className="group-hover:hidden">{loading ? "…" : "Friends"}</span>
        <span className="hidden group-hover:inline">Unfriend</span>
      </button>
    );
  }

  // Pending — current user sent the request
  if (friendship.requestedBy === currentUserId) {
    return (
      <button
        disabled={loading}
        onClick={cancelOrUnfriend}
        className={`${base} border hover:bg-[var(--surface-hover)]`}
        style={{ borderColor: "var(--border)", background: "var(--surface-hover)", color: "var(--text-muted)" }}
      >
        {loading ? "…" : "Request Sent"}
      </button>
    );
  }

  // Pending — profile user sent the request to current user
  return (
    <div className="flex gap-2">
      <button
        disabled={loading}
        onClick={accept}
        className={`${base} bg-primary text-white hover:bg-primary/90`}
      >
        Accept
      </button>
      <button
        disabled={loading}
        onClick={decline}
        className={`${base} border hover:bg-[var(--surface-hover)]`}
        style={{ borderColor: "var(--border)", background: "var(--surface)", color: "var(--text-secondary)" }}
      >
        Decline
      </button>
    </div>
  );
}
