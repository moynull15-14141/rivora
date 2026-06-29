import { NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { db } from "@/lib/db";

// PATCH /api/ping — keep lastSeen fresh while user is active on a page
export async function PATCH() {
  const session = await getSession();
  if (!session?.user) return NextResponse.json({ ok: false }, { status: 401 });

  await db.user.update({
    where: { id: session.user.id },
    data: { lastSeen: new Date() },
  });

  return NextResponse.json({ ok: true });
}
