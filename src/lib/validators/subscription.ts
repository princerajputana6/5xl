import { z } from "zod";

export const subscribeSchema = z.object({
  slug: z.string().min(1),
  variantId: z.string().nullable().optional(),
  qty: z.number().int().min(1).max(20).optional(),
  intervalDays: z.union([z.literal(30), z.literal(60), z.literal(90)]),
});

export type SubscribeInput = z.infer<typeof subscribeSchema>;

export const subscriptionActionSchema = z.object({
  action: z.enum(["pause", "resume", "cancel"]),
});
