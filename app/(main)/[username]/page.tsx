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
    select: { name: true, bio: true, isPrivate: true },
  });
  if (!user) return {};
  return {
    title: `${user.name} (@${username}) — Rivora`,
    description: user.isPrivate
      ? `${user.name}'s profile on Rivora`
      : (user.bio ?? `${user.name}'s profile on Rivora`),
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
        isPrivate: true,
        createdAt: true,
        lastSeen: true,
        _count: { select: { posts: true } },
      },
    }),
    getCurrentUser(),
  ]);

  if (!profileUser) notFound();

  const isOwnProfile = currentUser?.id === profileUser.id;

  // Phase 2: friendship (needed to determine visibility)
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

  // Phase 3: can this viewer see the full profile?
  const canView = !profileUser.isPrivate || isOwnProfile || isFriend;

  // Phase 4: fetch counts + posts only when visible
  const [friendCount, visiblePostCount, posts] = await Promise.all([
    canView
      ? db.friend.count({
          where: {
            status: "accepted",
            OR: [{ userId: profileUser.id }, { friendId: profileUser.id }],
          },
        })
      : Promise.resolve(0),
    canView
      ? db.post.count({
          where: {
            userId: profileUser.id,
            ...(isOwnProfile
              ? {}
              : isFriend
              ? { visibility: { in: ["public", "friends"] as const } }
              : { visibility: "public" as const }),
          },
        })
      : Promise.resolve(0),
    canView
      ? db.post.findMany({
          where: {
            userId: profileUser.id,
            ...(isOwnProfile
              ? {}
              : isFriend
              ? { visibility: { in: ["public", "friends"] as const } }
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
        })
      : Promise.resolve([]),
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
          canView={canView}
        />

        {/* Private wall — shown to non-friends of a private account */}
        {!canView && (
          <div
            className="rounded-2xl p-10 text-center shadow-sm"
            style={{ background: "var(--surface)", border: "1px solid var(--border)" }}
          >
            <div
              className="mx-auto mb-5 flex h-20 w-20 items-center justify-center rounded-full"
              style={{ background: "var(--surface-hover)", border: "2px solid var(--border)" }}
            >
              <svg
                className="h-9 w-9"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={1.5}
                style={{ color: "var(--text-muted)" }}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z"
                />
              </svg>
            </div>
            <h2
              className="font-heading text-lg font-bold"
              style={{ color: "var(--text-primary)" }}
            >
              This Account is Private
            </h2>
            <p
              className="mt-2 max-w-xs mx-auto text-sm leading-relaxed"
              style={{ color: "var(--text-secondary)" }}
            >
              Send a friend request to see{" "}
              <span className="font-semibold" style={{ color: "var(--text-primary)" }}>
                {profileUser.name}
              </span>
              {"'s"} posts and photos.
            </p>
          </div>
        )}

        {/* Posts — shown only when canView */}
        {canView && (
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
        )}
      </div>
    </div>
  );
}
