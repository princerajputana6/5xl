import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { requireApiPermission } from "@/server/api-guard";
import { adminBrandSchema } from "@/lib/validators/cms";
import { listBrandsAdmin, createBrand } from "@/server/services/brand.service";
import { AdminError } from "@/server/services/admin.service";

export async function GET() {
  const guard = await requireApiPermission("cms:write");
  if (!guard.ok) return guard.response;
  const rows = await listBrandsAdmin();
  return NextResponse.json({ rows });
}

export async function POST(req: Request) {
  const guard = await requireApiPermission("cms:write");
  if (!guard.ok) return guard.response;

  const parsed = adminBrandSchema.safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid brand." },
      { status: 422 }
    );
  }

  try {
    const id = await createBrand(parsed.data);
    revalidatePath("/brands");
    return NextResponse.json({ id });
  } catch (err) {
    if (err instanceof AdminError) {
      return NextResponse.json({ error: err.message }, { status: err.status });
    }
    console.error("[admin/brands] create failed", err);
    return NextResponse.json({ error: "Could not create brand." }, { status: 500 });
  }
}
