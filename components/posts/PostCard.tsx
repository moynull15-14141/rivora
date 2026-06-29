"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import Avatar from "@/components/ui/Avatar";
import Lightbox from "@/components/ui/Lightbox";
import LikeButton from "./LikeButton";
import CommentSection from "./CommentSection";
import PostMenu from "./PostMenu";
import { isOnline } from "@/utils/online";

type PostUser = {
  id: string;
  name: string;
  username: string | null;
  image: string | null;
  lastSeen: Date | string | null;
};

export type PostData = {
  id: string;
  content: string;
  images: string[];
  visibility: "public" | "friends" | "only_me";
  createdAt: Date | string;
  editedAt: Date | string | null;
  user: PostUser;
  _count: { likes: number; comments: number };
  likes: { id: string }[];
};

function timeAgo(date: Date | string) {
  const now = new Date();
  const d = new Date(date);
  const sec = Math.floor((now.getTime() - d.getTime()) / 1000);
  if (sec < 60) return "just now";
  if (sec < 3600) return `${Math.floor(sec / 60)}m`;
  if (sec < 86400) return `${Math.floor(sec / 3600)}h`;
  if (sec < 604800) return `${Math.floor(sec / 86400)}d`;
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

const visibilityLabel: Record<string, string> = {
  public: "🌐",
  friends: "👥",
  only_me: "🔒",
};

export default function PostCard({
  post,
  currentUserId,
  currentUserName,
  currentUserImage,
  expandComments = false,
  priority = false,
}: {
  post: PostData;
  currentUserId: string;
  currentUserName: string;
  currentUserImage: string | null;
  expandComments?: boolean;
  priority?: boolean;
}) {
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);
  const isOwn = post.user.id === currentUserId;
  const initialLikeId = post.likes[0]?.id ?? null;
  const profileHref = `/${post.user.username ?? post.user.id}`;

  return (
    <div
      className="overflow-hidden rounded-2xl shadow-sm"
      style={{ background: "var(--surface)", border: "1px solid var(--border)" }}
    >
      {/* Header */}
      <div className="flex items-start justify-between px-5 pt-4 pb-1">
        <div className="flex items-start gap-3">
          <Link href={profileHref}>
            <Avatar
              src={post.user.image}
              name={post.user.name}
              size="md"
              isOnline={isOnline(post.user.lastSeen)}
            />
          </Link>
          <div>
            <Link
              href={profileHref}
              className="text-sm font-semibold hover:underline"
              style={{ color: "var(--text-primary)" }}
            >
              {post.user.name}
            </Link>
            <div className="flex items-center gap-1 text-xs" style={{ color: "var(--text-muted)" }}>
              <span>{timeAgo(post.createdAt)}</span>
              {post.editedAt && <span>· edited</span>}
              <span>· {visibilityLabel[post.visibility] ?? "🌐"}</span>
            </div>
          </div>
        </div>

        {isOwn && (
          <PostMenu
            post={{
              id: post.id,
              content: post.content,
              visibility: post.visibility,
            }}
          />
        )}
      </div>

      {/* Content */}
      <div className="px-5 py-3">
        <p
          className="whitespace-pre-wrap text-sm leading-relaxed"
          style={{ color: "var(--text-primary)" }}
        >
          {post.content}
        </p>
      </div>

      {/* Images */}
      {post.images.length > 0 && (
        <div
          className={`grid gap-0.5 ${
            post.images.length === 1 ? "grid-cols-1" : "grid-cols-2"
          }`}
        >
          {post.images.slice(0, 4).map((img, i) => (
            <button
              key={i}
              type="button"
              onClick={() => setLightboxIndex(i)}
              className={`relative overflow-hidden bg-[var(--surface-hover)] ${
                post.images.length === 1
                  ? "aspect-video"
                  : post.images.length === 3 && i === 0
                  ? "col-span-2 aspect-video"
                  : "aspect-square"
              }`}
            >
              <Image
                src={img}
                alt=""
                fill
                sizes="(max-width: 640px) 100vw, 600px"
                className="object-cover transition-transform duration-200 hover:scale-105"
                priority={priority && i === 0}
              />
              {post.images.length > 4 && i === 3 && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/50">
                  <span className="text-2xl font-bold text-white">
                    +{post.images.length - 4}
                  </span>
                </div>
              )}
            </button>
          ))}
        </div>
      )}

      {/* Lightbox */}
      {lightboxIndex !== null && (
        <Lightbox
          images={post.images}
          index={lightboxIndex}
          onClose={() => setLightboxIndex(null)}
          onChange={setLightboxIndex}
        />
      )}

      {/* Actions */}
      <div
        className="flex items-center gap-1 border-t px-4 py-2"
        style={{ borderColor: "var(--border)" }}
      >
        <LikeButton
          postId={post.id}
          initialCount={post._count.likes}
          initialLikeId={initialLikeId}
        />
        <CommentSection
          postId={post.id}
          initialCount={post._count.comments}
          currentUserId={currentUserId}
          currentUserName={currentUserName}
          currentUserImage={currentUserImage}
          defaultOpen={expandComments}
        />
      </div>
    </div>
  );
}
