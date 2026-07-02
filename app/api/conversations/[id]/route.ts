import { NextResponse } from "next/server";
import { z } from "zod";
import { getCurrentUser } from "@/lib/session";
import { db } from "@/lib/db";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const dbc = db as any;

type Params = { params: Promise<{ id: string }> };

// GET /api/conversations/[id] — conversation detail with participants
export async function GET(_req: Request, { params }: Params) {
  const currentUser = await getCurrentUser();
  if (!currentUser) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;

  const participant = await dbc.conversationParticipant.findUnique({
    where: { conversationId_userId: { conversationId: id, userId: currentUser.id } },
  });
  if (!participant || participant.leftAt) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const conversation = await dbc.conversation.findUnique({
    where: { id },
    include: {
      participants: {
        where: { leftAt: null },
        include: {
          user: {
            select: { id: true, name: true, username: true, image: true, lastSeen: true },
          },
        },
        orderBy: { joinedAt: "asc" },
      },
    },
  });

  if (!conversation) return NextResponse.json({ error: "Not found" }, { status: 404 });

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const mappedParticipants = conversation.participants.map((p: any) => ({
    id: p.userId,
    name: p.user.name,
    username: p.user.username,
    image: p.user.image,
    lastSeen: p.user.lastSeen,
    isAdmin: p.isAdmin,
    joinedAt: p.joinedAt,
  }));

  return NextResponse.json({
    id: conversation.id,
    isGroup: conversation.isGroup,
    name: conversation.name,
    avatar: conversation.avatar,
    createdBy: conversation.createdBy,
    createdAt: conversation.createdAt,
    participants: mappedParticipants,
    currentParticipant: {
      isAdmin: participant.isAdmin,
    },
  });
}

const patchSchema = z.object({
  name: z.string().min(1).max(50).optional(),
  avatar: z.string().url().nullable().optional(),
});

// PATCH /api/conversations/[id] — update group name/avatar (admin only)
export async function PATCH(req: Request, { params }: Params) {
  const currentUser = await getCurrentUser();
  if (!currentUser) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;

  const participant = await dbc.conversationParticipant.findUnique({
    where: { conversationId_userId: { conversationId: id, userId: currentUser.id } },
  });
  if (!participant || participant.leftAt) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  if (!participant.isAdmin) {
    return NextResponse.json({ error: "Admin only" }, { status: 403 });
  }

  const conversation = await dbc.conversation.findUnique({
    where: { id },
    select: { isGroup: true },
  });
  if (!conversation?.isGroup) {
    return NextResponse.json({ error: "Not a group" }, { status: 400 });
  }

  let body: unknown;
  try { body = await req.json(); } catch { return NextResponse.json({ error: "Invalid JSON" }, { status: 400 }); }

  const parsed = patchSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Invalid input" }, { status: 400 });
  }

  const updated = await dbc.conversation.update({
    where: { id },
    data: {
      ...(parsed.data.name !== undefined ? { name: parsed.data.name } : {}),
      ...(parsed.data.avatar !== undefined ? { avatar: parsed.data.avatar } : {}),
    },
    select: { id: true, name: true, avatar: true },
  });

  return NextResponse.json(updated);
}

// DELETE /api/conversations/[id] — leave group (set leftAt)
export async function DELETE(_req: Request, { params }: Params) {
  const currentUser = await getCurrentUser();
  if (!currentUser) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;

  const participant = await dbc.conversationParticipant.findUnique({
    where: { conversationId_userId: { conversationId: id, userId: currentUser.id } },
  });
  if (!participant || participant.leftAt) {
    return NextResponse.json({ error: "Not a member" }, { status: 400 });
  }

  const conversation = await dbc.conversation.findUnique({
    where: { id },
    select: { isGroup: true },
  });
  if (!conversation?.isGroup) {
    return NextResponse.json({ error: "Cannot leave a DM" }, { status: 400 });
  }

  // Set leftAt
  await dbc.conversationParticipant.update({
    where: { conversationId_userId: { conversationId: id, userId: currentUser.id } },
    data: { leftAt: new Date() },
  });

  // If this user was the only admin, promote the next oldest member
  if (participant.isAdmin) {
    const remaining = await dbc.conversationParticipant.findMany({
      where: { conversationId: id, leftAt: null, isAdmin: false },
      orderBy: { joinedAt: "asc" },
      take: 1,
    });
    if (remaining.length > 0) {
      await dbc.conversationParticipant.update({
        where: { id: remaining[0].id },
        data: { isAdmin: true },
      });
    }
  }

  return NextResponse.json({ success: true });
}
