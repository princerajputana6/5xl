import { connectDB } from "@/server/db";
import { HomeContent } from "@/server/models/HomeContent";
import type { HomeContentInput } from "@/lib/validators/cms";

export type HomeContentDTO = {
  announcement: string;
  heroSlides: {
    eyebrow: string;
    title: string;
    subtitle: string;
    ctaLabel: string;
    ctaHref: string;
    image: string;
  }[];
  features: { icon: string; title: string; desc: string }[];
  categorySectionTitle: string;
  showFeatured: boolean;
  showBestsellers: boolean;
  featuredCategorySlugs: string[];
};

/** Shipped defaults so a fresh install still renders a complete homepage. */
export const HOME_DEFAULTS: HomeContentDTO = {
  announcement: "Free shipping on orders over ₹999 · Lab-tested, authentic-only supplements",
  heroSlides: [
    {
      eyebrow: "Fuel Beyond Limits",
      title: "Protein that powers your goals",
      subtitle:
        "Lab-tested, athlete-grade nutrition — built for serious lifters and shipped fast across India.",
      ctaLabel: "Shop all products",
      ctaHref: "/products",
      image: "",
    },
  ],
  features: [
    { icon: "FlaskConical", title: "Lab-Tested", desc: "Every batch third-party tested for purity & label accuracy." },
    { icon: "Truck", title: "Fast Delivery", desc: "Dispatched within 24h, delivered across India in 2–5 days." },
    { icon: "ShieldCheck", title: "Authentic Only", desc: "Sourced direct — zero fakes, guaranteed or money back." },
    { icon: "BadgeCheck", title: "Expert Backed", desc: "Formulated with coaches and sports nutritionists." },
  ],
  categorySectionTitle: "Shop by category",
  showFeatured: true,
  showBestsellers: true,
  featuredCategorySlugs: [],
};

function toDTO(doc: Record<string, unknown> | null): HomeContentDTO {
  if (!doc) return HOME_DEFAULTS;
  const heroSlides = (doc.heroSlides as HomeContentDTO["heroSlides"] | undefined) ?? [];
  const features = (doc.features as HomeContentDTO["features"] | undefined) ?? [];
  return {
    announcement: (doc.announcement as string) || HOME_DEFAULTS.announcement,
    heroSlides: heroSlides.length
      ? heroSlides.map((s) => ({
          eyebrow: s.eyebrow ?? "",
          title: s.title ?? "",
          subtitle: s.subtitle ?? "",
          ctaLabel: s.ctaLabel ?? "",
          ctaHref: s.ctaHref ?? "",
          image: s.image ?? "",
        }))
      : HOME_DEFAULTS.heroSlides,
    features: features.length
      ? features.map((f) => ({ icon: f.icon ?? "", title: f.title ?? "", desc: f.desc ?? "" }))
      : HOME_DEFAULTS.features,
    categorySectionTitle: (doc.categorySectionTitle as string) || HOME_DEFAULTS.categorySectionTitle,
    showFeatured: doc.showFeatured !== false,
    showBestsellers: doc.showBestsellers !== false,
    featuredCategorySlugs: (doc.featuredCategorySlugs as string[]) ?? [],
  };
}

/** Storefront read — always returns a complete, render-ready object. */
export async function getHomeContent(): Promise<HomeContentDTO> {
  await connectDB();
  const doc = await HomeContent.findOne({ key: "home" }).lean();
  return toDTO(doc as Record<string, unknown> | null);
}

/** Admin read — the raw stored values (falls back to defaults for editing). */
export async function getHomeContentForAdmin(): Promise<HomeContentDTO> {
  return getHomeContent();
}

export async function saveHomeContent(input: HomeContentInput): Promise<void> {
  await connectDB();
  await HomeContent.updateOne(
    { key: "home" },
    { $set: { ...input, key: "home" } },
    { upsert: true }
  );
}
