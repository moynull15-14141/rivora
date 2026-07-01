import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { db } from "@/lib/db";
import { successResponse, errorResponse } from "@/utils/api";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const dbc = db as any;

// POST /api/fcm-token — save FCM token for current user's device
export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session?.user) {
    return NextResponse.json(errorResponse("Unauthorized"), { status: 401 });
  }

  const { token } = await req.json();
  if (!token || typeof token !== "string") {
    return NextResponse.json(errorResponse("Token required"), { status: 400 });
  }

  const user = await dbc.user.findUnique({
    where: { id: session.user.id },
    select: { fcmTokens: true },
  });

  if (user && !(user.fcmTokens as string[]).includes(token)) {
    await dbc.user.update({
      where: { id: session.user.id },
      data: { fcmTokens: { push: token } },
    });
  }

  return NextResponse.json(successResponse({ ok: true }));
}

// DELETE /api/fcm-token — remove FCM token on logout
export async function DELETE(req: NextRequest) {
  const session = await getSession();
  if (!session?.user) {
    return NextResponse.json(errorResponse("Unauthorized"), { status: 401 });
  }

  const { token } = await req.json();
  if (!token || typeof token !== "string") {
    return NextResponse.json(errorResponse("Token required"), { status: 400 });
  }

  const user = await dbc.user.findUnique({
    where: { id: session.user.id },
    select: { fcmTokens: true },
  });

  if (user) {
    await dbc.user.update({
      where: { id: session.user.id },
      data: {
        fcmTokens: {
          set: (user.fcmTokens as string[]).filter((t: string) => t !== token),
        },
      },
    });
  }

  return NextResponse.json(successResponse({ ok: true }));
}
