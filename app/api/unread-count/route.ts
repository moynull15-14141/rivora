import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/session";
import { db } from "@/lib/db";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const dbc = db as any;

export async function GET() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ unreadMessages: 0, unreadNotifs: 0 });

  const [unreadMessages, unreadNotifs] = await Promise.all([
    dbc.message.count({
      where: {
        read: false,
        senderId: { not: user.id },
        conversation: { participants: { some: { userId: user.id } } },
      },
    }),
    db.notification.count({ where: { userId: user.id, read: false } }),
  ]);

  return NextResponse.json({ unreadMessages, unreadNotifs });
}
