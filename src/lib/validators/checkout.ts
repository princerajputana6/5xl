import { z } from "zod";

export const ADDRESS_LABELS = ["Home", "Work", "Other"] as const;

export const addressSchema = z.object({
  label: z.enum(ADDRESS_LABELS).optional(),
  name: z.string().trim().min(2, "Enter the recipient's name"),
  phone: z
    .string()
    .trim()
    .regex(/^[6-9]\d{9}$/, "Enter a valid 10-digit mobile number"),
  line1: z.string().trim().min(3, "Address is required"),
  // line2/country are optional here; the Order/Address schemas default them
  // ("" and "India"). Kept without zod .default() so the RHF input and output
  // types stay identical.
  line2: z.string().trim().optional(),
  city: z.string().trim().min(2, "City is required"),
  state: z.string().trim().min(2, "State is required"),
  pincode: z.string().trim().regex(/^\d{6}$/, "Enter a valid 6-digit pincode"),
  country: z.string().trim().optional(),
});

export type AddressInput = z.infer<typeof addressSchema>;

export const checkoutItemSchema = z.object({
  productId: z.string().min(1),
  variantId: z.string().nullable().optional().default(null),
  qty: z.number().int().min(1).max(20),
});

export const checkoutSchema = z.object({
  items: z.array(checkoutItemSchema).min(1, "Your cart is empty"),
  address: addressSchema,
  saveAddress: z.boolean().optional().default(false),
  couponCode: z.string().trim().optional(),
  redeemPoints: z.number().int().min(0).optional(),
});

export type CheckoutInput = z.infer<typeof checkoutSchema>;

export const verifyPaymentSchema = z.object({
  razorpay_order_id: z.string().min(1),
  razorpay_payment_id: z.string().min(1),
  razorpay_signature: z.string().min(1),
});
