import { connectDB } from "@/server/db";
import { HomeContent } from "@/server/models/HomeContent";
import type { HomeContentInput } from "@/lib/validators/cms";

export type CardItemDTO = {
  image: string;
  title: string;
  subtitle: string;
  badge: string;
  productSlug: string;
  ctaLabel: string;
  href: string;
};

export type HomeSectionDTO = {
  id: string;
  type: "products" | "cards" | "categories" | "video" | "testimonials" | "banner" | "richtext";
  title: string;
  description: string;
  enabled: boolean;
  productSource: "featured" | "bestsellers" | "manual" | "category";
  productSlugs: string[];
  categorySlug: string;
  limit: number;
  layout: "grid" | "carousel";
  viewAllHref: string;
  categorySlugs: string[];
  cards: CardItemDTO[];
  videos: { url: string; poster: string; caption: string; productSlug: string }[];
  testimonials: {
    author: string;
    role: string;
    rating: number;
    body: string;
    avatar: string;
  }[];
  image: string;
  ctaLabel: string;
  ctaHref: string;
  html: string;
};

export type HeroStatDTO = { icon: string; value: string; label: string };

export type CtaBlockDTO = {
  eyebrow: string;
  title: string;
  subtitle: string;
  primaryLabel: string;
  primaryHref: string;
  secondaryLabel: string;
  secondaryHref: string;
};

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
  heroStats: HeroStatDTO[];
  heroSecondaryCtaLabel: string;
  heroSecondaryCtaHref: string;
  features: { icon: string; title: string; desc: string }[];
  marqueeItems: string[];
  cta: CtaBlockDTO;
  categorySectionTitle: string;
  showFeatured: boolean;
  showBestsellers: boolean;
  featuredCategorySlugs: string[];
  sections: HomeSectionDTO[];
};

