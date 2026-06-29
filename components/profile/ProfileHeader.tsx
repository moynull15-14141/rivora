"use client";

import { useState } from "react";
import Image from "next/image";
import Avatar from "@/components/ui/Avatar";
import Lightbox from "@/components/ui/Lightbox";
import EditProfileButton from "./EditProfileButton";
import FriendButton from "./FriendButton";
import MessageButton from "./MessageButton";
import { isOnline } from "@/utils/online";

type Friendship = {
  id: string;
  status: string;
  requestedBy: string;
} | null;

type ProfileUser = {
  id: string;
  name: string;
  username: string | null;
  bio: string | null;
  image: string | null;
  coverPhoto: string | null;
  createdAt: Date;
  lastSeen: Date | null;
  _count: { posts: number };
};

export default function ProfileHeader({
  user,
  isOwnProfile,
  friendCount,
  friendship,
  currentUserId,
}: {
  user: ProfileUser;
  isOwnProfile: boolean;
  friendCount: number;
  friendship: Friendship;
  currentUserId: string | null;
}) {
  const [lightboxSrc, setLightboxSrc] = useState<string | null>(null);

  const joinMonth = new Date(user.createdAt).toLocaleString("default", {
    month: "long",
    year: "numeric",
  });

  return (
    <>
    <div
      className="overflow-hidden rounded-2xl shadow-sm"
      style={{ background: "var(--surface)", border: "1px solid var(--border)" }}
    >
      {/* Cover photo */}
      <div className="relative h-48 w-full bg-gradient-to-br from-primary via-teal-500 to-teal-700 sm:h-56">
        {user.coverPhoto && (
          <button
            type="button"
            onClick={() => setLightboxSrc(user.coverPhoto!)}
            className="absolute inset-0 h-full w-full"
            aria-label="View cover photo"
          >
            <Image
              src={user.coverPhoto}
              alt="Cover photo"
              fill
              className="object-cover transition-opacity hover:opacity-90"
              priority
            />
          </button>
        )}
      </div>

      {/* Info section */}
      <div className="px-5 pb-5 sm:px-6 sm:pb-6">
        {/* Avatar + action button */}
        <div className="flex items-end justify-between">
          <div className="-mt-12 shrink-0 rounded-full ring-4 ring-[var(--surface)]">
            {user.image ? (
              <button
                type="button"
                onClick={() => setLightboxSrc(user.image!)}
                className="block rounded-full"
                aria-label="View profile photo"
              >
                <Avatar src={user.image} name={user.name} size="xl" isOnline={isOnline(user.lastSeen)} />
              </button>
            ) : (
              <Avatar src={null} name={user.name} size="xl" isOnline={isOnline(user.lastSeen)} />
            )}
          </div>

          <div className="pt-3">
            {isOwnProfile ? (
              <EditProfileButton
                user={{
                  id: user.id,
                  name: user.name,
                  username: user.username,
                  bio: user.bio,
                  image: user.image,
                  coverPhoto: user.coverPhoto,
                }}
              />
            ) : currentUserId ? (
              <div className="flex items-center gap-2">
                {friendship?.status === "accepted" && (
                  <MessageButton userId={user.id} />
                )}
                <FriendButton
                  profileUserId={user.id}
                  currentUserId={currentUserId}
                  initialFriendship={friendship}
                />
              </div>
            ) : null}
          </div>
        </div>

        {/* Name & username */}
        <div className="mt-3">
          <h1
            className="font-heading text-xl font-bold sm:text-2xl"
            style={{ color: "var(--text-primary)" }}
          >
            {user.name}
          </h1>
          {user.username && (
            <p className="mt-0.5 text-sm" style={{ color: "var(--text-secondary)" }}>
              @{user.username}
            </p>
          )}
        </div>

        {/* Bio */}
        {user.bio && (
          <p className="mt-2 text-sm leading-relaxed" style={{ color: "var(--text-secondary)" }}>
            {user.bio}
          </p>
        )}

        {/* Joined date */}
        <div className="mt-2 flex items-center gap-1.5 text-xs" style={{ color: "var(--text-muted)" }}>
          <svg className="h-3.5 w-3.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
          Joined {joinMonth}
        </div>

        {/* Stats */}
        <div
          className="mt-4 flex gap-6 border-t pt-4"
          style={{ borderColor: "var(--border)" }}
        >
          <div>
            <span className="font-heading text-base font-bold" style={{ color: "var(--text-primary)" }}>
              {user._count.posts}
            </span>
            <span className="ml-1.5 text-sm" style={{ color: "var(--text-secondary)" }}>Posts</span>
          </div>
          <div>
            <span className="font-heading text-base font-bold" style={{ color: "var(--text-primary)" }}>
              {friendCount}
            </span>
            <span className="ml-1.5 text-sm" style={{ color: "var(--text-secondary)" }}>Friends</span>
          </div>
        </div>
      </div>
    </div>

    {lightboxSrc && (
      <Lightbox
        images={[lightboxSrc]}
        index={0}
        onClose={() => setLightboxSrc(null)}
        onChange={() => {}}
      />
    )}
    </>
  );
}
