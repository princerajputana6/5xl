import { z } from "zod";

export const reviewSchema = z.object({
  rating: z.number().int().min(1, "Pick a rating").max(5),
  title: z.string().trim().max(100).optional(),
  body: z
    .string()
    .trim()
    .min(5, "Tell us a bit more (min 5 characters)")
    .max(2000, "Keep it under 2000 characters"),
});

export type ReviewInput = z.infer<typeof reviewSchema>;

export const reviewStatusSchema = z.object({
  setStatus: z.enum(["pending", "approved", "rejected"]),
});

export const reviewReplySchema = z.object({
  reply: z.string().trim().min(1, "Reply can't be empty").max(1000),
});
