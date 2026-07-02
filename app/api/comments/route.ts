import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getSession } from "@/lib/session";
import { db } from "@/lib/db";
import { successResponse, errorResponse } from "@/utils/api";
import { createNotification } from "@/lib/notifications";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const dbc = db as any;

const commentSchema = z.object({
  postId: z.string().min(1),
  content: z.string().min(1, "Comment cannot be empty").max(1000),
  parentId: z.string().optional(),
  mentionedUserIds: z.array(z.string()).max(20).default([]),
});

// POST /api/comments — create a comment
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

  const parsed = commentSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      errorResponse(parsed.error.issues[0]?.message ?? "Invalid input"),
      { status: 400 }
    );
  }

  const post = await db.post.findUnique({
    where: { id: parsed.data.postId },
    select: { id: true, userId: true },
  });
  if (!post) {
    return NextResponse.json(errorResponse("Post not found"), { status: 404 });
  }

  // If the post owner is mentioned, they'll get a mention_comment notification instead
  const postOwnerIsMentioned = parsed.data.mentionedUserIds.includes(post.userId);

  const [comment] = await Promise.all([
    db.comment.create({
      data: {
        postId: parsed.data.postId,
        userId: session.user.id,
        content: parsed.data.content,
        ...(parsed.data.parentId ? { parentId: parsed.data.parentId } : {}),
      },
      select: {
        id: true,
        content: true,
        createdAt: true,
        parentId: true,
        user: { select: { id: true, name: true, username: true, image: true } },
      },
    }),
    // Notify post owner for top-level comments — skip if they're also mentioned (mention notif takes priority)
    ...(!parsed.data.parentId && session.user.id !== post.userId && !postOwnerIsMentioned
      ? [createNotification({ userId: post.userId, actorId: session.user.id, type: "comment", postId: parsed.data.postId })]
      : []),
  ]);

  // Fire-and-forget: mention records + notifications
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
            commentId: comment.id,
          })),
          skipDuplicates: true,
        });
        for (const userId of validMentionIds) {
          await createNotification({
            userId,
            actorId: session.user.id,
            type: "mention_comment",
            postId: post.id,
          });
        }
      } catch {
        // Best-effort
      }
    })();
  }

  return NextResponse.json(successResponse(comment), { status: 201 });
}
