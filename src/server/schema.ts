/**
 * Cloudflare D1 (SQLite) schema — Drizzle ORM.
 *
 * Design: entities that drive queries, joins and integrity are normalized into
 * real tables with foreign keys; genuinely document-shaped leaf data that is
 * always read/written as a whole (product variants, order snapshots, the
 * homepage singleton) lives in typed JSON (`text({ mode: "json" })`) columns.
 *
 * IDs are text UUIDs (`crypto.randomUUID()`), replacing Mongo ObjectIds. Public
 * identifiers remain slugs / `orderNumber`, so URLs are unaffected.
 *
 * A few hot fields are denormalized out of JSON into real columns where
 * reporting needs them (orders.paymentStatus / orders.total) so dashboard
 * aggregations stay plain, indexable SQL.
 */
import { sql } from "drizzle-orm";
import { sqliteTable, text, integer, real, index } from "drizzle-orm/sqlite-core";

/* ------------------------------------------------------------------ helpers */

const uuid = () => text().primaryKey().$defaultFn(() => crypto.randomUUID());
/** mongoose `{ timestamps: true }` → createdAt / updatedAt (epoch ms). */
const createdAt = () =>
  integer("created_at", { mode: "timestamp_ms" }).$defaultFn(() => new Date()).notNull();
const updatedAt = () =>
  integer("updated_at", { mode: "timestamp_ms" })
    .$defaultFn(() => new Date())
    .$onUpdate(() => new Date())
    .notNull();

/* ------------------------------------------------------------- JSON shapes */

export type Seo = { title?: string; description?: string };

export type ProductVariant = {
  id: string;
  label: string;
  flavour?: string;
  size?: string;
  sku: string;
  price: number;
  mrp: number;
  stock: number;
};
export type NutritionRow = { label: string; value: string };
export type KeyBenefit = { title: string; description: string; images: string[] };

export type OrderItem = {
  product: string; // product id snapshot
  slug: string;
  name: string;
  image: string | null;
  variantId: string | null;
  variantLabel: string | null;
  price: number;
  mrp: number;
  qty: number;
  lineTotal: number;
};
export type OrderAddress = {
  name: string;
  phone: string;
  line1: string;
  line2: string;
  city: string;
  state: string;
  pincode: string;
  country: string;
};
export type OrderAmounts = {
  subtotal: number;
  shipping: number;
  discount: number;
  pointsRedeemed: number;
  tax: number;
  total: number;
  currency: string;
};
export type OrderPayment = {
  provider: string;
  mode: "live" | "stub";
  gatewayOrderId?: string;
  paymentId?: string;
  signature?: string;
  method?: string;
  status: "created" | "paid" | "failed";
  paidAt?: number | null; // epoch ms
};
export type OrderTimelineEntry = { status: string; note?: string; at: number };

export type ReviewReply = { body: string; repliedAt: number } | null;

/* Homepage singleton — see HomeContent (legacy mongoose) for field docs. */
export type HeroSlide = {
  eyebrow?: string;
  title: string;
  subtitle?: string;
  ctaLabel?: string;
  ctaHref?: string;
  image?: string;
};
export type HeroStat = { icon?: string; value: string; label: string };
export type FeatureItem = { icon?: string; title: string; desc?: string };
export type CtaBlock = {
  eyebrow?: string;
  title?: string;
  subtitle?: string;
  primaryLabel?: string;
  primaryHref?: string;
  secondaryLabel?: string;
  secondaryHref?: string;
};
export type HomeCard = {
  image?: string;
  title?: string;
  subtitle?: string;
  badge?: string;
  productSlug?: string;
  ctaLabel?: string;
  href?: string;
};
export type HomeVideo = { url?: string; poster?: string; caption?: string; productSlug?: string };
export type HomeTestimonial = {
  author: string;
  role?: string;
  rating?: number;
  body: string;
  avatar?: string;
};
export type HomeCert = { image?: string; label?: string };
export type HomeSection = {
  id: string;
  type:
    | "products"
    | "cards"
    | "categories"
    | "video"
    | "videoBanner"
    | "spotlight"
    | "certifications"
    | "testimonials"
    | "banner"
    | "richtext";
  title?: string;
  description?: string;
  enabled?: boolean;
  productSource?: "featured" | "bestsellers" | "manual" | "category";
  productSlugs?: string[];
  categorySlug?: string;
  limit?: number;
  layout?: "grid" | "carousel";
  mobileColumns?: number;
  viewAllHref?: string;
  categorySlugs?: string[];
  cards?: HomeCard[];
  videos?: HomeVideo[];
  videoUrl?: string;
  certifications?: HomeCert[];
  testimonials?: HomeTestimonial[];
  image?: string;
  ctaLabel?: string;
  ctaHref?: string;
  html?: string;
};

