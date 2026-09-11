import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { requireApiPermission } from "@/server/api-guard";
import { adminCategorySchema } from "@/lib/validators/cms";
import { updateCategory, deleteCategory } from "@/server/services/category.service";
import { AdminError } from "@/server/services/admin.service";

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const guard = await requireApiPermission("cms:write");
  if (!guard.ok) return guard.response;

  const { id } = await params;
  const parsed = adminCategorySchema.safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid category." },
      { status: 422 }
    );
  }

  try {
    await updateCategory(id, parsed.data);
    revalidatePath("/");
    revalidatePath("/products");
    return NextResponse.json({ ok: true });
  } catch (err) {
    if (err instanceof AdminError) {
      return NextResponse.json({ error: err.message }, { status: err.status });
    }
    console.error("[admin/categories] update failed", err);
    return NextResponse.json({ error: "Could not update category." }, { status: 500 });
  }
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const guard = await requireApiPermission("cms:write");
  if (!guard.ok) return guard.response;

  const { id } = await params;
  try {
    await deleteCategory(id);
    revalidatePath("/");
    revalidatePath("/products");
    return NextResponse.json({ ok: true });
  } catch (err) {
    if (err instanceof AdminError) {
      return NextResponse.json({ error: err.message }, { status: err.status });
    }
    console.error("[admin/categories] delete failed", err);
    return NextResponse.json({ error: "Could not delete category." }, { status: 500 });
  }
}
