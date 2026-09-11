import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { requireApiPermission } from "@/server/api-guard";
import { reorderSchema } from "@/lib/validators/cms";
import { reorderCategories } from "@/server/services/category.service";

/** PATCH /api/admin/categories/reorder — persist a new display order. */
export async function PATCH(req: Request) {
  const guard = await requireApiPermission("cms:write");
  if (!guard.ok) return guard.response;

  const parsed = reorderSchema.safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid order payload." }, { status: 422 });
  }

  await reorderCategories(parsed.data.items);
  revalidatePath("/");
  revalidatePath("/products");
  return NextResponse.json({ ok: true });
}
