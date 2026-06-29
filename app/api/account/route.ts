import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { headers } from "next/headers";
import { successResponse, errorResponse } from "@/utils/api";

// PATCH /api/account — deactivate account
export async function PATCH(request: NextRequest) {
  const session = await getSession();
  if (!session?.user) {
    return NextResponse.json(errorResponse("Unauthorized"), { status: 401 });
  }

  let body: { action?: string } = {};
  try { body = await request.json(); } catch { /* empty body is ok */ }

  if (body.action === "deactivate") {
    await db.user.update({
      where: { id: session.user.id },
      data: { isActive: false },
    });
    await auth.api.signOut({ headers: await headers() });
    return NextResponse.json(successResponse({ message: "Account deactivated" }));
  }

  if (body.action === "reactivate") {
    await db.user.update({
      where: { id: session.user.id },
      data: { isActive: true },
    });
    return NextResponse.json(successResponse({ message: "Account reactivated" }));
  }

  return NextResponse.json(errorResponse("Invalid action"), { status: 400 });
}

// DELETE /api/account — permanently delete account
export async function DELETE() {
  const session = await getSession();
  if (!session?.user) {
    return NextResponse.json(errorResponse("Unauthorized"), { status: 401 });
  }

  await auth.api.signOut({ headers: await headers() });
  await db.user.delete({ where: { id: session.user.id } });

  return NextResponse.json(successResponse({ message: "Account deleted" }));
}
