import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/session";
import { db } from "@/lib/db";
import { triggerPusher } from "@/lib/pusher";
import { sendPushNotification } from "@/lib/send-notification";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const dbc = db as any;

export async function POST(req: Request) {
  const currentUser = await getCurrentUser();
  if (!currentUser) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { conversationId, content } = await req.json();
  if (!conversationId || !content?.trim()) {
    return NextResponse.json({ error: "Missing fields" }, { status: 400 });
  }

  // Verify membership (must not have left)
  const participant = await dbc.conversationParticipant.findUnique({
    where: { conversationId_userId: { conversationId, userId: currentUser.id } },
  });
  if (!participant || participant.leftAt || participant.status === "pending") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  // Fetch conversation info for notification title
  const conversation = await dbc.conversation.findUnique({
    where: { id: conversationId },
    select: { isGroup: true, name: true },
  });
  if (!conversation) return NextResponse.json({ error: "Not found" }, { status: 404 });

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
    // Update lastMessageAt for sorting
    dbc.conversation.update({
      where: { id: conversationId },
      data: { updatedAt: new Date(), lastMessageAt: new Date() },
    }),
  ]);

  void triggerPusher(`chat-${conversationId}`, "new-message", message);

  // Push notifications to all other active participants
  const otherParticipants = await dbc.conversationParticipant.findMany({
    where: { conversationId, userId: { not: currentUser.id }, leftAt: null },
    select: { userId: true },
  });

  const notifTitle = conversation.isGroup
    ? (conversation.name ?? "Group Chat")
    : currentUser.name;
  const notifBody = conversation.isGroup
    ? `${currentUser.name}: ${content.trim().slice(0, 80)}${content.trim().length > 80 ? "…" : ""}`
    : `${content.trim().slice(0, 80)}${content.trim().length > 80 ? "…" : ""}`;

  for (const p of otherParticipants as { userId: string }[]) {
    void sendPushNotification({
      userId: p.userId,
      title: notifTitle,
      body: notifBody,
      icon: currentUser.image ?? undefined,
      url: `/messages/${conversationId}`,
      sound: "/sounds/msgtune.wav",
      type: "message",
    });
  }

  return NextResponse.json(message, { status: 201 });
}
