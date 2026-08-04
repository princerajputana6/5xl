import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { applyCouponSchema } from "@/lib/validators/coupon";
import { priceCartItems } from "@/server/services/pricing";
import { applyCoupon } from "@/server/services/coupon.service";
import { computeAmounts } from "@/lib/cart-pricing";
import { HttpError } from "@/server/errors";

/**
 * POST /api/coupons/apply — preview a coupon against the current cart.
 * Returns the discount + resulting totals (all computed server-side).
 */
export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Please sign in to use a coupon." }, { status: 401 });
  }

  const parsed = applyCouponSchema.safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid request." },
      { status: 422 }
    );
  }

  try {
    const { subtotal } = await priceCartItems(parsed.data.items);
    const applied = await applyCoupon(parsed.data.code, subtotal);
    const amounts = computeAmounts(subtotal, applied.discount);
    return NextResponse.json({ ...applied, amounts });
  } catch (err) {
    if (err instanceof HttpError) {
      return NextResponse.json({ error: err.message }, { status: err.status });
    }
    console.error("[coupons/apply] failed", err);
    return NextResponse.json({ error: "Could not apply coupon." }, { status: 500 });
  }
}
