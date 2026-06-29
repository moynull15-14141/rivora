import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/session";
import { db } from "@/lib/db";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const dbc = db as any;

export async function GET() {
  const currentUser = await getCurrentUser();
  if (!currentUser) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const conversations = await dbc.conversation.findMany({
    where: { participants: { some: { userId: currentUser.id } } },
    include: {
      participants: {
        where: { userId: { not: currentUser.id } },
        include: {
          user: {
            select: { id: true, name: true, username: true, image: true, lastSeen: true },
          },
        },
      },
      messages: {
        orderBy: { createdAt: "desc" },
        take: 1,
        select: { id: true, content: true, senderId: true, read: true, createdAt: true },
      },
    },
    orderBy: { updatedAt: "desc" },
  });

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const result = conversations.map((c: any) => ({
    id: c.id,
    updatedAt: c.updatedAt,
    otherUser: c.participants[0]?.user ?? null,
    lastMessage: c.messages[0] ?? null,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    unreadCount: c.messages.filter((m: any) => m.senderId !== currentUser.id && !m.read).length,
  }));

  return NextResponse.json(result);
}

export async function POST(req: Request) {
  const currentUser = await getCurrentUser();
  if (!currentUser) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { userId } = await req.json();
  if (!userId || userId === currentUser.id) {
    return NextResponse.json({ error: "Invalid userId" }, { status: 400 });
  }

  const existing = await dbc.conversation.findFirst({
    where: {
      AND: [
        { participants: { some: { userId: currentUser.id } } },
        { participants: { some: { userId } } },
      ],
    },
    select: { id: true },
  });

  if (existing) return NextResponse.json({ id: existing.id });

  const conversation = await dbc.conversation.create({
    data: {
      participants: {
        create: [{ userId: currentUser.id }, { userId }],
      },
    },
    select: { id: true },
  });

  return NextResponse.json({ id: conversation.id }, { status: 201 });
}
