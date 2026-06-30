import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { deleteFromCloudinary, extractPublicId } from "@/lib/cloudinary";

const dbc = db as any; // eslint-disable-line @typescript-eslint/no-explicit-any

// GET /api/cron/cleanup-stories
// Called by Vercel Cron (every hour). Auth via Authorization: Bearer <CRON_SECRET>.
export async function GET(request: NextRequest) {
  const auth = request.headers.get("authorization");
  if (!process.env.CRON_SECRET || auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const expired = await dbc.story.findMany({
    where: { expiresAt: { lte: new Date() } },
    select: { id: true, mediaUrl: true, mediaType: true },
  });

  if (expired.length === 0) {
    return NextResponse.json({ deleted: 0 });
  }

  // Delete media from Cloudinary
  await Promise.allSettled(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    expired.map((s: any) => {
      const publicId = extractPublicId(s.mediaUrl);
      return deleteFromCloudinary(publicId, s.mediaType as "image" | "video");
    })
  );

  // Delete stories from DB (cascade deletes StoryViews)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const ids = expired.map((s: any) => s.id);
  await dbc.story.deleteMany({ where: { id: { in: ids } } });

  return NextResponse.json({ deleted: ids.length });
}
