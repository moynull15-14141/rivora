"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";

type Friend = {
  id: string;
  name: string;
  username: string | null;
  image: string | null;
};

export default function CreateGroupModal({ onClose }: { onClose: () => void }) {
  const router = useRouter();
  const [groupName, setGroupName] = useState("");
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [friends, setFriends] = useState<Friend[]>([]);
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const avatarRef = useRef<HTMLInputElement>(null);

  // Fetch friends on mount
  useEffect(() => {
    fetch("/api/friends?status=accepted&limit=100")
      .then((r) => r.json())
      .then((data) => {
        const list = Array.isArray(data) ? data : (data.data ?? []);
        setFriends(list);
      })
      .catch(() => {});
  }, []);

  // Close on Escape
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [onClose]);

  const filtered = friends.filter(
    (f) =>
      f.name.toLowerCase().includes(search.toLowerCase()) ||
      (f.username ?? "").toLowerCase().includes(search.toLowerCase())
  );

  function toggleSelect(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function onAvatarChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setAvatarFile(file);
    setAvatarPreview(URL.createObjectURL(file));
    e.target.value = "";
  }

  async function handleCreate() {
    setError(null);
    if (!groupName.trim()) { setError("Group name is required"); return; }
    if (selected.size < 2) { setError("Select at least 2 members"); return; }

    setCreating(true);
    try {
      let avatarUrl: string | undefined;
      if (avatarFile) {
        const fd = new FormData();
        fd.append("file", avatarFile);
        fd.append("folder", "rivora/groups");
        const up = await fetch("/api/upload", { method: "POST", body: fd });
        const upJson = await up.json();
        if (upJson.success) avatarUrl = upJson.data.url;
      }

      const res = await fetch("/api/conversations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          isGroup: true,
          name: groupName.trim(),
          userIds: [...selected],
          avatar: avatarUrl,
        }),
      });
      const json = await res.json();
      if (!res.ok) { setError(json.error ?? "Failed to create group"); setCreating(false); return; }

      onClose();
      router.push(`/messages/${json.id}`);
    } catch {
      setError("Something went wrong");
      setCreating(false);
    }
  }

  const selectedFriends = friends.filter((f) => selected.has(f.id));

  return (
    <div className="fixed inset-0 z-[300] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />

      {/* Modal */}
      <div
        className="relative z-10 flex w-full max-w-md flex-col overflow-hidden rounded-2xl shadow-2xl"
        style={{ background: "var(--surface)", border: "1px solid var(--border)", maxHeight: "90dvh" }}
      >
        {/* Header */}
        <div
          className="flex items-center justify-between border-b px-5 py-4"
          style={{ borderColor: "var(--border)" }}
        >
          <h2 className="text-base font-bold" style={{ color: "var(--text-primary)" }}>
            Create Group Chat
          </h2>
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

        {/* Body (scrollable) */}
        <div className="flex-1 overflow-y-auto px-5 py-4">
          {/* Avatar + Group name row */}
          <div className="mb-4 flex items-center gap-3">
            <button
              type="button"
              onClick={() => avatarRef.current?.click()}
              className="relative flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-full bg-primary/10 transition hover:bg-primary/20"
            >
              {avatarPreview ? (
                <Image src={avatarPreview} alt="Group" fill sizes="56px" className="object-cover" />
              ) : (
                <svg className="h-6 w-6 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              )}
            </button>
            <input ref={avatarRef} type="file" accept="image/*" className="hidden" onChange={onAvatarChange} />
            <input
              type="text"
              value={groupName}
              onChange={(e) => setGroupName(e.target.value)}
              placeholder="Enter group name…"
              maxLength={50}
              className="flex-1 rounded-xl border px-4 py-2.5 text-sm outline-none focus:border-primary"
              style={{
                borderColor: "var(--border)",
                background: "var(--surface-hover)",
                color: "var(--text-primary)",
              }}
            />
          </div>

          {/* Member search */}
          <p className="mb-2 text-xs font-semibold uppercase tracking-wide" style={{ color: "var(--text-muted)" }}>
            Add Members
          </p>
          <div className="relative mb-3">
            <svg
              className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2"
              style={{ color: "var(--text-muted)" }}
              fill="none" viewBox="0 0 24 24" stroke="currentColor"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
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

          {/* Friend list */}
          <div className="max-h-52 overflow-y-auto rounded-xl" style={{ border: "1px solid var(--border)" }}>
            {filtered.length === 0 ? (
              <p className="px-4 py-6 text-center text-sm" style={{ color: "var(--text-muted)" }}>
                {friends.length === 0 ? "No friends yet" : "No results"}
              </p>
            ) : (
              filtered.map((f, i) => {
                const isChecked = selected.has(f.id);
                return (
                  <button
                    key={f.id}
                    type="button"
                    onClick={() => toggleSelect(f.id)}
                    className={`flex w-full items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-[var(--surface-hover)] ${
                      i > 0 ? "border-t" : ""
                    }`}
                    style={{ borderColor: "var(--border)" }}
                  >
                    {/* Checkbox */}
                    <div
                      className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 transition-colors ${
                        isChecked ? "border-primary bg-primary" : ""
                      }`}
                      style={!isChecked ? { borderColor: "var(--border)" } : undefined}
                    >
                      {isChecked && (
                        <svg className="h-3 w-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                        </svg>
                      )}
                    </div>
                    {/* Avatar */}
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
                      <p className="truncate text-sm font-medium" style={{ color: "var(--text-primary)" }}>
                        {f.name}
                      </p>
                      {f.username && (
                        <p className="text-xs" style={{ color: "var(--text-muted)" }}>
                          @{f.username}
                        </p>
                      )}
                    </div>
                  </button>
                );
              })
            )}
          </div>

          {/* Selected chips */}
          {selectedFriends.length > 0 && (
            <div className="mt-3">
              <p className="mb-1.5 text-xs" style={{ color: "var(--text-muted)" }}>
                Selected ({selectedFriends.length}):{" "}
                <span style={{ color: "var(--text-secondary)" }}>
                  {selectedFriends.map((f) => f.name).join(", ")}
                </span>
              </p>
            </div>
          )}

          {error && (
            <p className="mt-3 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-600 dark:border-red-800 dark:bg-red-900/20 dark:text-red-400">
              {error}
            </p>
          )}
        </div>

        {/* Footer */}
        <div
          className="flex items-center justify-end gap-3 border-t px-5 py-4"
          style={{ borderColor: "var(--border)" }}
        >
          <button
            onClick={onClose}
            className="rounded-xl px-5 py-2 text-sm font-medium transition-colors hover:bg-[var(--surface-hover)]"
            style={{ color: "var(--text-secondary)" }}
          >
            Cancel
          </button>
          <button
            onClick={handleCreate}
            disabled={creating || !groupName.trim() || selected.size < 2}
            className="flex items-center gap-2 rounded-xl bg-primary px-5 py-2 text-sm font-semibold text-white transition hover:bg-primary/90 disabled:opacity-50"
          >
            {creating ? "Creating…" : "Create Group"}
            {!creating && (
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
