import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { db } from "@/lib/db";
import { successResponse, errorResponse } from "@/utils/api";

// GET /api/posts/[id]/comments — fetch comments for a post
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession();
  if (!session?.user) {
    return NextResponse.json(errorResponse("Unauthorized"), { status: 401 });
  }

  const { id } = await params;

  const comments = await db.comment.findMany({
    where: { postId: id, parentId: null },
    select: {
      id: true,
      content: true,
      createdAt: true,
      user: { select: { id: true, name: true, username: true, image: true } },
      replies: {
        select: {
          id: true,
          content: true,
          createdAt: true,
          user: { select: { id: true, name: true, username: true, image: true } },
        },
        orderBy: { createdAt: "asc" },
      },
    },
    orderBy: { createdAt: "asc" },
  });

  return NextResponse.json(successResponse(comments));
}
