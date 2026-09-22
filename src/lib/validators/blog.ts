import { z } from "zod";

const slug = z
  .string()
  .trim()
  .min(2, "Slug is required")
  .regex(/^[a-z0-9-]+$/, "Lowercase letters, numbers and hyphens only");

export const blogPostSchema = z.object({
  title: z.string().trim().min(3, "Title is required"),
  slug,
  excerpt: z.string().trim().max(400).optional(),
  coverImage: z.string().trim().optional(),
  contentHtml: z.string().optional(),
  category: z.string().trim().optional(),
  tags: z.array(z.string().trim()).optional(),
  author: z.string().trim().optional(),
  status: z.enum(["draft", "published"]).optional(),
  seo: z
    .object({
      title: z.string().trim().optional(),
      description: z.string().trim().optional(),
    })
    .optional(),
});

export type BlogPostInput = z.infer<typeof blogPostSchema>;
