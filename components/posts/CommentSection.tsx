"use client";

import { useEffect, useRef, useState } from "react";
import Avatar from "@/components/ui/Avatar";

type CommentUser = {
  id: string;
  name: string;
  username: string | null;
  image: string | null;
};

type Reply = {
  id: string;
  content: string;
  createdAt: string | Date;
  user: CommentUser;
};

type Comment = {
  id: string;
  content: string;
  createdAt: string | Date;
  user: CommentUser;
  replies: Reply[];
};

function timeAgo(date: string | Date) {
  const sec = Math.floor((Date.now() - new Date(date).getTime()) / 1000);
  if (sec < 60) return "just now";
  if (sec < 3600) return `${Math.floor(sec / 60)}m`;
  if (sec < 86400) return `${Math.floor(sec / 3600)}h`;
  return `${Math.floor(sec / 86400)}d`;
}

function ReplyInput({
  currentUserImage,
  currentUserName,
  onSubmit,
  onCancel,
}: {
  currentUserImage: string | null;
  currentUserName: string;
  onSubmit: (content: string) => Promise<void>;
  onCancel: () => void;
}) {
  const [value, setValue] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => { inputRef.current?.focus(); }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!value.trim() || submitting) return;
    setSubmitting(true);
    await onSubmit(value.trim());
    setValue("");
    setSubmitting(false);
  }

  return (
    <form onSubmit={handleSubmit} className="mt-2 flex items-center gap-2">
      <Avatar src={currentUserImage} name={currentUserName} size="xs" />
      <div
        className="flex flex-1 items-center gap-2 rounded-2xl px-3 py-1.5"
        style={{ background: "var(--surface-hover)" }}
      >
        <input
          ref={inputRef}
          type="text"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder="Write a reply…"
          className="flex-1 bg-transparent text-sm outline-none placeholder:text-[var(--text-muted)]"
          style={{ color: "var(--text-primary)" }}
        />
        <button
          type="submit"
          disabled={!value.trim() || submitting}
          className="text-primary transition-opacity disabled:opacity-30"
        >
          <svg className="h-4 w-4 rotate-90" fill="currentColor" viewBox="0 0 24 24">
            <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z" />
          </svg>
        </button>
      </div>
      <button
        type="button"
        onClick={onCancel}
        className="text-xs hover:text-[var(--text-secondary)]"
        style={{ color: "var(--text-muted)" }}
      >
        Cancel
      </button>
    </form>
  );
}

