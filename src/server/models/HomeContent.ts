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

const HomeContentSchema = new Schema(
  {
    key: { type: String, required: true, unique: true, default: "home" },
    announcement: { type: String },
    heroSlides: { type: [HeroSlideSchema], default: [] },
    features: { type: [FeatureItemSchema], default: [] },
    categorySectionTitle: { type: String, default: "Shop by category" },
    showFeatured: { type: Boolean, default: true },
    showBestsellers: { type: Boolean, default: true },
    featuredCategorySlugs: { type: [String], default: [] },
  },
  { timestamps: true }
);

export type HomeContentDoc = InferSchemaType<typeof HomeContentSchema> & { _id: string };

export const HomeContent: Model<HomeContentDoc> =
  (models.HomeContent as Model<HomeContentDoc>) ??
  model<HomeContentDoc>("HomeContent", HomeContentSchema);
