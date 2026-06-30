import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getSession } from "@/lib/session";
import { db } from "@/lib/db";
import { successResponse, errorResponse } from "@/utils/api";

const dbc = db as any; // eslint-disable-line @typescript-eslint/no-explicit-any

const createSchema = z.object({
  mediaUrl: z.string().url().or(z.literal("")),
  mediaType: z.enum(["image", "video"]),
  caption: z.string().max(500).optional(),
  backgroundColor: z.string().optional(),
});

// GET /api/stories — active stories from self + friends, grouped by user
export async function GET() {
  const session = await getSession();
  if (!session?.user) {
    return NextResponse.json(errorResponse("Unauthorized"), { status: 401 });
  }

  const friendships = await db.friend.findMany({
    where: {
      status: "accepted",
      OR: [{ userId: session.user.id }, { friendId: session.user.id }],
    },
    select: { userId: true, friendId: true },
  });
  const friendIds = friendships.map((f) =>
    f.userId === session.user.id ? f.friendId : f.userId
  );

  const stories = await dbc.story.findMany({
    where: {
      expiresAt: { gt: new Date() },
      userId: { in: [session.user.id, ...friendIds] },
    },
    include: {
      user: { select: { id: true, name: true, username: true, image: true } },
      views: {
        where: { viewerId: session.user.id },
        select: { id: true },
      },
    },
    orderBy: { createdAt: "asc" },
  });

  // Group by userId, own stories first
  const map = new Map<string, { user: unknown; stories: unknown[]; hasUnseen: boolean }>();
  for (const s of stories) {
    const uid = s.userId as string;
    if (!map.has(uid)) {
      map.set(uid, { user: s.user, stories: [], hasUnseen: false });
    }
    const group = map.get(uid)!;
    const seen = (s.views as unknown[]).length > 0;
    if (!seen) group.hasUnseen = true;
    group.stories.push({ ...s, seen, views: undefined });
  }

  // Own group first, then others (unseen first)
  const groups = Array.from(map.values()).sort((a, b) => {
    const aIsOwn = (a.user as { id: string }).id === session.user.id;
    const bIsOwn = (b.user as { id: string }).id === session.user.id;
    if (aIsOwn) return -1;
    if (bIsOwn) return 1;
    if (a.hasUnseen && !b.hasUnseen) return -1;
    if (!a.hasUnseen && b.hasUnseen) return 1;
    return 0;
  });

  return NextResponse.json(successResponse(groups));
}

// POST /api/stories — create new story
export async function POST(request: NextRequest) {
  const session = await getSession();
  if (!session?.user) {
    return NextResponse.json(errorResponse("Unauthorized"), { status: 401 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(errorResponse("Invalid JSON"), { status: 400 });
  }

  const parsed = createSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      errorResponse(parsed.error.issues[0]?.message ?? "Invalid input"),
      { status: 400 }
    );
  }

  const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);

  const story = await dbc.story.create({
    data: {
      userId: session.user.id,
      mediaUrl: parsed.data.mediaUrl,
      mediaType: parsed.data.mediaType,
      caption: parsed.data.caption ?? null,
      backgroundColor: parsed.data.backgroundColor ?? null,
      expiresAt,
    },
    select: { id: true, mediaUrl: true, mediaType: true, caption: true, expiresAt: true, createdAt: true },
  });

  return NextResponse.json(successResponse(story), { status: 201 });
}
