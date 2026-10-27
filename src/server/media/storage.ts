import crypto from "node:crypto";
import { writeFile, mkdir } from "node:fs/promises";
import path from "node:path";
import { env } from "@/env";

/**
 * Image storage abstraction.
 *
 * When Cloudinary credentials are present we upload there (signed uploads) and
 * return the CDN URL. Otherwise we fall back to writing into `public/uploads`
 * and return a same-origin `/uploads/…` path — so image management works
 * end-to-end with no keys, and swaps to Cloudinary automatically once the env
 * vars are set. (The local fallback needs a writable disk / long-running Node
 * server; on serverless, configure Cloudinary.)
 */

const CLOUD_NAME = env.CLOUDINARY_CLOUD_NAME?.trim() || "";
const API_KEY = env.CLOUDINARY_API_KEY?.trim() || "";
const API_SECRET = env.CLOUDINARY_API_SECRET?.trim() || "";

export const isCloudinary = Boolean(CLOUD_NAME && API_KEY && API_SECRET);
export const mediaMode: "cloudinary" | "local" = isCloudinary ? "cloudinary" : "local";

export const MAX_UPLOAD_BYTES = 5 * 1024 * 1024; // 5MB (images)
export const MAX_VIDEO_BYTES = 64 * 1024 * 1024; // 64MB (videos)

const EXT_BY_MIME: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/avif": "avif",
  "image/gif": "gif",
};

const EXT_BY_VIDEO_MIME: Record<string, string> = {
  "video/mp4": "mp4",
  "video/webm": "webm",
  "video/quicktime": "mov",
  "video/ogg": "ogv",
};

export function isVideoMime(type: string): boolean {
  return Boolean(EXT_BY_VIDEO_MIME[type]) || type.startsWith("video/");
}

export class UploadError extends Error {
  status: number;
  constructor(message: string, status = 400) {
    super(message);
    this.status = status;
  }
}

export function assertValidImage(file: { type: string; size: number }) {
  if (!EXT_BY_MIME[file.type]) {
    throw new UploadError("Unsupported image type. Use JPG, PNG, WebP, AVIF or GIF.", 415);
  }
  if (file.size > MAX_UPLOAD_BYTES) {
    throw new UploadError("Image is too large (max 5MB).", 413);
  }
}

export function assertValidVideo(file: { type: string; size: number }) {
  if (!EXT_BY_VIDEO_MIME[file.type]) {
    throw new UploadError("Unsupported video type. Use MP4, WebM, MOV or OGG.", 415);
  }
  if (file.size > MAX_VIDEO_BYTES) {
    throw new UploadError("Video is too large (max 64MB).", 413);
  }
}

/** Upload a single image and return its public URL. */
export async function uploadImage(file: File): Promise<{ url: string }> {
  assertValidImage(file);
  const buffer = Buffer.from(await file.arrayBuffer());
  if (isCloudinary) return uploadToCloudinary(buffer, file.type, "image");
  return uploadToLocal(buffer, EXT_BY_MIME[file.type] ?? "bin");
}

/** Upload a single video and return its public URL. */
export async function uploadVideo(file: File): Promise<{ url: string }> {
  assertValidVideo(file);
  const buffer = Buffer.from(await file.arrayBuffer());
  if (isCloudinary) return uploadToCloudinary(buffer, file.type, "video");
  return uploadToLocal(buffer, EXT_BY_VIDEO_MIME[file.type] ?? "bin");
}

/** Upload any supported media (image or video), branching on the MIME type. */
export async function uploadMedia(file: File): Promise<{ url: string; kind: "image" | "video" }> {
  if (isVideoMime(file.type)) {
    const { url } = await uploadVideo(file);
    return { url, kind: "video" };
  }
  const { url } = await uploadImage(file);
  return { url, kind: "image" };
}

async function uploadToLocal(buffer: Buffer, ext: string): Promise<{ url: string }> {
  const name = `${Date.now()}-${crypto.randomBytes(6).toString("hex")}.${ext}`;
  const dir = path.join(process.cwd(), "public", "uploads");
  await mkdir(dir, { recursive: true });
  await writeFile(path.join(dir, name), buffer);
  return { url: `/uploads/${name}` };
}

async function uploadToCloudinary(
  buffer: Buffer,
  mime: string,
  resourceType: "image" | "video"
): Promise<{ url: string }> {
  const timestamp = Math.floor(Date.now() / 1000);
  const folder = "5xl";

  // Signature = sha1 of the sorted, &-joined params to sign + api_secret.
  const toSign = `folder=${folder}&timestamp=${timestamp}`;
  const signature = crypto
    .createHash("sha1")
    .update(toSign + API_SECRET)
    .digest("hex");

  const form = new FormData();
  form.append("file", new Blob([new Uint8Array(buffer)], { type: mime }));
  form.append("api_key", API_KEY);
  form.append("timestamp", String(timestamp));
  form.append("folder", folder);
  form.append("signature", signature);

  const res = await fetch(
    `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/${resourceType}/upload`,
    { method: "POST", body: form }
  );
  if (!res.ok) {
    const detail = await res.text().catch(() => "");
    throw new UploadError(`Cloudinary upload failed (${res.status}): ${detail}`, 502);
  }
  const data = (await res.json()) as { secure_url?: string; url?: string };
  const url = data.secure_url ?? data.url;
  if (!url) throw new UploadError("Cloudinary returned no URL.", 502);
  return { url };
}
