import { and, asc, desc, eq, gte, isNull, lte, ne, or } from "drizzle-orm";
import { db } from "@/server/db";
import { coupons, type CouponRow } from "@/server/schema";
import { HttpError } from "@/server/errors";
import type { AdminCouponInput } from "@/lib/validators/coupon";

export type AppliedCoupon = {
  code: string;
  discount: number;
  label: string;
};

export type PublicOffer = {
  code: string;
  description: string;
  type: "percent" | "flat";
  value: number;
  minOrder: number;
};

/** Currently-live coupons, for the offers strip on product pages. */
export async function listPublicOffers(limit = 3): Promise<PublicOffer[]> {
  const now = new Date();
  const docs = await db()
    .select()
    .from(coupons)
    .where(
      and(
        eq(coupons.isActive, true),
        or(isNull(coupons.startsAt), lte(coupons.startsAt, now)),
        or(isNull(coupons.expiresAt), gte(coupons.expiresAt, now))
      )
    )
    .orderBy(asc(coupons.minOrder))
    .all();

  return docs
    .filter((c) => !c.usageLimit || (c.usedCount ?? 0) < c.usageLimit)
    .slice(0, limit)
    .map((c) => ({
      code: c.code,
      description: c.description ?? "",
      type: c.type as "percent" | "flat",
      value: c.value,
      minOrder: c.minOrder ?? 0,
    }));
}

/**
 * Validate a coupon against a server-computed subtotal and return the discount.
 * Throws HttpError with a user-facing message when invalid.
 */
export async function validateCoupon(
  rawCode: string,
  subtotal: number
): Promise<{ coupon: CouponRow; discount: number; label: string }> {
  const code = rawCode.trim().toUpperCase();
  const coupon = await db().select().from(coupons).where(eq(coupons.code, code)).get();

  if (!coupon || !coupon.isActive) {
    throw new HttpError("That coupon code isn't valid.", 404);
  }

  const now = new Date();
  if (coupon.startsAt && now < new Date(coupon.startsAt)) {
    throw new HttpError("This coupon isn't active yet.", 400);
  }
  if (coupon.expiresAt && now > new Date(coupon.expiresAt)) {
    throw new HttpError("This coupon has expired.", 400);
  }
  if (coupon.usageLimit && coupon.usedCount >= coupon.usageLimit) {
    throw new HttpError("This coupon has reached its usage limit.", 400);
  }
  if (coupon.minOrder && subtotal < coupon.minOrder) {
    throw new HttpError(
      `Add ₹${coupon.minOrder - subtotal} more to use this coupon (min ₹${coupon.minOrder}).`,
      400
    );
  }

  let discount =
    coupon.type === "percent"
      ? Math.round((subtotal * coupon.value) / 100)
      : coupon.value;

  if (coupon.type === "percent" && coupon.maxDiscount) {
    discount = Math.min(discount, coupon.maxDiscount);
  }
  discount = Math.min(discount, subtotal); // never exceed the order

  const label =
    coupon.type === "percent"
      ? `${coupon.value}% off${coupon.maxDiscount ? ` (up to ₹${coupon.maxDiscount})` : ""}`
      : `₹${coupon.value} off`;

  return { coupon, discount, label };
}

/** Preview-only: validate and return the applied summary. */
export async function applyCoupon(code: string, subtotal: number): Promise<AppliedCoupon> {
  const { coupon, discount, label } = await validateCoupon(code, subtotal);
  return { code: coupon.code, discount, label };
}

/** Increment a coupon's usage counter (called once payment is confirmed). */
export async function incrementCouponUsage(code: string): Promise<void> {
  const normalized = code.trim().toUpperCase();
  const row = await db()
    .select({ used: coupons.usedCount })
    .from(coupons)
    .where(eq(coupons.code, normalized))
    .get();
  if (!row) return;
  await db()
    .update(coupons)
    .set({ usedCount: (row.used ?? 0) + 1 })
    .where(eq(coupons.code, normalized));
}

// ---- admin ------------------------------------------------------------

export type AdminCouponRow = {
  id: string;
  code: string;
  description: string;
  type: "percent" | "flat";
  value: number;
  minOrder: number;
  maxDiscount: number;
  usageLimit: number;
  usedCount: number;
  startsAt: string | null;
  expiresAt: string | null;
  isActive: boolean;
};

function toRow(c: CouponRow): AdminCouponRow {
  return {
    id: c.id,
    code: c.code,
    description: c.description ?? "",
    type: c.type as "percent" | "flat",
    value: c.value,
    minOrder: c.minOrder ?? 0,
    maxDiscount: c.maxDiscount ?? 0,
    usageLimit: c.usageLimit ?? 0,
    usedCount: c.usedCount ?? 0,
    startsAt: c.startsAt ? new Date(c.startsAt).toISOString() : null,
    expiresAt: c.expiresAt ? new Date(c.expiresAt).toISOString() : null,
    isActive: Boolean(c.isActive),
  };
}

export async function listCoupons(): Promise<AdminCouponRow[]> {
  const docs = await db().select().from(coupons).orderBy(desc(coupons.createdAt)).all();
  return docs.map(toRow);
}

function mapInput(input: AdminCouponInput) {
  return {
    code: input.code.trim().toUpperCase(),
    description: input.description ?? "",
    type: input.type,
    value: input.value,
    minOrder: input.minOrder ?? 0,
    maxDiscount: input.maxDiscount ?? 0,
    usageLimit: input.usageLimit ?? 0,
    startsAt: input.startsAt ? new Date(input.startsAt) : null,
    expiresAt: input.expiresAt ? new Date(input.expiresAt) : null,
    isActive: input.isActive ?? true,
  };
}

export async function createCoupon(input: AdminCouponInput): Promise<string> {
  const data = mapInput(input);
  const existing = await db()
    .select({ id: coupons.id })
    .from(coupons)
    .where(eq(coupons.code, data.code))
    .get();
  if (existing) throw new HttpError("A coupon with that code already exists.", 409);
  const [row] = await db().insert(coupons).values(data).returning({ id: coupons.id });
  return row.id;
}

export async function updateCoupon(id: string, input: AdminCouponInput): Promise<void> {
  const data = mapInput(input);
  const clash = await db()
    .select({ id: coupons.id })
    .from(coupons)
    .where(and(eq(coupons.code, data.code), ne(coupons.id, id)))
    .get();
  if (clash) throw new HttpError("A coupon with that code already exists.", 409);
  const res = await db().update(coupons).set(data).where(eq(coupons.id, id)).returning({ id: coupons.id });
  if (res.length === 0) throw new HttpError("Coupon not found.", 404);
}

export async function setCouponActive(id: string, isActive: boolean): Promise<void> {
  await db().update(coupons).set({ isActive }).where(eq(coupons.id, id));
}
