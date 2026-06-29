import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/session";
import { db } from "@/lib/db";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const dbc = db as any;

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const currentUser = await getCurrentUser();
  if (!currentUser) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;

  const participant = await dbc.conversationParticipant.findUnique({
    where: { conversationId_userId: { conversationId: id, userId: currentUser.id } },
  });
  if (!participant) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const messages = await dbc.message.findMany({
    where: { conversationId: id },
    select: {
      id: true,
      content: true,
      senderId: true,
      read: true,
      editedAt: true,
      createdAt: true,
      sender: { select: { id: true, name: true, image: true } },
    },
    orderBy: { createdAt: "asc" },
    take: 50,
  });

  void dbc.message
    .updateMany({
      where: { conversationId: id, senderId: { not: currentUser.id }, read: false },
      data: { read: true },
    })
    .catch(() => {});

  return NextResponse.json(messages, {
    headers: { "Cache-Control": "no-store" },
  });
}
