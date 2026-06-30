import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { db } from "@/lib/db";
import { successResponse, errorResponse } from "@/utils/api";

const dbc = db as any; // eslint-disable-line @typescript-eslint/no-explicit-any

// POST /api/stories/[id]/view — track a view (idempotent)
export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession();
  if (!session?.user) {
    return NextResponse.json(errorResponse("Unauthorized"), { status: 401 });
  }

  const { id } = await params;

  const story = await dbc.story.findUnique({ where: { id }, select: { id: true, userId: true, expiresAt: true } });
  if (!story) return NextResponse.json(errorResponse("Not found"), { status: 404 });
  if (new Date(story.expiresAt) < new Date()) {
    return NextResponse.json(errorResponse("Story expired"), { status: 410 });
  }
  // Own story — don't count self-view
  if (story.userId === session.user.id) {
    return NextResponse.json(successResponse({ counted: false }));
  }

  const existing = await dbc.storyView.findUnique({
    where: { storyId_viewerId: { storyId: id, viewerId: session.user.id } },
  });

  if (!existing) {
    await Promise.all([
      dbc.storyView.create({ data: { storyId: id, viewerId: session.user.id } }),
      dbc.story.update({ where: { id }, data: { viewCount: { increment: 1 } } }),
    ]);
  }

  return NextResponse.json(successResponse({ counted: !existing }));
}
