"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import Link from "next/link";
import PostCard, { PostData } from "./PostCard";

interface Props {
  initialPosts: PostData[];
  initialCursor: string | null;
  currentUserId: string;
  currentUserName: string;
  currentUserImage: string | null;
}

export default function PostFeed({
  initialPosts,
  initialCursor,
  currentUserId,
  currentUserName,
  currentUserImage,
}: Props) {
  const [posts, setPosts] = useState<PostData[]>(initialPosts);
  const [cursor, setCursor] = useState<string | null>(initialCursor);
  const [loading, setLoading] = useState(false);
  const sentinelRef = useRef<HTMLDivElement>(null);

  const loadMore = useCallback(async () => {
    if (loading || cursor === null) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/posts${cursor ? `?cursor=${cursor}` : ""}`);
      const json = await res.json();
      const { posts: next, nextCursor } = json.data as {
        posts: PostData[];
        nextCursor: string | null;
      };
      setPosts((prev) => [...prev, ...next]);
      setCursor(nextCursor);
    } catch {
      // silently fail — user can scroll up and back down to retry
    } finally {
      setLoading(false);
    }
  }, [cursor, loading]);

  useEffect(() => {
    const el = sentinelRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) loadMore();
      },
      { rootMargin: "200px" }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [loadMore]);

  if (posts.length === 0) {
    return (
      <div
        className="rounded-2xl px-6 py-12 text-center shadow-sm"
        style={{ background: "var(--surface)", border: "1px solid var(--border)" }}
      >
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
          <svg className="h-8 w-8 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
        </div>
        <h2 className="font-heading text-lg font-bold" style={{ color: "var(--text-primary)" }}>
          Your feed is empty
        </h2>
        <p className="mt-1.5 text-sm" style={{ color: "var(--text-muted)" }}>
          Add friends to see their posts, or share something yourself.
        </p>
        <div className="mt-6 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
          <Link
            href="/search"
            className="flex items-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-sm font-semibold text-white transition-opacity hover:opacity-90"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            Find Friends
          </Link>
          <Link
            href="/friends"
            className="flex items-center gap-2 rounded-xl border px-5 py-2.5 text-sm font-semibold transition-colors hover:bg-[var(--surface-hover)]"
            style={{ borderColor: "var(--border)", color: "var(--text-secondary)" }}
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Friend Requests
          </Link>
        </div>
      </div>
    );
  }

  return (
    <>
      {posts.map((post, i) => (
        <PostCard
          key={post.id}
          post={post}
          currentUserId={currentUserId}
          currentUserName={currentUserName}
          currentUserImage={currentUserImage}
          priority={i === 0}
        />
      ))}

      {/* Sentinel + loading indicator */}
      <div ref={sentinelRef} className="flex justify-center py-4">
        {loading && (
          <div className="flex items-center gap-2 text-sm" style={{ color: "var(--text-muted)" }}>
            <svg className="h-4 w-4 animate-spin" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
            </svg>
            Loading more posts…
          </div>
        )}
        {!loading && cursor === null && posts.length > 0 && (
          <p className="text-xs" style={{ color: "var(--text-muted)" }}>You&apos;re all caught up</p>
        )}
      </div>
    </>
  );
}
