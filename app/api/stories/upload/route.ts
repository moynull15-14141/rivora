import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { uploadMediaToCloudinary } from "@/lib/cloudinary";
import { successResponse, errorResponse } from "@/utils/api";

const ALLOWED_IMAGE = ["image/jpeg", "image/png", "image/webp"];
const ALLOWED_VIDEO = ["video/mp4", "video/quicktime", "video/webm"];
const MAX_IMAGE_BYTES = 10 * 1024 * 1024;  // 10 MB
const MAX_VIDEO_BYTES = 100 * 1024 * 1024; // 100 MB

export async function POST(request: NextRequest) {
  const session = await getSession();
  if (!session?.user) {
    return NextResponse.json(errorResponse("Unauthorized"), { status: 401 });
  }

  let formData: FormData;
  try {
    formData = await request.formData();
  } catch {
    return NextResponse.json(errorResponse("Invalid form data"), { status: 400 });
  }

  const file = formData.get("file") as File | null;
  if (!file) return NextResponse.json(errorResponse("No file provided"), { status: 400 });

  const isImage = ALLOWED_IMAGE.includes(file.type);
  const isVideo = ALLOWED_VIDEO.includes(file.type);

  if (!isImage && !isVideo) {
    return NextResponse.json(
      errorResponse("Only JPEG/PNG/WebP images or MP4/MOV/WebM videos are allowed"),
      { status: 400 }
    );
  }

  const maxBytes = isImage ? MAX_IMAGE_BYTES : MAX_VIDEO_BYTES;
  if (file.size > maxBytes) {
    return NextResponse.json(
      errorResponse(`File too large. Max ${isImage ? "10 MB" : "100 MB"}.`),
      { status: 400 }
    );
  }

  try {
    const buffer = Buffer.from(await file.arrayBuffer());
    const resourceType = isImage ? "image" : "video";
    const url = await uploadMediaToCloudinary(buffer, "rivora/stories", resourceType);
    return NextResponse.json(successResponse({ url, mediaType: resourceType }));
  } catch (err) {
    console.error("[stories/upload] Cloudinary error:", err);
    return NextResponse.json(errorResponse("Upload failed. Please try again."), { status: 502 });
  }
}
