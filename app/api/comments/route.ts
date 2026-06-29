import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getSession } from "@/lib/session";
import { db } from "@/lib/db";
import { successResponse, errorResponse } from "@/utils/api";
import { createNotification } from "@/lib/notifications";

const commentSchema = z.object({
  postId: z.string().min(1),
  content: z.string().min(1, "Comment cannot be empty").max(1000),
  parentId: z.string().optional(),
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
    // Only notify post owner for top-level comments (not replies)
    ...(!parsed.data.parentId && session.user.id !== post.userId
      ? [createNotification({ userId: post.userId, actorId: session.user.id, type: "comment", postId: parsed.data.postId })]
      : []),
  ]);

  return NextResponse.json(successResponse(comment), { status: 201 });
}
