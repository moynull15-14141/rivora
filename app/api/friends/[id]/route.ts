import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { revalidateTag } from "next/cache";
import { getSession } from "@/lib/session";
import { db } from "@/lib/db";
import { successResponse, errorResponse } from "@/utils/api";
import { createNotification } from "@/lib/notifications";

const patchSchema = z.object({
  action: z.enum(["accept", "reject"]),
});

// PATCH /api/friends/[id] — accept or reject a pending request
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession();
  if (!session?.user) {
    return NextResponse.json(errorResponse("Unauthorized"), { status: 401 });
  }

  const { id } = await params;

  const friendship = await db.friend.findUnique({ where: { id } });
  if (!friendship) {
    return NextResponse.json(errorResponse("Friend request not found"), { status: 404 });
  }

  // Only the recipient (friendId) can accept or reject
  if (friendship.friendId !== session.user.id) {
    return NextResponse.json(errorResponse("Forbidden"), { status: 403 });
  }

  if (friendship.status !== "pending") {
    return NextResponse.json(errorResponse("Request already handled"), { status: 409 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(errorResponse("Invalid JSON"), { status: 400 });
  }

  const parsed = patchSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      errorResponse(parsed.error.issues[0]?.message ?? "Invalid input"),
      { status: 400 }
    );
  }

  if (parsed.data.action === "accept") {
    const [updated] = await Promise.all([
      db.friend.update({
        where: { id },
        data: { status: "accepted", acceptedAt: new Date() },
        select: { id: true, status: true, requestedBy: true },
      }),
      createNotification({
        userId: friendship.requestedBy,
        actorId: session.user.id,
        type: "friend_accept",
      }),
    ]);
    revalidateTag(`layout-counts-${session.user.id}`);
    return NextResponse.json(successResponse(updated));
  }

  // reject → delete the record
  await db.friend.delete({ where: { id } });
  revalidateTag(`layout-counts-${session.user.id}`);
  return NextResponse.json(successResponse({ deleted: true }));
}

// DELETE /api/friends/[id] — unfriend or cancel pending request
export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession();
  if (!session?.user) {
    return NextResponse.json(errorResponse("Unauthorized"), { status: 401 });
  }

  const { id } = await params;

  const friendship = await db.friend.findUnique({ where: { id } });
  if (!friendship) {
    return NextResponse.json(errorResponse("Friendship not found"), { status: 404 });
  }

  if (
    friendship.userId !== session.user.id &&
    friendship.friendId !== session.user.id
  ) {
    return NextResponse.json(errorResponse("Forbidden"), { status: 403 });
  }

  await db.friend.delete({ where: { id } });
  return NextResponse.json(successResponse({ deleted: true }));
}
