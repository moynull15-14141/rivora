"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";

type Friend = { id: string; name: string; username: string | null; image: string | null };

type Props = {
  conversationId: string;
  existingMemberIds: string[]; // active + pending, to exclude
  isAdmin: boolean;
  onClose: () => void;
  onDone: () => void; // refresh participants after adding
};

export default function AddMemberModal({
  conversationId,
  existingMemberIds,
  isAdmin,
  onClose,
  onDone,
}: Props) {
  const [friends, setFriends] = useState<Friend[]>([]);
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<string | null>(null);
  const searchRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetch("/api/friends?status=accepted&limit=100")
      .then((r) => r.json())
      .then((data) => {
        const list: Friend[] = Array.isArray(data) ? data : (data.data ?? []);
        // Exclude already in group
        setFriends(list.filter((f) => !existingMemberIds.includes(f.id)));
      })
      .catch(() => {});
    setTimeout(() => searchRef.current?.focus(), 50);
  // existingMemberIds changes identity on each render, stringify to compare
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [conversationId]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [onClose]);

  function toggle(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  async function handleSubmit() {
    if (selected.size === 0 || submitting) return;
    setSubmitting(true);
    try {
      const res = await fetch(`/api/conversations/${conversationId}/participants`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userIds: [...selected] }),
      });
      const json = await res.json();
      if (res.ok) {
        setResult(json.message ?? "Done");
        onDone();
      } else {
        setResult(json.error ?? "Failed");
      }
    } finally {
      setSubmitting(false);
    }
  }

  const filtered = friends.filter((f) => {
    const q = search.toLowerCase();
    return f.name.toLowerCase().includes(q) || (f.username ?? "").toLowerCase().includes(q);
  });

  return (
    <div className="fixed inset-0 z-[300] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div
        className="relative z-10 flex w-full max-w-sm flex-col overflow-hidden rounded-2xl shadow-2xl"
        style={{ background: "var(--surface)", border: "1px solid var(--border)", maxHeight: "85dvh" }}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b px-5 py-4" style={{ borderColor: "var(--border)" }}>
          <h2 className="font-bold" style={{ color: "var(--text-primary)" }}>Add Members</h2>
          <button
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-full hover:bg-[var(--surface-hover)]"
            style={{ color: "var(--text-muted)" }}
          >
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {result ? (
          /* Success / result screen */
          <div className="flex flex-1 flex-col items-center justify-center gap-4 px-6 py-8 text-center">
            <div className={`flex h-14 w-14 items-center justify-center rounded-full ${result.toLowerCase().includes("error") || result.toLowerCase().includes("fail") ? "bg-red-100" : "bg-emerald-100"}`}>
              {result.toLowerCase().includes("error") || result.toLowerCase().includes("fail") ? (
                <svg className="h-7 w-7 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              ) : (
                <svg className="h-7 w-7 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                </svg>
              )}
            </div>
            <p className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>{result}</p>
            {!isAdmin && !result.toLowerCase().includes("error") && (
              <p className="text-xs" style={{ color: "var(--text-muted)" }}>
                The admin will review and approve your invite.
              </p>
            )}
            <button
              onClick={onClose}
              className="rounded-xl bg-primary px-6 py-2 text-sm font-semibold text-white"
            >
              Done
            </button>
          </div>
        ) : (
          <>
            {/* Non-admin note */}
            {!isAdmin && (
              <div
                className="mx-4 mt-3 rounded-xl px-4 py-2.5 text-xs"
                style={{ background: "var(--surface-hover)", color: "var(--text-muted)" }}
              >
                Your invite will need admin approval before the person joins.
              </div>
            )}

            {/* Search */}
            <div className="px-4 py-3">
              <div className="relative">
                <svg
                  className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2"
                  style={{ color: "var(--text-muted)" }}
                  fill="none" viewBox="0 0 24 24" stroke="currentColor"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                <input
                  ref={searchRef}
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search friends…"
                  className="w-full rounded-xl border py-2.5 pl-9 pr-4 text-sm outline-none focus:border-primary"
                  style={{
                    borderColor: "var(--border)",
                    background: "var(--surface-hover)",
                    color: "var(--text-primary)",
                  }}
                />
              </div>
            </div>

            {/* Friend list */}
            <div className="flex-1 overflow-y-auto">
              {filtered.length === 0 ? (
                <p className="px-4 py-8 text-center text-sm" style={{ color: "var(--text-muted)" }}>
                  {friends.length === 0 ? "All friends are already in this group" : "No results"}
                </p>
              ) : (
                filtered.map((f, i) => {
                  const isChecked = selected.has(f.id);
                  return (
                    <button
                      key={f.id}
                      type="button"
                      onClick={() => toggle(f.id)}
                      className={`flex w-full items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-[var(--surface-hover)] ${i > 0 ? "border-t" : ""}`}
                      style={{ borderColor: "var(--border)" }}
                    >
                      <div
                        className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 transition-colors ${isChecked ? "border-primary bg-primary" : ""}`}
                        style={!isChecked ? { borderColor: "var(--border)" } : undefined}
                      >
                        {isChecked && (
                          <svg className="h-3 w-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                          </svg>
                        )}
                      </div>
                      <div className="relative h-9 w-9 shrink-0 overflow-hidden rounded-full bg-primary/10">
                        {f.image ? (
                          <Image src={f.image} alt={f.name} fill sizes="36px" className="object-cover" />
                        ) : (
                          <span className="absolute inset-0 flex items-center justify-center text-xs font-bold text-primary">
                            {f.name.charAt(0).toUpperCase()}
                          </span>
                        )}
                      </div>
                      <div className="min-w-0">
                        <p className="truncate text-sm font-semibold" style={{ color: "var(--text-primary)" }}>{f.name}</p>
                        {f.username && (
                          <p className="text-xs" style={{ color: "var(--text-muted)" }}>@{f.username}</p>
                        )}
                      </div>
                    </button>
                  );
                })
              )}
            </div>

            {/* Footer */}
            <div className="flex items-center justify-between gap-3 border-t px-5 py-4" style={{ borderColor: "var(--border)" }}>
              <span className="text-xs" style={{ color: "var(--text-muted)" }}>
                {selected.size > 0 ? `${selected.size} selected` : "Select people to add"}
              </span>
              <button
                onClick={handleSubmit}
                disabled={selected.size === 0 || submitting}
                className="flex items-center gap-2 rounded-xl bg-primary px-5 py-2 text-sm font-semibold text-white transition hover:bg-primary/90 disabled:opacity-50"
              >
                {submitting ? "Sending…" : isAdmin ? "Add to Group" : "Send Invite"}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
