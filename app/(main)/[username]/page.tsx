import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/session";
import ProfileHeader from "@/components/profile/ProfileHeader";
import PostCard from "@/components/posts/PostCard";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ username: string }>;
}) {
  const { username } = await params;
  const user = await db.user.findFirst({
    where: { OR: [{ username }, { id: username }] },
    select: { name: true, bio: true },
  });
  if (!user) return {};
  return {
    title: `${user.name} (@${username}) — Rivora`,
    description: user.bio ?? `${user.name}'s profile on Rivora`,
  };
}

export default async function ProfilePage({
  params,
}: {
  params: Promise<{ username: string }>;
}) {
  const { username } = await params;

  // Phase 1: identify users
  const [profileUser, currentUser] = await Promise.all([
    db.user.findFirst({
      where: { OR: [{ username }, { id: username }] },
      select: {
        id: true,
        name: true,
        username: true,
        bio: true,
        image: true,
        coverPhoto: true,
        createdAt: true,
        lastSeen: true,
        _count: { select: { posts: true } },
      },
    }),
    getCurrentUser(),
  ]);

  if (!profileUser) notFound();

  const isOwnProfile = currentUser?.id === profileUser.id;

  // Phase 2: friendship (needed before we can determine post visibility)
  const friendship =
    currentUser && !isOwnProfile
      ? await db.friend.findFirst({
          where: {
            OR: [
              { userId: currentUser.id, friendId: profileUser.id },
              { userId: profileUser.id, friendId: currentUser.id },
            ],
          },
          select: { id: true, status: true, requestedBy: true },
        })
      : null;

  const isFriend = friendship?.status === "accepted";

  // Phase 3: friend count + visible post count + posts (all in parallel)
  const [friendCount, visiblePostCount, posts] = await Promise.all([
    db.friend.count({
      where: {
        status: "accepted",
        OR: [{ userId: profileUser.id }, { friendId: profileUser.id }],
      },
    }),
    db.post.count({
      where: {
        userId: profileUser.id,
        ...(isOwnProfile
          ? {}
          : isFriend
          ? { visibility: { in: ["public", "friends"] as ("public" | "friends" | "only_me")[] } }
          : { visibility: "public" as const }),
      },
    }),
    db.post.findMany({
      where: {
        userId: profileUser.id,
        ...(isOwnProfile
          ? {}
          : isFriend
          ? { visibility: { in: ["public", "friends"] as ("public" | "friends" | "only_me")[] } }
          : { visibility: "public" as const }),
      },
      select: {
        id: true,
        content: true,
        images: true,
        visibility: true,
        createdAt: true,
        editedAt: true,
        user: { select: { id: true, name: true, username: true, image: true, lastSeen: true } },
        _count: { select: { likes: true, comments: true } },
        likes: {
          where: { userId: currentUser?.id ?? "none" },
          select: { id: true },
        },
      },
      orderBy: { createdAt: "desc" },
      take: 20,
    }),
  ]);

  return (
    <div className="mx-auto max-w-5xl px-4 py-6 sm:px-6">
      <div className="flex flex-col gap-4">
        <ProfileHeader
          user={{ ...profileUser, _count: { posts: visiblePostCount } }}
          isOwnProfile={isOwnProfile}
          friendCount={friendCount}
          friendship={friendship ?? null}
          currentUserId={currentUser?.id ?? null}
        />

        {/* Posts */}
        <div className="flex flex-col gap-4">
          {posts.length === 0 ? (
            <div
              className="rounded-2xl p-8 text-center shadow-sm"
              style={{ background: "var(--surface)", border: "1px solid var(--border)" }}
            >
              <p className="text-sm" style={{ color: "var(--text-muted)" }}>
                {isOwnProfile
                  ? "You haven't posted anything yet."
                  : `${profileUser.name} hasn't posted anything yet.`}
              </p>
            </div>
          ) : (
            posts.map((post, i) =>
              currentUser ? (
                <PostCard
                  key={post.id}
                  post={{
                    ...post,
                    visibility: post.visibility as "public" | "friends" | "only_me",
                  }}
                  currentUserId={currentUser.id}
                  currentUserName={currentUser.name}
                  currentUserImage={currentUser.image ?? null}
                  priority={i === 0}
                />
              ) : null
            )
          )}
        </div>
      </div>
    </div>
  );
}
