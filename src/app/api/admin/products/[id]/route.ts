import { NextResponse } from "next/server";
import { z } from "zod";
import { requireApiPermission } from "@/server/api-guard";
import { adminProductSchema, PRODUCT_STATUS_VALUES } from "@/lib/validators/admin";
import { updateProduct, setProductStatus, AdminError } from "@/server/services/admin.service";

const statusOnlySchema = z.object({ setStatus: z.enum(PRODUCT_STATUS_VALUES) });

/**
 * PATCH /api/admin/products/[id]
 *  - `{ setStatus }` → quick status change (used by the list row menu)
 *  - full product body → full edit
 */
export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const guard = await requireApiPermission("products:write");
  if (!guard.ok) return guard.response;

  const { id } = await params;
  const body = await req.json().catch(() => ({}));

  const statusOnly = statusOnlySchema.safeParse(body);
  if (statusOnly.success) {
    await setProductStatus(id, statusOnly.data.setStatus);
    return NextResponse.json({ ok: true });
  }

  const parsed = adminProductSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid product." },
      { status: 422 }
    );
  }

  try {
    await updateProduct(id, parsed.data);
    return NextResponse.json({ ok: true });
  } catch (err) {
    if (err instanceof AdminError) {
      return NextResponse.json({ error: err.message }, { status: err.status });
    }
    console.error("[admin/products] update failed", err);
    return NextResponse.json({ error: "Could not update product." }, { status: 500 });
  }
}
