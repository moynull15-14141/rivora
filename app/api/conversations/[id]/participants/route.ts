import { NextResponse } from "next/server";
import { z } from "zod";
import { getCurrentUser } from "@/lib/session";
import { db } from "@/lib/db";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const dbc = db as any;

type Params = { params: Promise<{ id: string }> };

// GET /api/conversations/[id]/participants
// Returns { active: [...], pending: [...] }
// pending is only populated for admins
export async function GET(_req: Request, { params }: Params) {
  const currentUser = await getCurrentUser();
  if (!currentUser) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;

  const self = await dbc.conversationParticipant.findUnique({
    where: { conversationId_userId: { conversationId: id, userId: currentUser.id } },
  });
  if (!self || self.leftAt || self.status === "pending") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const all = await dbc.conversationParticipant.findMany({
    where: { conversationId: id, leftAt: null },
    include: {
      user: { select: { id: true, name: true, username: true, image: true } },
    },
    orderBy: { joinedAt: "asc" },
  });

  const active = all
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    .filter((p: any) => p.status === "active")
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    .map((p: any) => ({
      id: p.userId,
      name: p.user.name,
      username: p.user.username,
      image: p.user.image,
      isAdmin: p.isAdmin,
      joinedAt: p.joinedAt,
    }));

  if (!self.isAdmin) {
    return NextResponse.json({ active, pending: [] });
  }

  // For admins: resolve pending invites with invitedBy user info
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const pendingRows = all.filter((p: any) => p.status === "pending");

  const inviterIds = [
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    ...new Set(pendingRows.map((p: any) => p.invitedBy).filter(Boolean)),
  ] as string[];

  const inviters =
    inviterIds.length > 0
      ? await db.user.findMany({
          where: { id: { in: inviterIds } },
          select: { id: true, name: true },
        })
      : [];

  const inviterMap = Object.fromEntries(inviters.map((u) => [u.id, u.name]));

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const pending = pendingRows.map((p: any) => ({
    id: p.userId,
    name: p.user.name,
    username: p.user.username,
    image: p.user.image,
    invitedBy: p.invitedBy ?? null,
    invitedByName: p.invitedBy ? (inviterMap[p.invitedBy] ?? null) : null,
  }));

  return NextResponse.json({ active, pending });
}

// POST /api/conversations/[id]/participants
// Any active member can invite. Admin = immediate; non-admin = pending (needs approval).
export async function POST(req: Request, { params }: Params) {
  const currentUser = await getCurrentUser();
  if (!currentUser) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;

  const self = await dbc.conversationParticipant.findUnique({
    where: { conversationId_userId: { conversationId: id, userId: currentUser.id } },
  });
  if (!self || self.leftAt || self.status === "pending") {
    return NextResponse.json({ error: "Not a member" }, { status: 403 });
  }

  // Verify it's a group conversation
  const conversation = await dbc.conversation.findUnique({
    where: { id },
    select: { isGroup: true },
  });
  if (!conversation?.isGroup) {
    return NextResponse.json({ error: "Not a group" }, { status: 400 });
  }

  let body: unknown;
  try { body = await req.json(); } catch { return NextResponse.json({ error: "Invalid JSON" }, { status: 400 }); }

  const schema = z.object({ userIds: z.array(z.string().min(1)).min(1) });
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Invalid input" }, { status: 400 });
  }

  const isAdmin = Boolean(self.isAdmin);
  const results: { userId: string; result: "added" | "pending" | "already_member" | "pending_exists" }[] = [];

  for (const userId of parsed.data.userIds) {
    const existing = await dbc.conversationParticipant.findUnique({
      where: { conversationId_userId: { conversationId: id, userId } },
    });

    if (existing) {
      if (existing.leftAt) {
        // Previously left — rejoin
        if (isAdmin) {
          await dbc.conversationParticipant.update({
            where: { id: existing.id },
            data: { leftAt: null, joinedAt: new Date(), status: "active", invitedBy: null },
          });
          results.push({ userId, result: "added" });
        } else {
          // Non-admin re-invite of someone who left → pending
          await dbc.conversationParticipant.update({
            where: { id: existing.id },
            data: { leftAt: null, joinedAt: new Date(), status: "pending", invitedBy: currentUser.id },
          });
          results.push({ userId, result: "pending" });
        }
      } else if (existing.status === "pending") {
        if (isAdmin) {
          // Admin can approve immediately
          await dbc.conversationParticipant.update({
            where: { id: existing.id },
            data: { status: "active", invitedBy: null, joinedAt: new Date() },
          });
          results.push({ userId, result: "added" });
        } else {
          results.push({ userId, result: "pending_exists" });
        }
      } else {
        results.push({ userId, result: "already_member" });
      }
    } else {
      if (isAdmin) {
        await dbc.conversationParticipant.create({
          data: { conversationId: id, userId, isAdmin: false, status: "active" },
        });
        results.push({ userId, result: "added" });
      } else {
        await dbc.conversationParticipant.create({
          data: { conversationId: id, userId, isAdmin: false, status: "pending", invitedBy: currentUser.id },
        });
        results.push({ userId, result: "pending" });
      }
    }
  }

  const anyPending = results.some((r) => r.result === "pending");
  const anyAdded = results.some((r) => r.result === "added");

  return NextResponse.json({
    success: true,
    message: anyAdded && anyPending
      ? "Some members added; others are pending admin approval"
      : anyAdded
      ? "Members added successfully"
      : anyPending
      ? "Invite sent for admin approval"
      : "No changes made",
    results,
  });
}

// PATCH /api/conversations/[id]/participants — admin approve or reject a pending invite
export async function PATCH(req: Request, { params }: Params) {
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

  const schema = z.object({
    userId: z.string().min(1),
    action: z.enum(["approve", "reject"]),
  });
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Invalid input" }, { status: 400 });
  }

  const { userId, action } = parsed.data;

  const target = await dbc.conversationParticipant.findUnique({
    where: { conversationId_userId: { conversationId: id, userId } },
  });
  if (!target || target.status !== "pending") {
    return NextResponse.json({ error: "No pending invite found" }, { status: 404 });
  }

  if (action === "approve") {
    await dbc.conversationParticipant.update({
      where: { id: target.id },
      data: { status: "active", invitedBy: null, joinedAt: new Date() },
    });
    return NextResponse.json({ success: true, message: "Member approved" });
  } else {
    await dbc.conversationParticipant.delete({ where: { id: target.id } });
    return NextResponse.json({ success: true, message: "Invite rejected" });
  }
}

// DELETE /api/conversations/[id]/participants — admin kick a member
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