/* --------------------------------------------------------------- tables */

export const brands = sqliteTable("brands", {
  id: uuid(),
  name: text().notNull(),
  slug: text().notNull().unique(),
  description: text(),
  logo: text(),
  isActive: integer("is_active", { mode: "boolean" }).default(true).notNull(),
  seo: text({ mode: "json" }).$type<Seo>(),
  createdAt: createdAt(),
  updatedAt: updatedAt(),
});

export const categories = sqliteTable(
  "categories",
  {
    id: uuid(),
    name: text().notNull(),
    slug: text().notNull().unique(),
    description: text(),
    tagline: text(),
    image: text(),
    emoji: text(),
    parentId: text("parent_id"),
    order: integer().default(0).notNull(),
    isActive: integer("is_active", { mode: "boolean" }).default(true).notNull(),
    seo: text({ mode: "json" }).$type<Seo>(),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (t) => [index("categories_active_order_idx").on(t.isActive, t.order)]
);

export const users = sqliteTable(
  "users",
  {
    id: uuid(),
    name: text().notNull(),
    email: text().notNull().unique(),
    phone: text(),
    passwordHash: text("password_hash").notNull(),
    role: text().default("customer").notNull(),
    emailVerified: integer("email_verified", { mode: "boolean" }).default(false).notNull(),
    phoneVerified: integer("phone_verified", { mode: "boolean" }).default(false).notNull(),
    avatar: text(),
    walletBalance: real("wallet_balance").default(0).notNull(),
    rewardPoints: real("reward_points").default(0).notNull(),
    status: text().default("active").notNull(),
    lastLoginAt: integer("last_login_at", { mode: "timestamp_ms" }),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (t) => [index("users_role_idx").on(t.role)]
);

export const products = sqliteTable(
  "products",
  {
    id: uuid(),
    name: text().notNull(),
    slug: text().notNull().unique(),
    sku: text().notNull(),
    shortDescription: text("short_description"),
    description: text(),
    brandId: text("brand_id")
      .notNull()
      .references(() => brands.id),
    categoryId: text("category_id")
      .notNull()
      .references(() => categories.id),
    images: text({ mode: "json" }).$type<string[]>().default([]).notNull(),
    price: real().notNull(),
    mrp: real().notNull(),
    gstPct: real("gst_pct").default(18).notNull(),
    variants: text({ mode: "json" }).$type<ProductVariant[]>().default([]).notNull(),
    stock: integer().default(0).notNull(),
    nutritionFacts: text("nutrition_facts", { mode: "json" }).$type<NutritionRow[]>().default([]).notNull(),
    ingredients: text({ mode: "json" }).$type<string[]>().default([]).notNull(),
    benefits: text({ mode: "json" }).$type<string[]>().default([]).notNull(),
    keyBenefits: text("key_benefits", { mode: "json" }).$type<KeyBenefit[]>().default([]).notNull(),
    usage: text(),
    tags: text({ mode: "json" }).$type<string[]>().default([]).notNull(),
    goals: text({ mode: "json" }).$type<string[]>().default([]).notNull(),
    rating: real().default(0).notNull(),
    reviewCount: integer("review_count").default(0).notNull(),
    isFeatured: integer("is_featured", { mode: "boolean" }).default(false).notNull(),
    isBestseller: integer("is_bestseller", { mode: "boolean" }).default(false).notNull(),
    status: text().default("active").notNull(),
    seo: text({ mode: "json" }).$type<Seo>(),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (t) => [
    index("products_status_idx").on(t.status),
    index("products_brand_idx").on(t.brandId),
    index("products_category_idx").on(t.categoryId),
    index("products_price_idx").on(t.price),
    index("products_created_idx").on(t.createdAt),
  ]
);

export const addresses = sqliteTable(
  "addresses",
  {
    id: uuid(),
    userId: text("user_id")
      .notNull()
      .references(() => users.id),
    label: text().default("Home").notNull(),
    name: text().notNull(),
    phone: text().notNull(),
    line1: text().notNull(),
    line2: text(),
    city: text().notNull(),
    state: text().notNull(),
    pincode: text().notNull(),
    country: text().default("India").notNull(),
    isDefault: integer("is_default", { mode: "boolean" }).default(false).notNull(),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (t) => [index("addresses_user_idx").on(t.userId)]
);

export const coupons = sqliteTable(
  "coupons",
  {
    id: uuid(),
    code: text().notNull().unique(),
    description: text().default("").notNull(),
    type: text().notNull(), // percent | flat
    value: real().notNull(),
    minOrder: real("min_order").default(0).notNull(),
    maxDiscount: real("max_discount").default(0).notNull(),
    usageLimit: integer("usage_limit").default(0).notNull(),
    usedCount: integer("used_count").default(0).notNull(),
    startsAt: integer("starts_at", { mode: "timestamp_ms" }),
    expiresAt: integer("expires_at", { mode: "timestamp_ms" }),
    isActive: integer("is_active", { mode: "boolean" }).default(true).notNull(),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (t) => [index("coupons_active_idx").on(t.isActive)]
);

export const counters = sqliteTable("counters", {
  id: text().primaryKey(),
  seq: integer().default(0).notNull(),
});

export const posts = sqliteTable(
  "posts",
  {
    id: uuid(),
    title: text().notNull(),
    slug: text().notNull().unique(),
    excerpt: text(),
    coverImage: text("cover_image"),
    contentHtml: text("content_html").default("").notNull(),
    category: text().default("General").notNull(),
    tags: text({ mode: "json" }).$type<string[]>().default([]).notNull(),
    author: text().default("The 5XL Nutrition").notNull(),
    status: text().default("published").notNull(),
    publishedAt: integer("published_at", { mode: "timestamp_ms" }),
    readingMinutes: integer("reading_minutes").default(1).notNull(),
    seo: text({ mode: "json" }).$type<Seo>(),
    sourceUrl: text("source_url"),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (t) => [index("posts_status_published_idx").on(t.status, t.publishedAt)]
);

export const reviews = sqliteTable(
  "reviews",
  {
    id: uuid(),
    productId: text("product_id")
      .notNull()
      .references(() => products.id),
    userId: text("user_id")
      .notNull()
      .references(() => users.id),
    authorName: text("author_name").notNull(),
    rating: integer().notNull(),
    title: text(),
    body: text().notNull(),
    images: text({ mode: "json" }).$type<string[]>().default([]).notNull(),
    isVerifiedPurchase: integer("is_verified_purchase", { mode: "boolean" }).default(false).notNull(),
    status: text().default("approved").notNull(),
    reply: text({ mode: "json" }).$type<ReviewReply>(),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (t) => [index("reviews_product_idx").on(t.productId)]
);

export const subscriptions = sqliteTable(
  "subscriptions",
  {
    id: uuid(),
    userId: text("user_id")
      .notNull()
      .references(() => users.id),
    productId: text("product_id")
      .notNull()
      .references(() => products.id),
    productName: text("product_name").notNull(),
    productSlug: text("product_slug").notNull(),
    image: text(),
    variantId: text("variant_id"),
    variantLabel: text("variant_label"),
    price: real().notNull(),
    qty: integer().default(1).notNull(),
    intervalDays: integer("interval_days").default(30).notNull(),
    discountPct: real("discount_pct").default(10).notNull(),
    status: text().default("active").notNull(),
    nextDeliveryAt: integer("next_delivery_at", { mode: "timestamp_ms" }),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (t) => [index("subscriptions_user_idx").on(t.userId)]
);

export const walletTransactions = sqliteTable(
  "wallet_transactions",
  {
    id: uuid(),
    userId: text("user_id")
      .notNull()
      .references(() => users.id),
    kind: text().notNull(), // points | wallet
    type: text().notNull(), // earn | redeem | refund | adjust
    amount: real().notNull(),
    balanceAfter: real("balance_after").notNull(),
    orderNumber: text("order_number"),
    note: text().default("").notNull(),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (t) => [index("wallet_tx_user_idx").on(t.userId)]
);

export const wishlists = sqliteTable("wishlists", {
  id: uuid(),
  userId: text("user_id")
    .notNull()
    .unique()
    .references(() => users.id),
  productIds: text("product_ids", { mode: "json" }).$type<string[]>().default([]).notNull(),
  createdAt: createdAt(),
  updatedAt: updatedAt(),
});

export const orders = sqliteTable(
  "orders",
  {
    id: uuid(),
    orderNumber: text("order_number").notNull().unique(),
    userId: text("user_id")
      .notNull()
      .references(() => users.id),
    items: text({ mode: "json" }).$type<OrderItem[]>().notNull(),
    amounts: text({ mode: "json" }).$type<OrderAmounts>().notNull(),
    /** Denormalized mirror of amounts.total for revenue aggregation. */
    total: real().default(0).notNull(),
    couponCode: text("coupon_code"),
    pointsUsed: integer("points_used").default(0).notNull(),
    address: text({ mode: "json" }).$type<OrderAddress>().notNull(),
    payment: text({ mode: "json" }).$type<OrderPayment>().notNull(),
    /** Denormalized mirror of payment.status for paid-order filters. */
    paymentStatus: text("payment_status").default("created").notNull(),
    /** Denormalized gateway order id (razorpay) — webhook/verify lookups. */
    gatewayOrderId: text("gateway_order_id"),
    status: text().default("pending").notNull(),
    timeline: text({ mode: "json" }).$type<OrderTimelineEntry[]>().default([]).notNull(),
    placedAt: integer("placed_at", { mode: "timestamp_ms" }).$defaultFn(() => new Date()).notNull(),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (t) => [
    index("orders_user_idx").on(t.userId),
    index("orders_status_idx").on(t.status),
    index("orders_payment_status_idx").on(t.paymentStatus),
    index("orders_gateway_idx").on(t.gatewayOrderId),
    index("orders_created_idx").on(t.createdAt),
  ]
);

/** Homepage is a singleton document, stored as one row keyed `key = "home"`. */
export const homeContent = sqliteTable("home_content", {
  key: text().primaryKey().default("home"),
  announcement: text(),
  heroSlides: text("hero_slides", { mode: "json" }).$type<HeroSlide[]>().default([]).notNull(),
  heroStats: text("hero_stats", { mode: "json" }).$type<HeroStat[]>().default([]).notNull(),
  heroSecondaryCtaLabel: text("hero_secondary_cta_label"),
  heroSecondaryCtaHref: text("hero_secondary_cta_href"),
  features: text({ mode: "json" }).$type<FeatureItem[]>().default([]).notNull(),
  marqueeItems: text("marquee_items", { mode: "json" }).$type<string[]>().default([]).notNull(),
  cta: text({ mode: "json" }).$type<CtaBlock>(),
  categorySectionTitle: text("category_section_title").default("Shop by category").notNull(),
  showFeatured: integer("show_featured", { mode: "boolean" }).default(true).notNull(),
  showBestsellers: integer("show_bestsellers", { mode: "boolean" }).default(true).notNull(),
  featuredCategorySlugs: text("featured_category_slugs", { mode: "json" }).$type<string[]>().default([]).notNull(),
  sections: text({ mode: "json" }).$type<HomeSection[]>().default([]).notNull(),
  createdAt: createdAt(),
  updatedAt: updatedAt(),
});

/* ------------------------------------------------------------- row types */

export type UserRow = typeof users.$inferSelect;
export type ProductRow = typeof products.$inferSelect;
export type BrandRow = typeof brands.$inferSelect;
export type CategoryRow = typeof categories.$inferSelect;
export type OrderRow = typeof orders.$inferSelect;
export type AddressRow = typeof addresses.$inferSelect;
export type CouponRow = typeof coupons.$inferSelect;
export type PostRow = typeof posts.$inferSelect;
export type ReviewRow = typeof reviews.$inferSelect;
export type SubscriptionRow = typeof subscriptions.$inferSelect;
export type WalletTransactionRow = typeof walletTransactions.$inferSelect;
export type WishlistRow = typeof wishlists.$inferSelect;
export type HomeContentRow = typeof homeContent.$inferSelect;
