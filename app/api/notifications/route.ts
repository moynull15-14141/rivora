import { NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { db } from "@/lib/db";
import { successResponse, errorResponse } from "@/utils/api";

// GET /api/notifications — fetch notifications for current user
export async function GET() {
  const session = await getSession();
  if (!session?.user) {
    return NextResponse.json(errorResponse("Unauthorized"), { status: 401 });
  }

  const notifications = await db.notification.findMany({
    where: { userId: session.user.id },
    select: {
      id: true,
      type: true,
      postId: true,
      read: true,
      createdAt: true,
      actor: { select: { id: true, name: true, username: true, image: true } },
    },
    orderBy: { createdAt: "desc" },
    take: 30,
  });

  return NextResponse.json(successResponse(notifications));
}
