import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/session";
import { db } from "@/lib/db";
import CreatePost from "@/components/posts/CreatePost";
import PostFeed from "@/components/posts/PostFeed";
import RightSidebar from "@/components/layout/RightSidebar";
import StoryBar from "@/components/story/StoryBar";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const dbc = db as any;

export default async function HomePage() {
  const currentUser = await getCurrentUser();
  if (!currentUser) redirect("/login");

  const friendships = await db.friend.findMany({
    where: {
      status: "accepted",
      OR: [{ userId: currentUser.id }, { friendId: currentUser.id }],
    },
    select: { userId: true, friendId: true },
  });

  const friendIds = friendships.map((f) =>
    f.userId === currentUser.id ? f.friendId : f.userId
  );

  const PAGE_SIZE = 10;

  const rawPosts = await db.post.findMany({
    where: {
      OR: [
        { visibility: "public" },
        { userId: currentUser.id },
        { userId: { in: friendIds }, visibility: "friends" },
      ],
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
      likes: { where: { userId: currentUser.id }, select: { id: true } },
    },
    orderBy: { createdAt: "desc" },
    take: PAGE_SIZE + 1,
  });

  // Active stories (self + friends), grouped by user
  const now = new Date();
  const rawStories = await dbc.story.findMany({
    where: {
      expiresAt: { gt: now },
      userId: { in: [currentUser.id, ...friendIds] },
    },
    include: {
      user: { select: { id: true, name: true, username: true, image: true } },
      views: { where: { viewerId: currentUser.id }, select: { id: true } },
    },
    orderBy: { createdAt: "asc" },
  });

  // Group stories by userId
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const storyMap = new Map<string, any>();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  for (const s of rawStories as any[]) {
    const uid = s.userId as string;
    if (!storyMap.has(uid)) {
      storyMap.set(uid, { user: s.user, stories: [], hasUnseen: false });
    }
    const g = storyMap.get(uid);
    const seen = s.views.length > 0;
    if (!seen) g.hasUnseen = true;
    g.stories.push({
      id: s.id, mediaUrl: s.mediaUrl, mediaType: s.mediaType,
      caption: s.caption, backgroundColor: s.backgroundColor,
      viewCount: s.viewCount, seen,
      createdAt: s.createdAt.toISOString(),
      expiresAt: s.expiresAt.toISOString(),
    });
  }
  const storyGroups = Array.from(storyMap.values()).sort((a, b) => {
    if (a.user.id === currentUser.id) return -1;
    if (b.user.id === currentUser.id) return 1;
    if (a.hasUnseen && !b.hasUnseen) return -1;
    if (!a.hasUnseen && b.hasUnseen) return 1;
    return 0;
  });

  // Friend suggestions: users with no Friend record with current user (either direction)
  const suggestions = await db.user.findMany({
    where: {
      id: { not: currentUser.id },
      sentRequests: { none: { friendId: currentUser.id } },
      receivedRequests: { none: { userId: currentUser.id } },
    },
    select: { id: true, name: true, username: true, image: true },
    take: 20,
    orderBy: { createdAt: "desc" },
  });

  const hasMore = rawPosts.length > PAGE_SIZE;
  const posts = hasMore ? rawPosts.slice(0, PAGE_SIZE) : rawPosts;
  const initialCursor = hasMore ? posts[posts.length - 1].id : null;

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_200px]">
      {/* Feed */}
      <main className="flex min-w-0 flex-col gap-4">
        <StoryBar
          currentUser={{ id: currentUser.id, name: currentUser.name, image: currentUser.image ?? null }}
          groups={storyGroups}
        />
        <CreatePost userName={currentUser.name} userImage={currentUser.image ?? null} />

        <PostFeed
          initialPosts={posts.map((p) => ({
            ...p,
            visibility: p.visibility as "public" | "friends" | "only_me",
          }))}
          initialCursor={initialCursor}
          currentUserId={currentUser.id}
          currentUserName={currentUser.name}
          currentUserImage={currentUser.image ?? null}
        />
      </main>

      {/* Right sidebar */}
      {suggestions.length > 0 && (
        <aside className="hidden lg:block">
          <RightSidebar suggestions={suggestions} />
        </aside>
      )}
    </div>
  );
}
