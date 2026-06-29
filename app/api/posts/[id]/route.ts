import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getSession } from "@/lib/session";
import { db } from "@/lib/db";
import { successResponse, errorResponse } from "@/utils/api";

const updateSchema = z.object({
  content: z.string().min(1).max(5000).optional(),
  visibility: z.enum(["public", "friends", "only_me"]).optional(),
});

// PATCH /api/posts/[id] — edit post (owner only)
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession();
  if (!session?.user) {
    return NextResponse.json(errorResponse("Unauthorized"), { status: 401 });
  }

  const { id } = await params;

  const post = await db.post.findUnique({ where: { id }, select: { userId: true } });
  if (!post) {
    return NextResponse.json(errorResponse("Post not found"), { status: 404 });
  }
  if (post.userId !== session.user.id) {
    return NextResponse.json(errorResponse("Forbidden"), { status: 403 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(errorResponse("Invalid JSON"), { status: 400 });
  }

  const parsed = updateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      errorResponse(parsed.error.issues[0]?.message ?? "Invalid input"),
      { status: 400 }
    );
  }

  const updated = await db.post.update({
    where: { id },
    data: { ...parsed.data, editedAt: new Date() },
    select: { id: true, content: true, visibility: true, editedAt: true },
  });

  return NextResponse.json(successResponse(updated));
}

// DELETE /api/posts/[id] — delete post (owner only)
export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession();
  if (!session?.user) {
    return NextResponse.json(errorResponse("Unauthorized"), { status: 401 });
  }

  const { id } = await params;

  const post = await db.post.findUnique({ where: { id }, select: { userId: true } });
  if (!post) {
    return NextResponse.json(errorResponse("Post not found"), { status: 404 });
  }
  if (post.userId !== session.user.id) {
    return NextResponse.json(errorResponse("Forbidden"), { status: 403 });
  }

  await db.post.delete({ where: { id } });
  return NextResponse.json(successResponse({ deleted: true }));
}
