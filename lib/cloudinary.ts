import { v2 as cloudinary } from "cloudinary";

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

export function uploadToCloudinary(
  buffer: Buffer,
  folder: string
): Promise<string> {
  return new Promise((resolve, reject) => {
    cloudinary.uploader
      .upload_stream(
        {
          folder,
          resource_type: "image",
          transformation: [{ quality: "auto:good", fetch_format: "auto" }],
        },
        (err, result) => {
          if (err || !result) reject(err ?? new Error("Upload failed"));
          else resolve(result.secure_url);
        }
      )
      .end(buffer);
  });
}

export function uploadMediaToCloudinary(
  buffer: Buffer,
  folder: string,
  resourceType: "image" | "video" = "image"
): Promise<string> {
  return new Promise((resolve, reject) => {
    cloudinary.uploader
      .upload_stream(
        {
          folder,
          resource_type: resourceType,
          ...(resourceType === "image"
            ? { transformation: [{ quality: "auto:good", fetch_format: "auto" }] }
            : { transformation: [{ quality: "auto" }] }),
        },
        (err, result) => {
          if (err || !result) reject(err ?? new Error("Upload failed"));
          else resolve(result.secure_url);
        }
      )
      .end(buffer);
  });
}

export function deleteFromCloudinary(publicId: string, resourceType: "image" | "video" = "image") {
  return cloudinary.uploader.destroy(publicId, { resource_type: resourceType });
}

export function extractPublicId(url: string): string {
  // https://res.cloudinary.com/cloud/image/upload/v123/rivora/stories/abc.jpg → rivora/stories/abc
  const parts = url.split("/upload/");
  if (parts.length < 2) return url;
  const withoutVersion = parts[1].replace(/^v\d+\//, "");
  return withoutVersion.replace(/\.[^.]+$/, "");
}

export default cloudinary;
