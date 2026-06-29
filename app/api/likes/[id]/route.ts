import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { db } from "@/lib/db";
import { successResponse, errorResponse } from "@/utils/api";

// DELETE /api/likes/[id] — unlike a post (by like record ID)
export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession();
  if (!session?.user) {
    return NextResponse.json(errorResponse("Unauthorized"), { status: 401 });
  }

  const { id } = await params;

  const like = await db.like.findUnique({ where: { id }, select: { userId: true } });
  if (!like) {
    return NextResponse.json(errorResponse("Like not found"), { status: 404 });
  }
  if (like.userId !== session.user.id) {
    return NextResponse.json(errorResponse("Forbidden"), { status: 403 });
  }

  await db.like.delete({ where: { id } });
  return NextResponse.json(successResponse({ deleted: true }));
}
