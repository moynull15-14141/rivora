import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/session";
import { db } from "@/lib/db";
import { pusher } from "@/lib/pusher";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const dbc = db as any;

// PATCH /api/messages/[id] — edit message content
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const currentUser = await getCurrentUser();
  if (!currentUser) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const { content } = await req.json();
  if (!content?.trim()) return NextResponse.json({ error: "Content required" }, { status: 400 });

  const message = await dbc.message.findUnique({ where: { id } });
  if (!message) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (message.senderId !== currentUser.id) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const updated = await dbc.message.update({
    where: { id },
    data: { content: content.trim(), editedAt: new Date() },
    select: {
      id: true,
      content: true,
      senderId: true,
      read: true,
      editedAt: true,
      createdAt: true,
      sender: { select: { id: true, name: true, image: true } },
    },
  });

  void pusher.trigger(`chat-${message.conversationId}`, "message-updated", updated).catch(() => {});

  return NextResponse.json(updated);
}

// DELETE /api/messages/[id] — delete message
export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const currentUser = await getCurrentUser();
  if (!currentUser) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;

  const message = await dbc.message.findUnique({ where: { id } });
  if (!message) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (message.senderId !== currentUser.id) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  await dbc.message.delete({ where: { id } });

  void pusher.trigger(`chat-${message.conversationId}`, "message-deleted", { id }).catch(() => {});

  return NextResponse.json({ ok: true });
}
