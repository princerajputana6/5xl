import { NextResponse } from "next/server";
import { z } from "zod";
import { requireApiPermission } from "@/server/api-guard";
import { adminCouponSchema } from "@/lib/validators/coupon";
import { updateCoupon, setCouponActive } from "@/server/services/coupon.service";
import { HttpError } from "@/server/errors";

const toggleSchema = z.object({ setActive: z.boolean() });

/**
 * PATCH /api/admin/coupons/[id]
 *  - `{ setActive }` → enable/disable
 *  - full coupon body → edit
 */
export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const guard = await requireApiPermission("coupons:write");
  if (!guard.ok) return guard.response;

  const { id } = await params;
  const body = await req.json().catch(() => ({}));

  const toggle = toggleSchema.safeParse(body);
  if (toggle.success) {
    await setCouponActive(id, toggle.data.setActive);
    return NextResponse.json({ ok: true });
  }

  const parsed = adminCouponSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid coupon." },
      { status: 422 }
    );
  }

  try {
    await updateCoupon(id, parsed.data);
    return NextResponse.json({ ok: true });
  } catch (err) {
    if (err instanceof HttpError) {
      return NextResponse.json({ error: err.message }, { status: err.status });
    }
    console.error("[admin/coupons] update failed", err);
    return NextResponse.json({ error: "Could not update coupon." }, { status: 500 });
  }
}
