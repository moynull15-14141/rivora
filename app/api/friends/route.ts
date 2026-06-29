import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getSession } from "@/lib/session";
import { db } from "@/lib/db";
import { successResponse, errorResponse } from "@/utils/api";
import { createNotification } from "@/lib/notifications";

// GET /api/friends — accepted friends of current user
export async function GET() {
  const session = await getSession();
  if (!session?.user) {
    return NextResponse.json(errorResponse("Unauthorized"), { status: 401 });
  }

  const friends = await db.friend.findMany({
    where: {
      status: "accepted",
      OR: [{ userId: session.user.id }, { friendId: session.user.id }],
    },
    select: {
      id: true,
      user: { select: { id: true, name: true, username: true, image: true } },
      friend: { select: { id: true, name: true, username: true, image: true } },
    },
    orderBy: { acceptedAt: "desc" },
  });

  const list = friends.map((f) =>
    f.user.id === session.user.id ? f.friend : f.user
  );

  return NextResponse.json(successResponse(list));
}

const sendSchema = z.object({
  friendId: z.string().min(1),
});

// POST /api/friends — send friend request
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

  const parsed = sendSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      errorResponse(parsed.error.issues[0]?.message ?? "Invalid input"),
      { status: 400 }
    );
  }

  const { friendId } = parsed.data;

  if (friendId === session.user.id) {
    return NextResponse.json(
      errorResponse("You cannot send a friend request to yourself"),
      { status: 400 }
    );
  }

  const targetUser = await db.user.findUnique({ where: { id: friendId } });
  if (!targetUser) {
    return NextResponse.json(errorResponse("User not found"), { status: 404 });
  }

  const existing = await db.friend.findFirst({
    where: {
      OR: [
        { userId: session.user.id, friendId },
        { userId: friendId, friendId: session.user.id },
      ],
    },
  });

  if (existing) {
    return NextResponse.json(
      errorResponse(
        existing.status === "accepted"
          ? "Already friends"
          : "Friend request already exists"
      ),
      { status: 409 }
    );
  }

  const [friendship] = await Promise.all([
    db.friend.create({
      data: {
        userId: session.user.id,
        friendId,
        requestedBy: session.user.id,
        status: "pending",
      },
      select: { id: true, status: true, requestedBy: true },
    }),
    createNotification({
      userId: friendId,
      actorId: session.user.id,
      type: "friend_request",
    }),
  ]);

  return NextResponse.json(successResponse(friendship), { status: 201 });
}
