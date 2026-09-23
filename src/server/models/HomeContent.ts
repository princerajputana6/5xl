import { Schema, model, models, type Model, type InferSchemaType } from "mongoose";

/**
 * Singleton document holding editable storefront homepage content (hero slides,
 * feature strip, section toggles). There is only ever one doc, keyed by
 * `key: "home"`, so the storefront and admin read/write the same record.
 */
const HeroSlideSchema = new Schema(
  {
    eyebrow: String,
    title: { type: String, required: true },
    subtitle: String,
    ctaLabel: String,
    ctaHref: String,
    image: String,
  },
  { _id: false }
);

const FeatureItemSchema = new Schema(
  {
    icon: String, // lucide icon name
    title: { type: String, required: true },
    desc: String,
  },
  { _id: false }
);

/** A single hero stat chip (e.g. "50K+" / "Athletes fueled"). */
const HeroStatSchema = new Schema(
  {
    icon: String, // lucide icon name
    value: { type: String, required: true },
    label: { type: String, required: true },
  },
  { _id: false }
);

/* ---- Flexible, admin-orderable homepage sections ---- */

const VideoItemSchema = new Schema(
  {
    url: String, // mp4/webm URL or YouTube/Vimeo link
    poster: String, // thumbnail image
    caption: String,
    productSlug: String, // product assigned to this video
  },
  { _id: false }
);

const TestimonialItemSchema = new Schema(
  {
    author: { type: String, required: true },
    role: String,
    rating: { type: Number, default: 5 },
    body: { type: String, required: true },
    avatar: String,
  },
  { _id: false }
);

/** A single card in a "card slider" section, optionally tied to a product. */
const CardItemSchema = new Schema(
  {
    image: String,
    title: String,
    subtitle: String,
    badge: String, // small pill, e.g. "New" / "Save 20%"
    productSlug: String, // attached product (drives price + default link)
    ctaLabel: String,
    href: String, // overrides the attached product's link when set
  },
  { _id: false }
);

const HomeSectionSchema = new Schema(
  {
    id: { type: String, required: true },
    type: {
      type: String,
      enum: ["products", "cards", "categories", "video", "testimonials", "banner", "richtext"],
      required: true,
    },
    title: String,
    description: String,
    enabled: { type: Boolean, default: true },

    // products
    productSource: {
      type: String,
      enum: ["featured", "bestsellers", "manual", "category"],
      default: "manual",
    },
    productSlugs: { type: [String], default: [] },
    categorySlug: String, // products-from-category source
    limit: { type: Number, default: 8 },
    layout: { type: String, enum: ["grid", "carousel"], default: "grid" },
    viewAllHref: String,

    // categories
    categorySlugs: { type: [String], default: [] },

    // card slider (each card can carry an attached product)
    cards: { type: [CardItemSchema], default: [] },

    // video slider
    videos: { type: [VideoItemSchema], default: [] },

    // testimonials
    testimonials: { type: [TestimonialItemSchema], default: [] },

    // banner
    image: String,
    ctaLabel: String,
    ctaHref: String,

    // richtext
    html: String,
  },
  { _id: false }
);

const HomeContentSchema = new Schema(
  {
    key: { type: String, required: true, unique: true, default: "home" },
    announcement: { type: String },
    heroSlides: { type: [HeroSlideSchema], default: [] },
    heroStats: { type: [HeroStatSchema], default: [] },
    heroSecondaryCtaLabel: { type: String },
    heroSecondaryCtaHref: { type: String },
    features: { type: [FeatureItemSchema], default: [] },
    /** Scrolling benefits ticker items. */
    marqueeItems: { type: [String], default: [] },
    /** Bottom "join us" call-to-action block. */
    cta: {
      eyebrow: String,
      title: String,
      subtitle: String,
      primaryLabel: String,
      primaryHref: String,
      secondaryLabel: String,
      secondaryHref: String,
    },
    categorySectionTitle: { type: String, default: "Shop by category" },
    showFeatured: { type: Boolean, default: true },
    showBestsellers: { type: Boolean, default: true },
    featuredCategorySlugs: { type: [String], default: [] },
    /** Ordered, admin-managed dynamic sections. When non-empty these drive the
     *  homepage body in place of the legacy fixed rows. */
    sections: { type: [HomeSectionSchema], default: [] },
  },
  { timestamps: true }
);

export type HomeContentDoc = InferSchemaType<typeof HomeContentSchema> & { _id: string };

export const HomeContent: Model<HomeContentDoc> =
  (models.HomeContent as Model<HomeContentDoc>) ??
  model<HomeContentDoc>("HomeContent", HomeContentSchema);
