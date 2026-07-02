import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { db } from "@/lib/db";
import { successResponse, errorResponse } from "@/utils/api";

export async function GET(request: NextRequest) {
  const session = await getSession();
  if (!session?.user) {
    return NextResponse.json(errorResponse("Unauthorized"), { status: 401 });
  }

  const q = request.nextUrl.searchParams.get("q")?.trim() ?? "";

  if (q.length < 1) {
    return NextResponse.json(successResponse([]));
  }

  const [users, friendships] = await Promise.all([
    db.user.findMany({
      where: {
        id: { not: session.user.id },
        OR: [
          { name: { contains: q, mode: "insensitive" } },
          { username: { contains: q, mode: "insensitive" } },
        ],
      },
      select: {
        id: true,
        name: true,
        username: true,
        image: true,
        bio: true,
        isPrivate: true,
      },
      take: 8,
      orderBy: { name: "asc" },
    }),
    db.friend.findMany({
      where: {
        status: "accepted",
        OR: [{ userId: session.user.id }, { friendId: session.user.id }],
      },
      select: { userId: true, friendId: true },
    }),
  ]);

  const friendSet = new Set(
    friendships.map((f) =>
      f.userId === session.user.id ? f.friendId : f.userId
    )
  );

  const result = users.map((u) => ({
    ...u,
    // Hide bio for private accounts that aren't friends
    bio: u.isPrivate && !friendSet.has(u.id) ? null : u.bio,
  }));

  return NextResponse.json(successResponse(result));
}
