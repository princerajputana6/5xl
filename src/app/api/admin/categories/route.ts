import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { requireApiPermission } from "@/server/api-guard";
import { adminCategorySchema } from "@/lib/validators/cms";
import { listCategoriesAdmin, createCategory } from "@/server/services/category.service";
import { AdminError } from "@/server/services/admin.service";

/** GET /api/admin/categories — list all categories with product counts. */
export async function GET() {
  const guard = await requireApiPermission("cms:write");
  if (!guard.ok) return guard.response;
  const rows = await listCategoriesAdmin();
  return NextResponse.json({ rows });
}

/** POST /api/admin/categories — create a category. */
export async function POST(req: Request) {
  const guard = await requireApiPermission("cms:write");
  if (!guard.ok) return guard.response;

  const parsed = adminCategorySchema.safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid category." },
      { status: 422 }
    );
  }

  try {
    const id = await createCategory(parsed.data);
    revalidatePath("/");
    revalidatePath("/products");
    return NextResponse.json({ id });
  } catch (err) {
    if (err instanceof AdminError) {
      return NextResponse.json({ error: err.message }, { status: err.status });
    }
    console.error("[admin/categories] create failed", err);
    return NextResponse.json({ error: "Could not create category." }, { status: 500 });
  }
}
