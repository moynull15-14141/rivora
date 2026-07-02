"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";

type Props = {
  conversationId: string;
  currentName: string;
  currentAvatar: string | null;
  onClose: () => void;
  onSaved: (name: string, avatar: string | null) => void;
};

export default function EditGroupModal({
  conversationId,
  currentName,
  currentAvatar,
  onClose,
  onSaved,
}: Props) {
  const [name, setName] = useState(currentName);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(currentAvatar);
  const [avatarCleared, setAvatarCleared] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [onClose]);

  function onFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setAvatarFile(file);
    setAvatarPreview(URL.createObjectURL(file));
    setAvatarCleared(false);
    e.target.value = "";
  }

  function removeAvatar() {
    setAvatarFile(null);
    setAvatarPreview(null);
    setAvatarCleared(true);
  }

  async function handleSave() {
    setError(null);
    if (!name.trim()) { setError("Group name cannot be empty"); return; }
    setSaving(true);

    try {
      let avatarUrl: string | null | undefined;

      if (avatarFile) {
        const fd = new FormData();
        fd.append("file", avatarFile);
        fd.append("folder", "rivora/groups");
        const up = await fetch("/api/upload", { method: "POST", body: fd });
        const upJson = await up.json();
        if (!upJson.success) throw new Error(upJson.error ?? "Upload failed");
        avatarUrl = upJson.data.url as string;
      } else if (avatarCleared) {
        avatarUrl = null;
      }

      const body: Record<string, unknown> = { name: name.trim() };
      if (avatarUrl !== undefined) body.avatar = avatarUrl;

      const res = await fetch(`/api/conversations/${conversationId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const json = await res.json();
      if (res.status === 403) throw new Error("Only admins can edit the group");
      if (!res.ok) throw new Error(json.error ?? "Failed to save");

      onSaved(json.name ?? name.trim(), json.avatar ?? avatarUrl ?? null);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setSaving(false);
    }
  }

  const isDirty = name.trim() !== currentName || avatarFile !== null || avatarCleared;

  return (
    <div className="fixed inset-0 z-[300] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />

      <div
        className="relative z-10 w-full max-w-sm overflow-hidden rounded-2xl shadow-2xl"
        style={{ background: "var(--surface)", border: "1px solid var(--border)" }}
      >
        {/* Header */}
        <div
          className="flex items-center justify-between border-b px-5 py-4"
          style={{ borderColor: "var(--border)" }}
        >
          <h2 className="text-base font-bold" style={{ color: "var(--text-primary)" }}>
            Edit Group
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

        {/* Body */}
        <div className="px-5 py-5">
          {/* Avatar picker */}
          <div className="mb-5 flex flex-col items-center gap-3">
            <div className="relative">
              <button
                type="button"
                onClick={() => fileRef.current?.click()}
                className="relative flex h-20 w-20 items-center justify-center overflow-hidden rounded-full bg-primary/10 transition hover:bg-primary/20"
              >
                {avatarPreview ? (
                  <Image src={avatarPreview} alt="Group avatar" fill sizes="80px" className="object-cover" />
                ) : (
                  <svg className="h-8 w-8 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                )}
              </button>
              {/* Camera badge */}
              <button
                type="button"
                onClick={() => fileRef.current?.click()}
                className="absolute bottom-0 right-0 flex h-6 w-6 items-center justify-center rounded-full bg-primary text-white shadow"
              >
                <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </button>
            </div>
            <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={onFileChange} />
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => fileRef.current?.click()}
                className="text-xs font-semibold text-primary hover:underline"
              >
                Change photo
              </button>
              {avatarPreview && (
                <>
                  <span className="text-xs" style={{ color: "var(--text-muted)" }}>·</span>
                  <button
                    type="button"
                    onClick={removeAvatar}
                    className="text-xs font-semibold text-red-500 hover:underline"
                  >
                    Remove
                  </button>
                </>
              )}
            </div>
          </div>

          {/* Group name */}
          <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide" style={{ color: "var(--text-muted)" }}>
            Group Name
          </label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            maxLength={50}
            placeholder="Enter group name…"
            className="w-full rounded-xl border px-4 py-2.5 text-sm outline-none focus:border-primary"
            style={{
              borderColor: "var(--border)",
              background: "var(--surface-hover)",
              color: "var(--text-primary)",
            }}
          />
          <p className="mt-1 text-right text-xs" style={{ color: "var(--text-muted)" }}>
            {name.length}/50
          </p>

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
            onClick={handleSave}
            disabled={saving || !isDirty || !name.trim()}
            className="rounded-xl bg-primary px-5 py-2 text-sm font-semibold text-white transition hover:bg-primary/90 disabled:opacity-50"
          >
            {saving ? "Saving…" : "Save Changes"}
          </button>
        </div>
      </div>
    </div>
  );
}
