import { connectDB } from "@/server/db";
import { Coupon, type CouponDoc } from "@/server/models/Coupon";
import { HttpError } from "@/server/errors";
import type { AdminCouponInput } from "@/lib/validators/coupon";

export type AppliedCoupon = {
  code: string;
  discount: number;
  label: string;
};

/**
 * Validate a coupon against a server-computed subtotal and return the discount.
 * Throws HttpError with a user-facing message when invalid.
 */
export async function validateCoupon(
  rawCode: string,
  subtotal: number
): Promise<{ coupon: CouponDoc; discount: number; label: string }> {
  await connectDB();
  const code = rawCode.trim().toUpperCase();
  const coupon = await Coupon.findOne({ code });

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
  await connectDB();
  await Coupon.updateOne({ code: code.trim().toUpperCase() }, { $inc: { usedCount: 1 } });
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

function toRow(c: CouponDoc): AdminCouponRow {
  return {
    id: String(c._id),
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
  await connectDB();
  const docs = await Coupon.find({}).sort({ createdAt: -1 }).lean();
  return docs.map((d) => toRow(d as unknown as CouponDoc));
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
    startsAt: input.startsAt ? new Date(input.startsAt) : undefined,
    expiresAt: input.expiresAt ? new Date(input.expiresAt) : undefined,
    isActive: input.isActive ?? true,
  };
}

export async function createCoupon(input: AdminCouponInput): Promise<string> {
  await connectDB();
  const data = mapInput(input);
  const existing = await Coupon.findOne({ code: data.code }).select("_id").lean();
  if (existing) throw new HttpError("A coupon with that code already exists.", 409);
  const doc = await Coupon.create(data);
  return String(doc._id);
}

export async function updateCoupon(id: string, input: AdminCouponInput): Promise<void> {
  await connectDB();
  const data = mapInput(input);
  const clash = await Coupon.findOne({ code: data.code, _id: { $ne: id } })
    .select("_id")
    .lean();
  if (clash) throw new HttpError("A coupon with that code already exists.", 409);
  const res = await Coupon.updateOne({ _id: id }, { $set: data });
  if (res.matchedCount === 0) throw new HttpError("Coupon not found.", 404);
}

export async function setCouponActive(id: string, isActive: boolean): Promise<void> {
  await connectDB();
  await Coupon.updateOne({ _id: id }, { $set: { isActive } });
}
