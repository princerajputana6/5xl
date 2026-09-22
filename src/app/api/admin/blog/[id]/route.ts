import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { requireApiPermission } from "@/server/api-guard";
import { blogPostSchema } from "@/lib/validators/blog";
import { updatePost, deletePost } from "@/server/services/blog.service";
import { AdminError } from "@/server/services/admin.service";

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const guard = await requireApiPermission("cms:write");
  if (!guard.ok) return guard.response;

  const { id } = await params;
  const parsed = blogPostSchema.safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid post." },
      { status: 422 }
    );
  }

  try {
    await updatePost(id, parsed.data);
    revalidatePath("/blog");
    revalidatePath(`/blog/${parsed.data.slug}`);
    return NextResponse.json({ ok: true });
  } catch (err) {
    if (err instanceof AdminError) {
      return NextResponse.json({ error: err.message }, { status: err.status });
    }
    console.error("[admin/blog] update failed", err);
    return NextResponse.json({ error: "Could not update post." }, { status: 500 });
  }
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const guard = await requireApiPermission("cms:write");
  if (!guard.ok) return guard.response;

  const { id } = await params;
  try {
    await deletePost(id);
    revalidatePath("/blog");
    return NextResponse.json({ ok: true });
  } catch (err) {
    if (err instanceof AdminError) {
      return NextResponse.json({ error: err.message }, { status: err.status });
    }
    console.error("[admin/blog] delete failed", err);
    return NextResponse.json({ error: "Could not delete post." }, { status: 500 });
  }
}
