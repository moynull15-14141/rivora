import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { db } from "@/lib/db";
import { successResponse, errorResponse } from "@/utils/api";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const dbc = db as any;

// GET /api/users/mention-search?q=<query>[&conversationId=<id>]
// If conversationId provided → search only that conversation's active members
// Otherwise → search accepted friends
export async function GET(request: NextRequest) {
  const session = await getSession();
  if (!session?.user) {
    return NextResponse.json(errorResponse("Unauthorized"), { status: 401 });
  }

  const q = request.nextUrl.searchParams.get("q")?.trim() ?? "";
  const conversationId = request.nextUrl.searchParams.get("conversationId");

  if (q.length < 1) {
    return NextResponse.json(successResponse([]));
  }

  if (conversationId) {
    // Group @mention: search active participants of this conversation (excluding self)
    const participants = await dbc.conversationParticipant.findMany({
      where: {
        conversationId,
        leftAt: null,
        status: "active",
        userId: { not: session.user.id },
        user: {
          username: { not: null },
          OR: [
            { name: { contains: q, mode: "insensitive" } },
            { username: { contains: q, mode: "insensitive" } },
          ],
        },
      },
      select: {
        user: { select: { id: true, name: true, username: true, image: true } },
      },
      take: 6,
    });

    const result = participants
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .filter((p: any) => p.user.username)
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .map((p: any) => ({
        id: p.user.id,
        name: p.user.name,
        username: p.user.username as string,
        image: p.user.image,
      }));

    return NextResponse.json(successResponse(result));
  }

  // Default: search accepted friends
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

  if (friendIds.length === 0) {
    return NextResponse.json(successResponse([]));
  }

  const users = await db.user.findMany({
    where: {
      id: { in: friendIds },
      username: { not: null },
      OR: [
        { name: { contains: q, mode: "insensitive" } },
        { username: { contains: q, mode: "insensitive" } },
      ],
    },
    select: { id: true, name: true, username: true, image: true },
    take: 6,
    orderBy: { name: "asc" },
  });

  const result = users
    .filter((u) => u.username)
    .map((u) => ({ id: u.id, name: u.name, username: u.username!, image: u.image }));

  return NextResponse.json(successResponse(result));
}
