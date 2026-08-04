import { z } from "zod";

export const ORDER_STATUS_VALUES = [
  "pending",
  "confirmed",
  "processing",
  "shipped",
  "delivered",
  "cancelled",
  "refunded",
] as const;

export const orderStatusSchema = z.object({
  status: z.enum(ORDER_STATUS_VALUES),
  note: z.string().trim().max(240).optional(),
});

export const PRODUCT_STATUS_VALUES = ["draft", "active", "archived"] as const;

export const adminProductSchema = z.object({
  name: z.string().trim().min(2, "Name is required"),
  slug: z
    .string()
    .trim()
    .min(2, "Slug is required")
    .regex(/^[a-z0-9-]+$/, "Lowercase letters, numbers and hyphens only"),
  sku: z.string().trim().min(1, "SKU is required"),
  brand: z.string().min(1, "Select a brand"),
  category: z.string().min(1, "Select a category"),
  price: z.number({ error: "Price is required" }).min(0),
  mrp: z.number({ error: "MRP is required" }).min(0),
  stock: z.number().int().min(0).optional(),
  gstPct: z.number().min(0).max(28).optional(),
  shortDescription: z.string().trim().optional(),
  description: z.string().trim().optional(),
  images: z.array(z.string()).optional(),
  goals: z.array(z.string()).optional(),
  tags: z.array(z.string()).optional(),
  status: z.enum(PRODUCT_STATUS_VALUES).optional(),
  isFeatured: z.boolean().optional(),
  isBestseller: z.boolean().optional(),
});

export type AdminProductInput = z.infer<typeof adminProductSchema>;
