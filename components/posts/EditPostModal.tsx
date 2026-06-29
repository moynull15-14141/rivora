"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type Visibility = "public" | "friends" | "only_me";

export default function EditPostModal({
  post,
  onClose,
}: {
  post: { id: string; content: string; visibility: Visibility };
  onClose: () => void;
}) {
  const router = useRouter();
  const [content, setContent] = useState(post.content);
  const [visibility, setVisibility] = useState<Visibility>(post.visibility);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!content.trim()) return;
    setLoading(true);
    setError(null);

    const res = await fetch(`/api/posts/${post.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ content: content.trim(), visibility }),
    });
    const json = await res.json();

    if (!res.ok || !json.success) {
      setError(json.error ?? "Failed to update. Try again.");
      setLoading(false);
      return;
    }

    onClose();
    router.refresh();
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div
        className="w-full max-w-lg rounded-2xl shadow-xl"
        style={{ background: "var(--surface)", border: "1px solid var(--border)" }}
      >
        <div
          className="flex items-center justify-between border-b px-6 py-4"
          style={{ borderColor: "var(--border)" }}
        >
          <h2 className="font-heading text-base font-semibold" style={{ color: "var(--text-primary)" }}>
            Edit Post
          </h2>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 transition-colors hover:bg-[var(--surface-hover)]"
            style={{ color: "var(--text-muted)" }}
          >
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4 p-6">
          <textarea
            rows={4}
            value={content}
            onChange={(e) => setContent(e.target.value)}
            className="w-full resize-none rounded-xl border px-4 py-3 text-sm outline-none transition placeholder:text-[var(--text-muted)] focus:border-primary focus:ring-2 focus:ring-primary/20"
            style={{
              borderColor: "var(--border)",
              background: "var(--surface-hover)",
              color: "var(--text-primary)",
            }}
          />

          <select
            value={visibility}
            onChange={(e) => setVisibility(e.target.value as Visibility)}
            className="w-full rounded-xl border px-4 py-2.5 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
            style={{
              borderColor: "var(--border)",
              background: "var(--surface-hover)",
              color: "var(--text-primary)",
            }}
          >
            <option value="public">🌐 Public</option>
            <option value="friends">👥 Friends</option>
            <option value="only_me">🔒 Only me</option>
          </select>

          {error && (
            <p className="rounded-lg border border-accent/30 bg-accent/5 px-4 py-2 text-sm text-accent">
              {error}
            </p>
          )}

          <div className="flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 rounded-xl border py-2.5 text-sm font-semibold transition-colors hover:bg-[var(--surface-hover)]"
              style={{ borderColor: "var(--border)", color: "var(--text-secondary)" }}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || !content.trim()}
              className="flex-1 rounded-xl bg-primary py-2.5 text-sm font-semibold text-white hover:bg-primary/90 disabled:opacity-60"
            >
              {loading ? "Saving…" : "Save"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
