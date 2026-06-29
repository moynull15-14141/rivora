import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { db } from "@/lib/db";
import { successResponse, errorResponse } from "@/utils/api";

// DELETE /api/comments/[id] — delete comment (own or post owner)
export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession();
  if (!session?.user) {
    return NextResponse.json(errorResponse("Unauthorized"), { status: 401 });
  }

  const { id } = await params;

  const comment = await db.comment.findUnique({
    where: { id },
    select: {
      userId: true,
      post: { select: { userId: true } },
    },
  });

  if (!comment) {
    return NextResponse.json(errorResponse("Comment not found"), { status: 404 });
  }

  const isCommentAuthor = comment.userId === session.user.id;
  const isPostOwner = comment.post.userId === session.user.id;

  if (!isCommentAuthor && !isPostOwner) {
    return NextResponse.json(errorResponse("Forbidden"), { status: 403 });
  }

  await db.comment.delete({ where: { id } });
  return NextResponse.json(successResponse({ deleted: true }));
}
