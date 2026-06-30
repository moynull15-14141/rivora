import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { db } from "@/lib/db";
import { deleteFromCloudinary, extractPublicId } from "@/lib/cloudinary";
import { successResponse, errorResponse } from "@/utils/api";

const dbc = db as any; // eslint-disable-line @typescript-eslint/no-explicit-any

// GET /api/stories/[id] — single story detail
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession();
  if (!session?.user) {
    return NextResponse.json(errorResponse("Unauthorized"), { status: 401 });
  }

  const { id } = await params;

  const story = await dbc.story.findUnique({
    where: { id },
    include: {
      user: { select: { id: true, name: true, username: true, image: true } },
      views: { where: { viewerId: session.user.id }, select: { id: true } },
    },
  });

  if (!story) return NextResponse.json(errorResponse("Not found"), { status: 404 });
  if (new Date(story.expiresAt) < new Date()) {
    return NextResponse.json(errorResponse("Story expired"), { status: 410 });
  }

  return NextResponse.json(successResponse({ ...story, seen: story.views.length > 0 }));
}

// DELETE /api/stories/[id] — owner only
export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession();
  if (!session?.user) {
    return NextResponse.json(errorResponse("Unauthorized"), { status: 401 });
  }

  const { id } = await params;

  const story = await dbc.story.findUnique({ where: { id } });
  if (!story) return NextResponse.json(errorResponse("Not found"), { status: 404 });
  if (story.userId !== session.user.id) {
    return NextResponse.json(errorResponse("Forbidden"), { status: 403 });
  }

  // Delete media from Cloudinary
  try {
    const publicId = extractPublicId(story.mediaUrl);
    await deleteFromCloudinary(publicId, story.mediaType as "image" | "video");
  } catch {
    // Don't block deletion if Cloudinary fails
  }

  await dbc.story.delete({ where: { id } });

  return NextResponse.json(successResponse({ ok: true }));
}
