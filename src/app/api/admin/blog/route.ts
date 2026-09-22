import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { requireApiPermission } from "@/server/api-guard";
import { blogPostSchema } from "@/lib/validators/blog";
import { listPostsAdmin, createPost } from "@/server/services/blog.service";
import { AdminError } from "@/server/services/admin.service";

export async function GET() {
  const guard = await requireApiPermission("cms:write");
  if (!guard.ok) return guard.response;
  const rows = await listPostsAdmin();
  return NextResponse.json({ rows });
}

export async function POST(req: Request) {
  const guard = await requireApiPermission("cms:write");
  if (!guard.ok) return guard.response;

  const parsed = blogPostSchema.safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid post." },
      { status: 422 }
    );
  }

  try {
    const id = await createPost(parsed.data);
    revalidatePath("/blog");
    return NextResponse.json({ id });
  } catch (err) {
    if (err instanceof AdminError) {
      return NextResponse.json({ error: err.message }, { status: err.status });
    }
    console.error("[admin/blog] create failed", err);
    return NextResponse.json({ error: "Could not create post." }, { status: 500 });
  }
}
