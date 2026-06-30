import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { db } from "@/lib/db";
import { successResponse, errorResponse } from "@/utils/api";

const dbc = db as any; // eslint-disable-line @typescript-eslint/no-explicit-any

// GET /api/stories/[id]/viewers — who viewed (owner only)
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession();
  if (!session?.user) {
    return NextResponse.json(errorResponse("Unauthorized"), { status: 401 });
  }

  const { id } = await params;

  const story = await dbc.story.findUnique({ where: { id }, select: { userId: true } });
  if (!story) return NextResponse.json(errorResponse("Not found"), { status: 404 });
  if (story.userId !== session.user.id) {
    return NextResponse.json(errorResponse("Forbidden"), { status: 403 });
  }

  const viewers = await dbc.storyView.findMany({
    where: { storyId: id },
    include: {
      viewer: { select: { id: true, name: true, username: true, image: true } },
    },
    orderBy: { viewedAt: "desc" },
  });

  return NextResponse.json(successResponse(viewers));
}
