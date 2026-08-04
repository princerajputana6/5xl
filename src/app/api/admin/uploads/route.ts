import { NextResponse } from "next/server";
import { requireApiPermission } from "@/server/api-guard";
import { uploadImage, UploadError, mediaMode } from "@/server/media/storage";

// Uploads read the raw request body; keep this on the Node runtime.
export const runtime = "nodejs";

/** POST /api/admin/uploads — multipart image upload. Returns { url }. */
export async function POST(req: Request) {
  const guard = await requireApiPermission("products:write");
  if (!guard.ok) return guard.response;

  let form: FormData;
  try {
    form = await req.formData();
  } catch {
    return NextResponse.json({ error: "Expected multipart form data." }, { status: 400 });
  }

  const file = form.get("file");
  if (!(file instanceof File)) {
    return NextResponse.json({ error: "No file provided." }, { status: 400 });
  }

  try {
    const { url } = await uploadImage(file);
    return NextResponse.json({ url, mode: mediaMode });
  } catch (err) {
    if (err instanceof UploadError) {
      return NextResponse.json({ error: err.message }, { status: err.status });
    }
    console.error("[admin/uploads] failed", err);
    return NextResponse.json({ error: "Upload failed. Please try again." }, { status: 500 });
  }
}
