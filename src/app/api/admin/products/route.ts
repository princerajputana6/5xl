import { NextResponse } from "next/server";
import { requireApiPermission } from "@/server/api-guard";
import { adminProductSchema } from "@/lib/validators/admin";
import { createProduct, AdminError } from "@/server/services/admin.service";

/** POST /api/admin/products — create a product. */
export async function POST(req: Request) {
  const guard = await requireApiPermission("products:write");
  if (!guard.ok) return guard.response;

  const parsed = adminProductSchema.safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid product." },
      { status: 422 }
    );
  }

  try {
    const id = await createProduct(parsed.data);
    return NextResponse.json({ id });
  } catch (err) {
    if (err instanceof AdminError) {
      return NextResponse.json({ error: err.message }, { status: err.status });
    }
    console.error("[admin/products] create failed", err);
    return NextResponse.json({ error: "Could not create product." }, { status: 500 });
  }
}
