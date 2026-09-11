import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { requireApiPermission } from "@/server/api-guard";
import { adminBrandSchema } from "@/lib/validators/cms";
import { updateBrand, deleteBrand } from "@/server/services/brand.service";
import { AdminError } from "@/server/services/admin.service";

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const guard = await requireApiPermission("cms:write");
  if (!guard.ok) return guard.response;

  const { id } = await params;
  const parsed = adminBrandSchema.safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid brand." },
      { status: 422 }
    );
  }

  try {
    await updateBrand(id, parsed.data);
    revalidatePath("/brands");
    return NextResponse.json({ ok: true });
  } catch (err) {
    if (err instanceof AdminError) {
      return NextResponse.json({ error: err.message }, { status: err.status });
    }
    console.error("[admin/brands] update failed", err);
    return NextResponse.json({ error: "Could not update brand." }, { status: 500 });
  }
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const guard = await requireApiPermission("cms:write");
  if (!guard.ok) return guard.response;

  const { id } = await params;
  try {
    await deleteBrand(id);
    revalidatePath("/brands");
    return NextResponse.json({ ok: true });
  } catch (err) {
    if (err instanceof AdminError) {
      return NextResponse.json({ error: err.message }, { status: err.status });
    }
    console.error("[admin/brands] delete failed", err);
    return NextResponse.json({ error: "Could not delete brand." }, { status: 500 });
  }
}
