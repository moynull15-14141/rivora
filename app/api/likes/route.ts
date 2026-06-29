import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getSession } from "@/lib/session";
import { db } from "@/lib/db";
import { successResponse, errorResponse } from "@/utils/api";
import { createNotification } from "@/lib/notifications";

const likeSchema = z.object({ postId: z.string().min(1) });

// POST /api/likes — like a post
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

  const parsed = likeSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      errorResponse(parsed.error.issues[0]?.message ?? "Invalid input"),
      { status: 400 }
    );
  }

  const { postId } = parsed.data;

  const post = await db.post.findUnique({ where: { id: postId }, select: { id: true, userId: true } });
  if (!post) {
    return NextResponse.json(errorResponse("Post not found"), { status: 404 });
  }

  const existing = await db.like.findUnique({
    where: { postId_userId: { postId, userId: session.user.id } },
    select: { id: true },
  });

  if (existing) {
    return NextResponse.json(successResponse(existing));
  }

  const [like] = await Promise.all([
    db.like.create({
      data: { postId, userId: session.user.id },
      select: { id: true },
    }),
    createNotification({
      userId: post.userId,
      actorId: session.user.id,
      type: "like",
      postId,
    }),
  ]);

  return NextResponse.json(successResponse(like), { status: 201 });
}
