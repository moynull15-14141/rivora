import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getSession } from "@/lib/session";
import { db } from "@/lib/db";
import { successResponse, errorResponse } from "@/utils/api";
import { createNotification } from "@/lib/notifications";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const dbc = db as any;

const FEED_PAGE_SIZE = 10;

// GET /api/posts?cursor=<postId> — paginated feed
export async function GET(request: NextRequest) {
  const session = await getSession();
  if (!session?.user) {
    return NextResponse.json(errorResponse("Unauthorized"), { status: 401 });
  }

  const cursor = request.nextUrl.searchParams.get("cursor");

  const friendships = await db.friend.findMany({
    where: {
      status: "accepted",
      OR: [{ userId: session.user.id }, { friendId: session.user.id }],
    },
    select: { userId: true, friendId: true },
  });

  const friendIds = friendships.map((f) =>
    f.userId === session.user.id ? f.friendId : f.userId
  );

  const posts = await db.post.findMany({
    where: {
      OR: [
        // Own posts are always visible
        { userId: session.user.id },
        // Friends' posts (public or friends-only)
        { userId: { in: friendIds }, visibility: { in: ["public", "friends"] } },
        // Public posts from non-private accounts (strangers)
        { user: { isPrivate: false }, visibility: "public" },
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
      likes: { where: { userId: session.user.id }, select: { id: true } },
    },
    orderBy: { createdAt: "desc" },
    take: FEED_PAGE_SIZE + 1,
    ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
  });

  const hasMore = posts.length > FEED_PAGE_SIZE;
  const page = hasMore ? posts.slice(0, FEED_PAGE_SIZE) : posts;
  const nextCursor = hasMore ? page[page.length - 1].id : null;

  return NextResponse.json(successResponse({ posts: page, nextCursor }));
}

const createSchema = z.object({
  content: z.string().min(1, "Content is required").max(5000),
  images: z.array(z.string().url()).max(4).default([]),
  visibility: z.enum(["public", "friends", "only_me"]).default("public"),
  mentionedUserIds: z.array(z.string()).max(20).default([]),
});

// POST /api/posts — create post
export async function POST(request: NextRequest) {
  const session = await getSession();
  if (!session?.user) {
    return NextResponse.json(errorResponse("Unauthorized"), { status: 401 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(errorResponse("Invalid JSON"), { status: 400 });
  }

  const parsed = createSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      errorResponse(parsed.error.issues[0]?.message ?? "Invalid input"),
      { status: 400 }
    );
  }

  const post = await db.post.create({
    data: {
      userId: session.user.id,
      content: parsed.data.content,
      images: parsed.data.images,
      visibility: parsed.data.visibility,
    },
    select: { id: true, content: true, createdAt: true },
  });

  // Fire-and-forget: create mention records + notifications
  const validMentionIds = parsed.data.mentionedUserIds.filter(
    (id) => id !== session.user.id
  );
  if (validMentionIds.length > 0) {
    void (async () => {
      try {
        await dbc.mention.createMany({
          data: validMentionIds.map((userId: string) => ({
            mentionedId: userId,
            mentionedBy: session.user.id,
            postId: post.id,
          })),
          skipDuplicates: true,
        });
        for (const userId of validMentionIds) {
          await createNotification({
            userId,
            actorId: session.user.id,
            type: "mention_post",
            postId: post.id,
          });
        }
      } catch {
        // Best-effort
      }
    })();
  }

  return NextResponse.json(successResponse(post), { status: 201 });
}
