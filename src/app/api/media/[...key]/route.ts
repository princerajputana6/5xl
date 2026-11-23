import { getCloudflareContext } from "@opennextjs/cloudflare";

/**
 * Serves uploaded media from the Cloudflare R2 `MEDIA` bucket, same-origin, at
 * `/api/media/<key>`. Admin uploads write to R2 and store this URL on the
 * product / CMS record.
 */
interface R2ObjectLike {
  body: ReadableStream | null;
  httpMetadata?: { contentType?: string };
  httpEtag: string;
}
interface R2BucketGet {
  get(key: string): Promise<R2ObjectLike | null>;
}

export async function GET(
  _req: Request,
  ctx: { params: Promise<{ key: string[] }> }
) {
  const { key } = await ctx.params;
  const objectKey = key.map((k) => decodeURIComponent(k)).join("/");

  let bucket: R2BucketGet | null = null;
  try {
    bucket = (getCloudflareContext().env as unknown as { MEDIA?: R2BucketGet }).MEDIA ?? null;
  } catch {
    bucket = null;
  }
  if (!bucket) return new Response("Media storage unavailable.", { status: 503 });

  const object = await bucket.get(objectKey);
  if (!object || !object.body) return new Response("Not found.", { status: 404 });

  return new Response(object.body, {
    headers: {
      "content-type": object.httpMetadata?.contentType ?? "application/octet-stream",
      "cache-control": "public, max-age=31536000, immutable",
      etag: object.httpEtag,
    },
  });
}
