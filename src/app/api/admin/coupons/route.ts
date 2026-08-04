import { NextResponse } from "next/server";
import { requireApiPermission } from "@/server/api-guard";
import { adminCouponSchema } from "@/lib/validators/coupon";
import { createCoupon } from "@/server/services/coupon.service";
import { HttpError } from "@/server/errors";

/** POST /api/admin/coupons — create a coupon. */
export async function POST(req: Request) {
  const guard = await requireApiPermission("coupons:write");
  if (!guard.ok) return guard.response;

  const parsed = adminCouponSchema.safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid coupon." },
      { status: 422 }
    );
  }

  try {
    const id = await createCoupon(parsed.data);
    return NextResponse.json({ id });
  } catch (err) {
    if (err instanceof HttpError) {
      return NextResponse.json({ error: err.message }, { status: err.status });
    }
    console.error("[admin/coupons] create failed", err);
    return NextResponse.json({ error: "Could not create coupon." }, { status: 500 });
  }
}
