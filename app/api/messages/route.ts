import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/session";
import { db } from "@/lib/db";
import { pusher } from "@/lib/pusher";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const dbc = db as any;

export async function POST(req: Request) {
  const currentUser = await getCurrentUser();
  if (!currentUser) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { conversationId, content } = await req.json();
  if (!conversationId || !content?.trim()) {
    return NextResponse.json({ error: "Missing fields" }, { status: 400 });
  }

  const participant = await dbc.conversationParticipant.findUnique({
    where: { conversationId_userId: { conversationId, userId: currentUser.id } },
  });
  if (!participant) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const [message] = await Promise.all([
    dbc.message.create({
      data: { conversationId, senderId: currentUser.id, content: content.trim() },
      select: {
        id: true,
        content: true,
        senderId: true,
        read: true,
        createdAt: true,
        sender: { select: { id: true, name: true, image: true } },
      },
    }),
    dbc.conversation.update({
      where: { id: conversationId },
      data: { updatedAt: new Date() },
    }),
  ]);

  void pusher.trigger(`chat-${conversationId}`, "new-message", message).catch(() => {});

  return NextResponse.json(message, { status: 201 });
}
