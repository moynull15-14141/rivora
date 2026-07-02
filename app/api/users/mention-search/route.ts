import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { db } from "@/lib/db";
import { successResponse, errorResponse } from "@/utils/api";

// GET /api/users/mention-search?q=<query>
// Returns friends matching the query — used for @mention dropdown
export async function GET(request: NextRequest) {
  const session = await getSession();
  if (!session?.user) {
    return NextResponse.json(errorResponse("Unauthorized"), { status: 401 });
  }

  const q = request.nextUrl.searchParams.get("q")?.trim() ?? "";

  if (q.length < 1) {
    return NextResponse.json(successResponse([]));
  }

  // Fetch accepted friend IDs
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
