import { z } from "zod";

const slug = z
  .string()
  .trim()
  .min(2, "Slug is required")
  .regex(/^[a-z0-9-]+$/, "Lowercase letters, numbers and hyphens only");

const seo = z
  .object({
    title: z.string().trim().optional(),
    description: z.string().trim().optional(),
  })
  .optional();

/* ---------------- Categories ---------------- */

export const adminCategorySchema = z.object({
  name: z.string().trim().min(2, "Name is required"),
  slug,
  description: z.string().trim().optional(),
  tagline: z.string().trim().max(40).optional(),
  image: z.string().trim().optional(),
  emoji: z.string().trim().max(8).optional(),
  parent: z.string().trim().nullish(),
  order: z.number().int().optional(),
  isActive: z.boolean().optional(),
  seo,
});

export type AdminCategoryInput = z.infer<typeof adminCategorySchema>;

/** Persisted ordering: `[{ id, order }]`. */
export const reorderSchema = z.object({
  items: z.array(z.object({ id: z.string().min(1), order: z.number().int() })).min(1),
});

/* ---------------- Brands ---------------- */

export const adminBrandSchema = z.object({
  name: z.string().trim().min(2, "Name is required"),
  slug,
  description: z.string().trim().optional(),
  logo: z.string().trim().optional(),
  isActive: z.boolean().optional(),
  seo,
});

export type AdminBrandInput = z.infer<typeof adminBrandSchema>;

/* ---------------- Home content (CMS) ---------------- */

export const heroSlideSchema = z.object({
  eyebrow: z.string().trim().optional(),
  title: z.string().trim().min(1, "Title is required"),
  subtitle: z.string().trim().optional(),
  ctaLabel: z.string().trim().optional(),
  ctaHref: z.string().trim().optional(),
  image: z.string().trim().optional(),
});

export const featureItemSchema = z.object({
  icon: z.string().trim().optional(), // lucide icon name
  title: z.string().trim().min(1, "Title is required"),
  desc: z.string().trim().optional(),
});

export const homeContentSchema = z.object({
  announcement: z.string().trim().optional(),
  heroSlides: z.array(heroSlideSchema).max(6).optional(),
  features: z.array(featureItemSchema).max(8).optional(),
  categorySectionTitle: z.string().trim().optional(),
  showFeatured: z.boolean().optional(),
  showBestsellers: z.boolean().optional(),
  featuredCategorySlugs: z.array(z.string()).optional(),
});

export type HomeContentInput = z.infer<typeof homeContentSchema>;