function toSectionDTO(s: Record<string, unknown>): HomeSectionDTO {
  return {
    id: String(s.id ?? ""),
    type: (s.type as HomeSectionDTO["type"]) ?? "products",
    title: (s.title as string) ?? "",
    description: (s.description as string) ?? "",
    enabled: s.enabled !== false,
    productSource: (s.productSource as HomeSectionDTO["productSource"]) ?? "manual",
    productSlugs: (s.productSlugs as string[]) ?? [],
    categorySlug: (s.categorySlug as string) ?? "",
    limit: typeof s.limit === "number" ? (s.limit as number) : 8,
    layout: (s.layout as HomeSectionDTO["layout"]) ?? "grid",
    viewAllHref: (s.viewAllHref as string) ?? "",
    categorySlugs: (s.categorySlugs as string[]) ?? [],
    cards: ((s.cards as Record<string, unknown>[]) ?? []).map((c) => ({
      image: (c.image as string) ?? "",
      title: (c.title as string) ?? "",
      subtitle: (c.subtitle as string) ?? "",
      badge: (c.badge as string) ?? "",
      productSlug: (c.productSlug as string) ?? "",
      ctaLabel: (c.ctaLabel as string) ?? "",
      href: (c.href as string) ?? "",
    })),
    videos: ((s.videos as Record<string, unknown>[]) ?? []).map((v) => ({
      url: (v.url as string) ?? "",
      poster: (v.poster as string) ?? "",
      caption: (v.caption as string) ?? "",
      productSlug: (v.productSlug as string) ?? "",
    })),
    testimonials: ((s.testimonials as Record<string, unknown>[]) ?? []).map((t) => ({
      author: (t.author as string) ?? "",
      role: (t.role as string) ?? "",
      rating: typeof t.rating === "number" ? (t.rating as number) : 5,
      body: (t.body as string) ?? "",
      avatar: (t.avatar as string) ?? "",
    })),
    image: (s.image as string) ?? "",
    ctaLabel: (s.ctaLabel as string) ?? "",
    ctaHref: (s.ctaHref as string) ?? "",
    html: (s.html as string) ?? "",
  };
}

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
  heroStats: [
    { icon: "Zap", value: "50K+", label: "Athletes fueled" },
    { icon: "FlaskConical", value: "100%", label: "Lab-tested" },
    { icon: "Star", value: "4.9", label: "Avg. rating" },
    { icon: "ShieldCheck", value: "24h", label: "Fast dispatch" },
  ],
  heroSecondaryCtaLabel: "Shop bestsellers",
  heroSecondaryCtaHref: "/products?sort=rating",
  features: [
    { icon: "FlaskConical", title: "Lab-Tested", desc: "Every batch third-party tested for purity & label accuracy." },
    { icon: "Truck", title: "Fast Delivery", desc: "Dispatched within 24h, delivered across India in 2–5 days." },
    { icon: "ShieldCheck", title: "Authentic Only", desc: "Sourced direct — zero fakes, guaranteed or money back." },
    { icon: "BadgeCheck", title: "Expert Backed", desc: "Formulated with coaches and sports nutritionists." },
  ],
  marqueeItems: [
    "100% Lab-Tested",
    "Authentic Guaranteed",
    "Free Shipping over ₹999",
    "24h Dispatch",
    "50,000+ Athletes Fueled",
    "No Added Sugar",
    "FSSAI Certified",
    "Made for Serious Lifters",
  ],
  cta: {
    eyebrow: "Join 5XL",
    title: "Ready to level up?",
    subtitle:
      "Create your free account and unlock rewards, faster checkout and member-only pricing.",
    primaryLabel: "Create your account",
    primaryHref: "/register",
    secondaryLabel: "Browse products",
    secondaryHref: "/products",
  },
  categorySectionTitle: "Shop by category",
  showFeatured: true,
  showBestsellers: true,
  featuredCategorySlugs: [],
  sections: [],
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
    heroStats: (() => {
      const raw = (doc.heroStats as HomeContentDTO["heroStats"] | undefined) ?? [];
      return raw.length
        ? raw.map((s) => ({ icon: s.icon ?? "", value: s.value ?? "", label: s.label ?? "" }))
        : HOME_DEFAULTS.heroStats;
    })(),
    heroSecondaryCtaLabel:
      (doc.heroSecondaryCtaLabel as string) ?? HOME_DEFAULTS.heroSecondaryCtaLabel,
    heroSecondaryCtaHref:
      (doc.heroSecondaryCtaHref as string) ?? HOME_DEFAULTS.heroSecondaryCtaHref,
    features: features.length
      ? features.map((f) => ({ icon: f.icon ?? "", title: f.title ?? "", desc: f.desc ?? "" }))
      : HOME_DEFAULTS.features,
    marqueeItems: (() => {
      const raw = (doc.marqueeItems as string[] | undefined) ?? [];
      return raw.filter(Boolean).length ? raw.filter(Boolean) : HOME_DEFAULTS.marqueeItems;
    })(),
    cta: (() => {
      const c = (doc.cta as Partial<CtaBlockDTO> | undefined) ?? {};
      const d = HOME_DEFAULTS.cta;
      return {
        eyebrow: c.eyebrow ?? d.eyebrow,
        title: c.title ?? d.title,
        subtitle: c.subtitle ?? d.subtitle,
        primaryLabel: c.primaryLabel ?? d.primaryLabel,
        primaryHref: c.primaryHref ?? d.primaryHref,
        secondaryLabel: c.secondaryLabel ?? d.secondaryLabel,
        secondaryHref: c.secondaryHref ?? d.secondaryHref,
      };
    })(),
    categorySectionTitle: (doc.categorySectionTitle as string) || HOME_DEFAULTS.categorySectionTitle,
    showFeatured: doc.showFeatured !== false,
    showBestsellers: doc.showBestsellers !== false,
    featuredCategorySlugs: (doc.featuredCategorySlugs as string[]) ?? [],
    sections: ((doc.sections as Record<string, unknown>[]) ?? []).map(toSectionDTO),
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
