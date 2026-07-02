import { NextResponse } from "next/server";
import { z } from "zod";
import { getCurrentUser } from "@/lib/session";
import { db } from "@/lib/db";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const dbc = db as any;

type Params = { params: Promise<{ id: string }> };

// POST /api/conversations/[id]/participants — add members (admin only)
export async function POST(req: Request, { params }: Params) {
  const currentUser = await getCurrentUser();
  if (!currentUser) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;

  const self = await dbc.conversationParticipant.findUnique({
    where: { conversationId_userId: { conversationId: id, userId: currentUser.id } },
  });
  if (!self || self.leftAt || !self.isAdmin) {
    return NextResponse.json({ error: "Admin only" }, { status: 403 });
  }

  let body: unknown;
  try { body = await req.json(); } catch { return NextResponse.json({ error: "Invalid JSON" }, { status: 400 }); }

  const schema = z.object({ userIds: z.array(z.string().min(1)).min(1) });
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Invalid input" }, { status: 400 });
  }

  const { userIds } = parsed.data;

  // For each userId: if they were previously in the group (leftAt set), rejoin; else create fresh
  for (const userId of userIds) {
    const existing = await dbc.conversationParticipant.findUnique({
      where: { conversationId_userId: { conversationId: id, userId } },
    });
    if (existing) {
      if (existing.leftAt) {
        // Rejoin
        await dbc.conversationParticipant.update({
          where: { id: existing.id },
          data: { leftAt: null, joinedAt: new Date() },
        });
      }
      // If already active, skip
    } else {
      await dbc.conversationParticipant.create({
        data: { conversationId: id, userId, isAdmin: false },
      });
    }
  }

  return NextResponse.json({ success: true });
}

// DELETE /api/conversations/[id]/participants — remove a member (admin only)
export async function DELETE(req: Request, { params }: Params) {
  const currentUser = await getCurrentUser();
  if (!currentUser) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;

  const self = await dbc.conversationParticipant.findUnique({
    where: { conversationId_userId: { conversationId: id, userId: currentUser.id } },
  });
  if (!self || self.leftAt || !self.isAdmin) {
    return NextResponse.json({ error: "Admin only" }, { status: 403 });
  }

  let body: unknown;
  try { body = await req.json(); } catch { return NextResponse.json({ error: "Invalid JSON" }, { status: 400 }); }

  const schema = z.object({ userId: z.string().min(1) });
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid input" }, { status: 400 });
  }

  const { userId } = parsed.data;
  if (userId === currentUser.id) {
    return NextResponse.json({ error: "Use leave group to remove yourself" }, { status: 400 });
  }

  await dbc.conversationParticipant.updateMany({
    where: { conversationId: id, userId, leftAt: null },
    data: { leftAt: new Date() },
  });

  return NextResponse.json({ success: true });
}
