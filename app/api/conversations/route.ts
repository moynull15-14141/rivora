import { NextResponse } from "next/server";
import { z } from "zod";
import { getCurrentUser } from "@/lib/session";
import { db } from "@/lib/db";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const dbc = db as any;

// GET /api/conversations — list conversations for current user
export async function GET() {
  const currentUser = await getCurrentUser();
  if (!currentUser) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const conversations = await dbc.conversation.findMany({
    where: {
      participants: {
        some: { userId: currentUser.id, leftAt: null, status: "active" },
      },
    },
    include: {
      participants: {
        where: { leftAt: null, status: "active" },
        include: {
          user: {
            select: { id: true, name: true, username: true, image: true, lastSeen: true },
          },
        },
        orderBy: { joinedAt: "asc" },
      },
      messages: {
        orderBy: { createdAt: "desc" },
        take: 1,
        select: {
          id: true,
          content: true,
          senderId: true,
          read: true,
          createdAt: true,
          sender: { select: { name: true } },
        },
      },
    },
    orderBy: { lastMessageAt: "desc" },
  });

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const result = conversations.map((c: any) => {
    const lastMsg = c.messages[0] ?? null;
    const unread = lastMsg && lastMsg.senderId !== currentUser.id && !lastMsg.read;

    if (c.isGroup) {
      // Group: include all participant info (exclude current user for avatar stack display)
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const others = c.participants.filter((p: any) => p.userId !== currentUser.id);
      return {
        id: c.id,
        isGroup: true,
        name: c.name,
        avatar: c.avatar,
        lastMessageAt: c.lastMessageAt,
        otherUser: null,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        participants: c.participants.map((p: any) => ({
          id: p.userId,
          name: p.user.name,
          image: p.user.image,
          isAdmin: p.isAdmin,
        })),
        participantCount: c.participants.length,
        lastMessage: lastMsg
          ? {
              content: lastMsg.content,
              senderId: lastMsg.senderId,
              senderName: lastMsg.sender?.name ?? null,
              read: lastMsg.read,
              createdAt: lastMsg.createdAt,
            }
          : null,
        unread: Boolean(unread),
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        avatarUsers: others.slice(0, 3).map((p: any) => ({
          id: p.userId,
          name: p.user.name,
          image: p.user.image,
        })),
      };
    } else {
      // 1-to-1
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const other = c.participants.find((p: any) => p.userId !== currentUser.id);
      return {
        id: c.id,
        isGroup: false,
        name: null,
        avatar: null,
        lastMessageAt: c.lastMessageAt,
        otherUser: other?.user ?? null,
        participants: [],
        participantCount: 2,
        lastMessage: lastMsg
          ? {
              content: lastMsg.content,
              senderId: lastMsg.senderId,
              senderName: null,
              read: lastMsg.read,
              createdAt: lastMsg.createdAt,
            }
          : null,
        unread: Boolean(unread),
        avatarUsers: [],
      };
    }
  });

  return NextResponse.json(result);
}

const postSchema = z.discriminatedUnion("isGroup", [
  z.object({
    isGroup: z.literal(false),
    userId: z.string().min(1),
  }),
  z.object({
    isGroup: z.literal(true),
    name: z.string().min(1, "Group name is required").max(50),
    userIds: z.array(z.string()).min(2, "At least 2 members required"),
    avatar: z.string().url().optional(),
  }),
]);

// POST /api/conversations — create DM or group
export async function POST(req: Request) {
  const currentUser = await getCurrentUser();
  if (!currentUser) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  // Default isGroup to false if not provided
  const withDefault = { isGroup: false, ...(body as object) };
  const parsed = postSchema.safeParse(withDefault);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Invalid input" }, { status: 400 });
  }

  if (!parsed.data.isGroup) {
    // 1-to-1 DM
    const { userId } = parsed.data;
    if (userId === currentUser.id) {
      return NextResponse.json({ error: "Cannot message yourself" }, { status: 400 });
    }

    // Check for existing non-group conversation between these two users
    const existing = await dbc.conversation.findFirst({
      where: {
        isGroup: false,
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
        isGroup: false,
        createdBy: currentUser.id,
        participants: {
          create: [
            { userId: currentUser.id, isAdmin: false },
            { userId, isAdmin: false },
          ],
        },
      },
      select: { id: true },
    });

    return NextResponse.json({ id: conversation.id }, { status: 201 });
  } else {
    // Group conversation
    const { name, userIds, avatar } = parsed.data;

    // Deduplicate and exclude self (self added separately as admin)
    const memberIds = [...new Set(userIds.filter((id) => id !== currentUser.id))];
    if (memberIds.length < 2) {
      return NextResponse.json({ error: "At least 2 other members required" }, { status: 400 });
    }

    const conversation = await dbc.conversation.create({
      data: {
        isGroup: true,
        name,
        avatar: avatar ?? null,
        createdBy: currentUser.id,
        participants: {
          create: [
            { userId: currentUser.id, isAdmin: true }, // creator = admin
            ...memberIds.map((userId: string) => ({ userId, isAdmin: false })),
          ],
        },
      },
      select: { id: true },
    });

    return NextResponse.json({ id: conversation.id }, { status: 201 });
  }
}
