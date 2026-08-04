import { z } from "zod";

export const applyCouponSchema = z.object({
  code: z.string().trim().min(1, "Enter a coupon code").max(40),
  items: z
    .array(
      z.object({
        productId: z.string().min(1),
        variantId: z.string().nullable().optional(),
        qty: z.number().int().min(1).max(20),
      })
    )
    .min(1, "Your cart is empty"),
});

export const adminCouponSchema = z.object({
  code: z
    .string()
    .trim()
    .min(3, "Code must be at least 3 characters")
    .max(40)
    .regex(/^[A-Za-z0-9_-]+$/, "Letters, numbers, - and _ only"),
  description: z.string().trim().max(160).optional(),
  type: z.enum(["percent", "flat"]),
  value: z.number().min(0),
  minOrder: z.number().min(0).optional(),
  maxDiscount: z.number().min(0).optional(),
  usageLimit: z.number().int().min(0).optional(),
  startsAt: z.string().optional(), // ISO date (optional)
  expiresAt: z.string().optional(),
  isActive: z.boolean().optional(),
});

export type AdminCouponInput = z.infer<typeof adminCouponSchema>;
