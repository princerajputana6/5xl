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

/* ---- Dynamic homepage sections ---- */

export const videoItemSchema = z.object({
  url: z.string().trim().optional(),
  poster: z.string().trim().optional(),
  caption: z.string().trim().optional(),
  productSlug: z.string().trim().optional(),
});

export const testimonialItemSchema = z.object({
  author: z.string().trim().min(1, "Author is required"),
  role: z.string().trim().optional(),
  rating: z.number().min(1).max(5).optional(),
  body: z.string().trim().min(1, "Review text is required"),
  avatar: z.string().trim().optional(),
});

export const cardItemSchema = z.object({
  image: z.string().trim().optional(),
  title: z.string().trim().optional(),
  subtitle: z.string().trim().optional(),
  badge: z.string().trim().optional(),
  productSlug: z.string().trim().optional(),
  ctaLabel: z.string().trim().optional(),
  href: z.string().trim().optional(),
});

export const homeSectionSchema = z.object({
  id: z.string().min(1),
  type: z.enum(["products", "cards", "categories", "video", "testimonials", "banner", "richtext"]),
  title: z.string().trim().optional(),
  description: z.string().trim().optional(),
  enabled: z.boolean().optional(),

  productSource: z.enum(["featured", "bestsellers", "manual", "category"]).optional(),
  productSlugs: z.array(z.string()).optional(),
  categorySlug: z.string().trim().optional(),
  limit: z.number().int().min(1).max(24).optional(),
  layout: z.enum(["grid", "carousel"]).optional(),
  viewAllHref: z.string().trim().optional(),

  categorySlugs: z.array(z.string()).optional(),

  cards: z.array(cardItemSchema).max(20).optional(),
  videos: z.array(videoItemSchema).max(20).optional(),
  testimonials: z.array(testimonialItemSchema).max(30).optional(),

  image: z.string().trim().optional(),
  ctaLabel: z.string().trim().optional(),
  ctaHref: z.string().trim().optional(),

  html: z.string().optional(),
});

export type HomeSectionInput = z.infer<typeof homeSectionSchema>;

export const homeContentSchema = z.object({
  announcement: z.string().trim().optional(),
  heroSlides: z.array(heroSlideSchema).max(6).optional(),
  features: z.array(featureItemSchema).max(8).optional(),
  categorySectionTitle: z.string().trim().optional(),
  showFeatured: z.boolean().optional(),
  showBestsellers: z.boolean().optional(),
  featuredCategorySlugs: z.array(z.string()).optional(),
  sections: z.array(homeSectionSchema).max(40).optional(),
});

export type HomeContentInput = z.infer<typeof homeContentSchema>;
