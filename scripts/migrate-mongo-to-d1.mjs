// One-time ETL: copy the existing MongoDB data into a portable SQL file that
// loads into Cloudflare D1. Run with:
//   node --env-file=.env.local scripts/migrate-mongo-to-d1.mjs
// then apply with:
//   npx wrangler d1 execute fivexl --local  --file=drizzle/data/import.sql
//   npx wrangler d1 execute fivexl --remote --file=drizzle/data/import.sql
//
// ObjectId references are remapped to fresh UUIDs consistently across every
// collection. Product variant ids keep their original ObjectId hex so order
// line-items (which snapshot variantId) still resolve.
import { MongoClient } from "mongodb";
import { randomUUID } from "node:crypto";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";

const URI = process.env.MONGODB_URI;
const DB_NAME = "fivexl";
if (!URI) {
  console.error("MONGODB_URI is not set (use --env-file=.env.local).");
  process.exit(1);
}

/* ---- value serialization ------------------------------------------- */
const quote = (s) => "'" + String(s).replace(/'/g, "''") + "'";
const ms = (v) => (v == null ? null : v instanceof Date ? v.getTime() : new Date(v).getTime());
function sql(v) {
  if (v === null || v === undefined) return "NULL";
  if (typeof v === "number") return Number.isFinite(v) ? String(v) : "NULL";
  if (typeof v === "boolean") return v ? "1" : "0";
  if (v instanceof Date) return String(v.getTime());
  if (typeof v === "object") return quote(JSON.stringify(v));
  return quote(String(v));
}
const nowMs = () => Date.now();
const str = (v, d = "") => (v == null ? d : String(v));

function insertStatements(table, columns, rows) {
  if (rows.length === 0) return `-- ${table}: 0 rows\n`;
  const cols = columns.map((c) => `"${c}"`).join(", ");
  const lines = rows.map((r) => `INSERT INTO "${table}" (${cols}) VALUES (${r.map(sql).join(", ")});`);
  return `-- ${table}: ${rows.length} rows\n${lines.join("\n")}\n`;
}

async function main() {
  const client = new MongoClient(URI);
  await client.connect();
  const db = client.db(DB_NAME);
  console.log(`Connected to Mongo db "${DB_NAME}".`);

  const read = async (name) => db.collection(name).find({}).toArray();
  const [
    usersM,
    brandsM,
    categoriesM,
    productsM,
    ordersM,
    addressesM,
    couponsM,
    countersM,
    postsM,
    reviewsM,
    subscriptionsM,
    walletM,
    wishlistsM,
    homeM,
  ] = await Promise.all([
    read("users"),
    read("brands"),
    read("categories"),
    read("products"),
    read("orders"),
    read("addresses"),
    read("coupons"),
    read("counters"),
    read("posts"),
    read("reviews"),
    read("subscriptions"),
    read("wallettransactions"),
    read("wishlists"),
    read("homecontents"),
  ]);

  // ID maps (only entities referenced by others need one).
  const userId = new Map();
  const brandId = new Map();
  const catId = new Map();
  const prodId = new Map();
  for (const u of usersM) userId.set(String(u._id), randomUUID());
  for (const b of brandsM) brandId.set(String(b._id), randomUUID());
  for (const c of categoriesM) catId.set(String(c._id), randomUUID());
  for (const p of productsM) prodId.set(String(p._id), randomUUID());

  // No explicit BEGIN/COMMIT or PRAGMA: Cloudflare D1 (remote) manages its own
  // transaction and rejects `BEGIN TRANSACTION`. Rows are emitted parent-first
  // so foreign keys resolve without disabling enforcement.
  const out = [];

  // brands
  out.push(
    insertStatements(
      "brands",
      ["id", "name", "slug", "description", "logo", "is_active", "seo", "created_at", "updated_at"],
      brandsM.map((b) => [
        brandId.get(String(b._id)),
        b.name,
        b.slug,
        b.description ?? null,
        b.logo ?? null,
        b.isActive !== false,
        b.seo ?? null,
        ms(b.createdAt) ?? nowMs(),
        ms(b.updatedAt) ?? nowMs(),
      ])
    )
  );

  // categories
  out.push(
    insertStatements(
      "categories",
      ["id", "name", "slug", "description", "tagline", "image", "emoji", "parent_id", "order", "is_active", "seo", "created_at", "updated_at"],
      categoriesM.map((c) => [
        catId.get(String(c._id)),
        c.name,
        c.slug,
        c.description ?? null,
        c.tagline ?? null,
        c.image ?? null,
        c.emoji ?? null,
        c.parent ? catId.get(String(c.parent)) ?? null : null,
        c.order ?? 0,
        c.isActive !== false,
        c.seo ?? null,
        ms(c.createdAt) ?? nowMs(),
        ms(c.updatedAt) ?? nowMs(),
      ])
    )
  );

  // users
  out.push(
    insertStatements(
      "users",
      ["id", "name", "email", "phone", "password_hash", "role", "email_verified", "phone_verified", "avatar", "wallet_balance", "reward_points", "status", "last_login_at", "created_at", "updated_at"],
      usersM.map((u) => [
        userId.get(String(u._id)),
        u.name,
        String(u.email).toLowerCase(),
        u.phone ?? null,
        u.passwordHash,
        u.role ?? "customer",
        u.emailVerified === true,
        u.phoneVerified === true,
        u.avatar ?? null,
        u.walletBalance ?? 0,
        u.rewardPoints ?? 0,
        u.status ?? "active",
        ms(u.lastLoginAt),
        ms(u.createdAt) ?? nowMs(),
        ms(u.updatedAt) ?? nowMs(),
      ])
    )
  );

  // products
  out.push(
    insertStatements(
      "products",
      ["id", "name", "slug", "sku", "short_description", "description", "brand_id", "category_id", "images", "price", "mrp", "gst_pct", "variants", "stock", "nutrition_facts", "ingredients", "benefits", "key_benefits", "usage", "tags", "goals", "rating", "review_count", "is_featured", "is_bestseller", "status", "seo", "created_at", "updated_at"],
      productsM.map((p) => [
        prodId.get(String(p._id)),
        p.name,
        p.slug,
        p.sku,
        p.shortDescription ?? null,
        p.description ?? null,
        brandId.get(String(p.brand)) ?? null,
        catId.get(String(p.category)) ?? null,
        p.images ?? [],
        p.price ?? 0,
        p.mrp ?? 0,
        p.gstPct ?? 18,
        (p.variants ?? []).map((v) => ({
          id: String(v._id),
          label: v.label,
          flavour: v.flavour ?? undefined,
          size: v.size ?? undefined,
          sku: v.sku,
          price: v.price,
          mrp: v.mrp,
          stock: v.stock ?? 0,
        })),
        p.stock ?? 0,
        p.nutritionFacts ?? [],
        p.ingredients ?? [],
        p.benefits ?? [],
        (p.keyBenefits ?? []).map((k) => ({ title: k.title, description: k.description ?? "", images: k.images ?? [] })),
        p.usage ?? null,
        p.tags ?? [],
        p.goals ?? [],
        p.rating ?? 0,
        p.reviewCount ?? 0,
        p.isFeatured === true,
        p.isBestseller === true,
        p.status ?? "active",
        p.seo ?? null,
        ms(p.createdAt) ?? nowMs(),
        ms(p.updatedAt) ?? nowMs(),
      ])
    )
  );

  // coupons
  out.push(
    insertStatements(
      "coupons",
      ["id", "code", "description", "type", "value", "min_order", "max_discount", "usage_limit", "used_count", "starts_at", "expires_at", "is_active", "created_at", "updated_at"],
      couponsM.map((c) => [
        randomUUID(),
        c.code,
        c.description ?? "",
        c.type,
        c.value ?? 0,
        c.minOrder ?? 0,
        c.maxDiscount ?? 0,
        c.usageLimit ?? 0,
        c.usedCount ?? 0,
        ms(c.startsAt),
        ms(c.expiresAt),
        c.isActive !== false,
        ms(c.createdAt) ?? nowMs(),
        ms(c.updatedAt) ?? nowMs(),
      ])
    )
  );

  // counters
  out.push(
    insertStatements(
      "counters",
      ["id", "seq"],
      countersM.map((c) => [String(c._id), c.seq ?? 0])
    )
  );

  // posts
  out.push(
    insertStatements(
      "posts",
      ["id", "title", "slug", "excerpt", "cover_image", "content_html", "category", "tags", "author", "status", "published_at", "reading_minutes", "seo", "source_url", "created_at", "updated_at"],
      postsM.map((p) => [
        randomUUID(),
        p.title,
        p.slug,
        p.excerpt ?? null,
        p.coverImage ?? null,
        p.contentHtml ?? "",
        p.category ?? "General",
        p.tags ?? [],
        p.author ?? "The 5XL Nutrition",
        p.status ?? "published",
        ms(p.publishedAt),
        p.readingMinutes ?? 1,
        p.seo ?? null,
        p.sourceUrl ?? null,
        ms(p.createdAt) ?? nowMs(),
        ms(p.updatedAt) ?? nowMs(),
      ])
    )
  );

  // addresses
  out.push(
    insertStatements(
      "addresses",
      ["id", "user_id", "label", "name", "phone", "line1", "line2", "city", "state", "pincode", "country", "is_default", "created_at", "updated_at"],
      addressesM
        .filter((a) => userId.has(String(a.user)))
        .map((a) => [
          randomUUID(),
          userId.get(String(a.user)),
          a.label ?? "Home",
          a.name,
          a.phone,
          a.line1,
          a.line2 ?? "",
          a.city,
          a.state,
          a.pincode,
          a.country ?? "India",
          a.isDefault === true,
          ms(a.createdAt) ?? nowMs(),
          ms(a.updatedAt) ?? nowMs(),
        ])
    )
  );

  // orders
  out.push(
    insertStatements(
      "orders",
      ["id", "order_number", "user_id", "items", "amounts", "total", "coupon_code", "points_used", "address", "payment", "payment_status", "gateway_order_id", "status", "timeline", "placed_at", "created_at", "updated_at"],
      ordersM
        .filter((o) => userId.has(String(o.user)))
        .map((o) => {
          const items = (o.items ?? []).map((i) => ({
            product: prodId.get(String(i.product)) ?? String(i.product),
            slug: i.slug,
            name: i.name,
            image: i.image ?? null,
            variantId: i.variantId ?? null,
            variantLabel: i.variantLabel ?? null,
            price: i.price,
            mrp: i.mrp,
            qty: i.qty,
            lineTotal: i.lineTotal,
          }));
          const payment = {
            provider: o.payment?.provider ?? "razorpay",
            mode: o.payment?.mode ?? "stub",
            gatewayOrderId: o.payment?.gatewayOrderId,
            paymentId: o.payment?.paymentId,
            signature: o.payment?.signature,
            method: o.payment?.method,
            status: o.payment?.status ?? "created",
            paidAt: ms(o.payment?.paidAt),
          };
          const timeline = (o.timeline ?? []).map((t) => ({ status: t.status, note: t.note, at: ms(t.at) ?? nowMs() }));
          return [
            randomUUID(),
            o.orderNumber,
            userId.get(String(o.user)),
            items,
            o.amounts ?? {},
            o.amounts?.total ?? 0,
            o.couponCode ?? null,
            o.pointsUsed ?? 0,
            o.address ?? {},
            payment,
            payment.status,
            payment.gatewayOrderId ?? null,
            o.status ?? "pending",
            timeline,
            ms(o.placedAt) ?? ms(o.createdAt) ?? nowMs(),
            ms(o.createdAt) ?? nowMs(),
            ms(o.updatedAt) ?? nowMs(),
          ];
        })
    )
  );

  // reviews
  out.push(
    insertStatements(
      "reviews",
      ["id", "product_id", "user_id", "author_name", "rating", "title", "body", "images", "is_verified_purchase", "status", "reply", "created_at", "updated_at"],
      reviewsM
        .filter((r) => prodId.has(String(r.product)) && userId.has(String(r.user)))
        .map((r) => [
          randomUUID(),
          prodId.get(String(r.product)),
          userId.get(String(r.user)),
          r.authorName,
          r.rating,
          r.title ?? null,
          r.body,
          r.images ?? [],
          r.isVerifiedPurchase === true,
          r.status ?? "approved",
          r.reply?.body ? { body: r.reply.body, repliedAt: ms(r.reply.repliedAt) ?? nowMs() } : null,
          ms(r.createdAt) ?? nowMs(),
          ms(r.updatedAt) ?? nowMs(),
        ])
    )
  );

  // subscriptions
  out.push(
    insertStatements(
      "subscriptions",
      ["id", "user_id", "product_id", "product_name", "product_slug", "image", "variant_id", "variant_label", "price", "qty", "interval_days", "discount_pct", "status", "next_delivery_at", "created_at", "updated_at"],
      subscriptionsM
        .filter((s) => userId.has(String(s.user)) && prodId.has(String(s.product)))
        .map((s) => [
          randomUUID(),
          userId.get(String(s.user)),
          prodId.get(String(s.product)),
          s.productName,
          s.productSlug,
          s.image ?? null,
          s.variantId ?? null,
          s.variantLabel ?? null,
          s.price ?? 0,
          s.qty ?? 1,
          s.intervalDays ?? 30,
          s.discountPct ?? 10,
          s.status ?? "active",
          ms(s.nextDeliveryAt),
          ms(s.createdAt) ?? nowMs(),
          ms(s.updatedAt) ?? nowMs(),
        ])
    )
  );

  // wallet_transactions
  out.push(
    insertStatements(
      "wallet_transactions",
      ["id", "user_id", "kind", "type", "amount", "balance_after", "order_number", "note", "created_at", "updated_at"],
      walletM
        .filter((w) => userId.has(String(w.user)))
        .map((w) => [
          randomUUID(),
          userId.get(String(w.user)),
          w.kind,
          w.type,
          w.amount ?? 0,
          w.balanceAfter ?? 0,
          w.orderNumber ?? null,
          w.note ?? "",
          ms(w.createdAt) ?? nowMs(),
          ms(w.updatedAt) ?? nowMs(),
        ])
    )
  );

  // wishlists
  out.push(
    insertStatements(
      "wishlists",
      ["id", "user_id", "product_ids", "created_at", "updated_at"],
      wishlistsM
        .filter((w) => userId.has(String(w.user)))
        .map((w) => [
          randomUUID(),
          userId.get(String(w.user)),
          (w.products ?? []).map((p) => prodId.get(String(p)) ?? String(p)).filter((x) => x),
          ms(w.createdAt) ?? nowMs(),
          ms(w.updatedAt) ?? nowMs(),
        ])
    )
  );

  // home_content (singleton)
  const home = homeM[0];
  if (home) {
    out.push(
      insertStatements(
        "home_content",
        ["key", "announcement", "hero_slides", "hero_stats", "hero_secondary_cta_label", "hero_secondary_cta_href", "features", "marquee_items", "cta", "category_section_title", "show_featured", "show_bestsellers", "featured_category_slugs", "sections", "created_at", "updated_at"],
        [
          [
            "home",
            home.announcement ?? null,
            home.heroSlides ?? [],
            home.heroStats ?? [],
            home.heroSecondaryCtaLabel ?? null,
            home.heroSecondaryCtaHref ?? null,
            home.features ?? [],
            home.marqueeItems ?? [],
            home.cta ?? null,
            home.categorySectionTitle ?? "Shop by category",
            home.showFeatured !== false,
            home.showBestsellers !== false,
            home.featuredCategorySlugs ?? [],
            home.sections ?? [],
            ms(home.createdAt) ?? nowMs(),
            ms(home.updatedAt) ?? nowMs(),
          ],
        ]
      )
    );
  }

  const outPath = path.join(process.cwd(), "drizzle", "data", "import.sql");
  await mkdir(path.dirname(outPath), { recursive: true });
  await writeFile(outPath, out.join("\n") + "\n", "utf8");

  console.log("Row counts:");
  console.log({
    users: usersM.length,
    brands: brandsM.length,
    categories: categoriesM.length,
    products: productsM.length,
    orders: ordersM.length,
    addresses: addressesM.length,
    coupons: couponsM.length,
    counters: countersM.length,
    posts: postsM.length,
    reviews: reviewsM.length,
    subscriptions: subscriptionsM.length,
    walletTransactions: walletM.length,
    wishlists: wishlistsM.length,
    homeContent: homeM.length,
  });
  console.log(`\nWrote ${outPath}`);
  await client.close();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
