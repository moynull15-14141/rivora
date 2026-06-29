import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { uploadToCloudinary } from "@/lib/cloudinary";
import { successResponse, errorResponse } from "@/utils/api";

const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"];
const MAX_BYTES = 5 * 1024 * 1024;

export async function POST(request: NextRequest) {
  const session = await getSession();
  if (!session?.user) {
    return NextResponse.json(errorResponse("Unauthorized"), { status: 401 });
  }

  if (!process.env.CLOUDINARY_CLOUD_NAME || !process.env.CLOUDINARY_API_KEY || !process.env.CLOUDINARY_API_SECRET) {
    return NextResponse.json(
      errorResponse("Image upload is not configured. Please contact the administrator."),
      { status: 503 }
    );
  }

  let formData: FormData;
  try {
    formData = await request.formData();
  } catch {
    return NextResponse.json(errorResponse("Invalid form data"), { status: 400 });
  }

  const file = formData.get("file") as File | null;
  const folder = (formData.get("folder") as string | null) ?? "rivora/misc";

  if (!file) {
    return NextResponse.json(errorResponse("No file provided"), { status: 400 });
  }
  if (!ALLOWED_TYPES.includes(file.type)) {
    return NextResponse.json(
      errorResponse("Only JPEG, PNG, WebP or GIF images are allowed"),
      { status: 400 }
    );
  }
  if (file.size > MAX_BYTES) {
    return NextResponse.json(
      errorResponse("File size must be under 5 MB"),
      { status: 400 }
    );
  }

  try {
    const buffer = Buffer.from(await file.arrayBuffer());
    const url = await uploadToCloudinary(buffer, folder);
    return NextResponse.json(successResponse({ url }));
  } catch (err) {
    console.error("[upload] Cloudinary error:", err);
    return NextResponse.json(
      errorResponse("Image upload failed. Please try again."),
      { status: 502 }
    );
  }
}
