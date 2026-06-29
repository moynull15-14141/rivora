import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { getCurrentUser } from "@/lib/session";
import { db } from "@/lib/db";
import PostCard from "@/components/posts/PostCard";

export default async function PostPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const currentUser = await getCurrentUser();
  if (!currentUser) redirect("/login");

  const { id } = await params;

  const post = await db.post.findUnique({
    where: { id },
    select: {
      id: true,
      content: true,
      images: true,
      visibility: true,
      createdAt: true,
      editedAt: true,
      userId: true,
      user: {
        select: { id: true, name: true, username: true, image: true, lastSeen: true },
      },
      _count: { select: { likes: true, comments: true } },
      likes: {
        where: { userId: currentUser.id },
        select: { id: true },
      },
    },
  });

  if (!post) notFound();

  // Visibility check
  const isOwn = post.userId === currentUser.id;
  if (!isOwn) {
    if (post.visibility === "only_me") notFound();
    if (post.visibility === "friends") {
      const friendship = await db.friend.findFirst({
        where: {
          status: "accepted",
          OR: [
            { userId: currentUser.id, friendId: post.userId },
            { userId: post.userId, friendId: currentUser.id },
          ],
        },
        select: { id: true },
      });
      if (!friendship) notFound();
    }
  }

  const profileHref = `/${post.user.username ?? post.user.id}`;

  return (
    <div className="mx-auto max-w-2xl px-4 py-6 sm:px-6">
      <Link
        href={profileHref}
        className="mb-4 flex items-center gap-1.5 text-sm font-medium text-gray-400 transition-colors hover:text-gray-700"
      >
        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
        {post.user.name}&apos;s profile
      </Link>

      <PostCard
        post={{
          ...post,
          visibility: post.visibility as "public" | "friends" | "only_me",
        }}
        currentUserId={currentUser.id}
        currentUserName={currentUser.name}
        currentUserImage={currentUser.image ?? null}
        expandComments
        priority
      />
    </div>
  );
}
