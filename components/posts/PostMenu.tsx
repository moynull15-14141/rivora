"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import EditPostModal from "./EditPostModal";

type Visibility = "public" | "friends" | "only_me";

type PostMenuProps = {
  post: { id: string; content: string; visibility: Visibility };
};

export default function PostMenu({ post }: PostMenuProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [showEdit, setShowEdit] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onClickOutside(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    if (open) document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, [open]);

  async function handleDelete() {
    if (!confirm("Delete this post? This cannot be undone.")) return;
    setDeleting(true);
    await fetch(`/api/posts/${post.id}`, { method: "DELETE" });
    setOpen(false);
    router.refresh();
  }

  return (
    <div className="relative" ref={menuRef}>
      <button
        onClick={() => setOpen((o) => !o)}
        className="rounded-lg p-1.5 transition-colors hover:bg-[var(--surface-hover)]"
        style={{ color: "var(--text-muted)" }}
        aria-label="Post options"
      >
        <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
          <circle cx="10" cy="4" r="1.5" />
          <circle cx="10" cy="10" r="1.5" />
          <circle cx="10" cy="16" r="1.5" />
        </svg>
      </button>

      {open && (
        <div
          className="absolute right-0 top-9 z-20 w-36 overflow-hidden rounded-xl border shadow-lg"
          style={{ background: "var(--surface)", borderColor: "var(--border)" }}
        >
          <button
            onClick={() => { setShowEdit(true); setOpen(false); }}
            className="flex w-full items-center gap-2 px-4 py-2.5 text-sm transition-colors hover:bg-[var(--surface-hover)]"
            style={{ color: "var(--text-secondary)" }}
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
            Edit
          </button>
          <button
            onClick={handleDelete}
            disabled={deleting}
            className="flex w-full items-center gap-2 px-4 py-2.5 text-sm text-rose-500 hover:bg-rose-50 disabled:opacity-60"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
            {deleting ? "Deleting…" : "Delete"}
          </button>
        </div>
      )}

      {showEdit && (
        <EditPostModal post={post} onClose={() => setShowEdit(false)} />
      )}
    </div>
  );
}