export default function CommentSection({
  postId,
  initialCount,
  currentUserId,
  currentUserName,
  currentUserImage,
  defaultOpen = false,
}: {
  postId: string;
  initialCount: number;
  currentUserId: string;
  currentUserName: string;
  currentUserImage: string | null;
  defaultOpen?: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);
  const [comments, setComments] = useState<Comment[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [count, setCount] = useState(initialCount);
  const [input, setInput] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [replyingTo, setReplyingTo] = useState<string | null>(null);

  useEffect(() => {
    if (!defaultOpen) return;
    fetch(`/api/posts/${postId}/comments`)
      .then((r) => r.json())
      .then((json) => {
        if (json.success) { setComments(json.data); setLoaded(true); }
      })
      .catch(() => {});
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function handleToggle() {
    if (open) { setOpen(false); return; }
    if (!loaded) {
      const res = await fetch(`/api/posts/${postId}/comments`);
      const json = await res.json();
      if (json.success) { setComments(json.data); setLoaded(true); }
    }
    setOpen(true);
  }

  async function submitComment(e: React.FormEvent) {
    e.preventDefault();
    if (!input.trim() || submitting) return;
    setSubmitting(true);
    const res = await fetch("/api/comments", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ postId, content: input.trim() }),
    });
    const json = await res.json();
    if (json.success) {
      setComments((prev) => [...prev, { ...json.data, replies: [] }]);
      setCount((c) => c + 1);
      setInput("");
    }
    setSubmitting(false);
  }

  async function submitReply(parentId: string, content: string) {
    const res = await fetch("/api/comments", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ postId, content, parentId }),
    });
    const json = await res.json();
    if (json.success) {
      setComments((prev) =>
        prev.map((c) =>
          c.id === parentId
            ? { ...c, replies: [...c.replies, json.data] }
            : c
        )
      );
      setCount((c) => c + 1);
      setReplyingTo(null);
    }
  }

  async function deleteComment(commentId: string) {
    const res = await fetch(`/api/comments/${commentId}`, { method: "DELETE" });
    if (res.ok) {
      setComments((prev) => prev.filter((c) => c.id !== commentId));
      setCount((c) => Math.max(0, c - 1));
    }
  }

  async function deleteReply(parentId: string, replyId: string) {
    const res = await fetch(`/api/comments/${replyId}`, { method: "DELETE" });
    if (res.ok) {
      setComments((prev) =>
        prev.map((c) =>
          c.id === parentId
            ? { ...c, replies: c.replies.filter((r) => r.id !== replyId) }
            : c
        )
      );
      setCount((c) => Math.max(0, c - 1));
    }
  }

  return (
    <div className="flex-1">
      <button
        onClick={handleToggle}
        className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium transition-colors hover:bg-[var(--surface-hover)]"
        style={{ color: "var(--text-secondary)" }}
      >
        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
        </svg>
        <span>{count > 0 ? count : ""}</span>
        <span className="hidden sm:inline">Comment{count !== 1 ? "s" : ""}</span>
      </button>

      {open && (
        <div
          className="mt-3 border-t pt-3"
          style={{ borderColor: "var(--border)" }}
        >
          {/* New comment form */}
          <form onSubmit={submitComment} className="mb-4 flex items-center gap-2">
            <Avatar src={currentUserImage} name={currentUserName} size="sm" />
            <div
              className="flex flex-1 items-center gap-2 rounded-2xl px-4 py-2"
              style={{ background: "var(--surface-hover)" }}
            >
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Write a comment…"
                className="flex-1 bg-transparent text-sm outline-none placeholder:text-[var(--text-muted)]"
                style={{ color: "var(--text-primary)" }}
              />
              <button
                type="submit"
                disabled={!input.trim() || submitting}
                className="text-primary transition-opacity disabled:opacity-30"
              >
                <svg className="h-4 w-4 rotate-90" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z" />
                </svg>
              </button>
            </div>
          </form>

          {comments.length === 0 ? (
            <p className="py-2 text-center text-xs" style={{ color: "var(--text-muted)" }}>
              No comments yet. Be the first!
            </p>
          ) : (
            <div className="flex flex-col gap-4">
              {comments.map((c) => (
                <div key={c.id}>
                  {/* Top-level comment */}
                  <div className="flex items-start gap-2">
                    <Avatar src={c.user.image} name={c.user.name} size="sm" />
                    <div className="flex-1 min-w-0">
                      <div
                        className="inline-block max-w-full rounded-2xl px-3 py-2"
                        style={{ background: "var(--surface-hover)" }}
                      >
                        <p className="text-xs font-semibold" style={{ color: "var(--text-primary)" }}>
                          {c.user.name}
                        </p>
                        <p className="mt-0.5 break-words text-sm" style={{ color: "var(--text-secondary)" }}>
                          {c.content}
                        </p>
                      </div>
                      {/* Comment meta */}
                      <div className="mt-1 flex items-center gap-3 pl-1">
                        <span className="text-xs" style={{ color: "var(--text-muted)" }}>
                          {timeAgo(c.createdAt)}
                        </span>
                        <button
                          onClick={() => setReplyingTo(replyingTo === c.id ? null : c.id)}
                          className="text-xs font-semibold hover:text-primary"
                          style={{ color: "var(--text-secondary)" }}
                        >
                          Reply
                        </button>
                        {c.user.id === currentUserId && (
                          <button
                            onClick={() => deleteComment(c.id)}
                            className="text-xs font-semibold hover:text-rose-400"
                            style={{ color: "var(--text-muted)" }}
                          >
                            Delete
                          </button>
                        )}
                      </div>

                      {/* Replies */}
                      {(c.replies.length > 0 || replyingTo === c.id) && (
                        <div
                          className="mt-2 ml-2 border-l-2 pl-3 flex flex-col gap-3"
                          style={{ borderColor: "var(--border)" }}
                        >
                          {c.replies.map((r) => (
                            <div key={r.id} className="flex items-start gap-2">
                              <Avatar src={r.user.image} name={r.user.name} size="xs" />
                              <div className="flex-1 min-w-0">
                                <div
                                  className="inline-block max-w-full rounded-2xl px-3 py-1.5"
                                  style={{ background: "var(--surface-hover)" }}
                                >
                                  <p className="text-xs font-semibold" style={{ color: "var(--text-primary)" }}>
                                    {r.user.name}
                                  </p>
                                  <p className="mt-0.5 break-words text-sm" style={{ color: "var(--text-secondary)" }}>
                                    {r.content}
                                  </p>
                                </div>
                                <div className="mt-0.5 flex items-center gap-3 pl-1">
                                  <span className="text-xs" style={{ color: "var(--text-muted)" }}>
                                    {timeAgo(r.createdAt)}
                                  </span>
                                  {r.user.id === currentUserId && (
                                    <button
                                      onClick={() => deleteReply(c.id, r.id)}
                                      className="text-xs font-semibold hover:text-rose-400"
                                      style={{ color: "var(--text-muted)" }}
                                    >
                                      Delete
                                    </button>
                                  )}
                                </div>
                              </div>
                            </div>
                          ))}

                          {replyingTo === c.id && (
                            <ReplyInput
                              currentUserImage={currentUserImage}
                              currentUserName={currentUserName}
                              onSubmit={(content) => submitReply(c.id, content)}
                              onCancel={() => setReplyingTo(null)}
                            />
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
