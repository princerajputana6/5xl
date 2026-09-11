import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { requireApiPermission } from "@/server/api-guard";
import { homeContentSchema } from "@/lib/validators/cms";
import { saveHomeContent } from "@/server/services/home.service";

/** PUT /api/admin/home — save the homepage CMS content. */
export async function PUT(req: Request) {
  const guard = await requireApiPermission("cms:write");
  if (!guard.ok) return guard.response;

  const parsed = homeContentSchema.safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid content." },
      { status: 422 }
    );
  }

  await saveHomeContent(parsed.data);
  revalidatePath("/");
  return NextResponse.json({ ok: true });
}
