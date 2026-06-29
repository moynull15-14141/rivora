import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/session";
import { db } from "@/lib/db";
import CreatePost from "@/components/posts/CreatePost";
import PostFeed from "@/components/posts/PostFeed";
import RightSidebar from "@/components/layout/RightSidebar";

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
