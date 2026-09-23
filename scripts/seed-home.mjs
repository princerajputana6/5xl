// Seed a fully dynamic, section-driven homepage. Run with: npm run seed:home
//
// SAFE: only touches the single HomeContent document (key: "home"). It never
// reads or writes products, categories, brands or any other collection, so it
// can be run against a live catalogue without risk. Everything it writes is
// fully editable afterwards in Admin → Homepage.
import mongoose from "mongoose";

const URI = process.env.MONGODB_URI;
if (!URI) {
  console.error("MONGODB_URI missing. Run via `npm run seed:home` (loads .env.local).");
  process.exit(1);
}

const { Schema } = mongoose;
const HomeContent = mongoose.model("HomeContent", new Schema({}, { strict: false, timestamps: true }));

function id() {
  return `s_${Math.random().toString(36).slice(2, 10)}`;
}

/** Real product slugs used to seed the "card slider" demo section. */
const CARD_PRODUCT_SLUGS = [
  "performance-fermented-yeast-protein-with-ultrasorb-tech-cold-coffee-6-kg",
  "performance-fermented-yeast-protein-with-ultrasorb-tech-chocolate-6-kg",
  "pro-concentrate-whey-protein-rich-chocolate-3696g-free-gym-bag-and-shaker",
  "isorich-blend-whey-protein-with-ultrasorb-tech-3696g",
  "performance-fermented-yeast-protein-with-ultrasorb-tech-4kg-malai-kulfi",
  "isorich-blend-whey-protein-with-ultrasorb-tech-3696g-free-gym-bag-and-shaker",
];

const doc = {
  key: "home",
  announcement:
    "Free shipping on orders over ₹999 · Lab-tested, authentic-only supplements",
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
  sections: [
    {
      id: id(),
      type: "categories",
      title: "Shop by Category",
      description: "Find exactly what your training needs.",
      enabled: true,
      categorySlugs: [],
      viewAllHref: "/products",
    },
    {
      id: id(),
      type: "products",
      title: "Featured",
      description: "Hand-picked, top-performing picks from the 5XL range.",
      enabled: true,
      productSource: "featured",
      productSlugs: [],
      limit: 8,
      layout: "carousel",
      viewAllHref: "/products",
    },
    {
      id: id(),
      type: "cards",
      title: "Top Sellers",
      description: "The formulas lifters keep coming back to.",
      enabled: true,
      viewAllHref: "/products?sort=rating",
      cards: CARD_PRODUCT_SLUGS.map((slug, i) => ({
        image: "",
        title: "",
        subtitle: "",
        badge: i === 0 ? "Bestseller" : "",
        productSlug: slug,
        ctaLabel: "Shop now",
        href: "",
      })),
    },
    {
      id: id(),
      type: "products",
      title: "Bestsellers",
      description: "",
      enabled: true,
      productSource: "bestsellers",
      productSlugs: [],
      limit: 8,
      layout: "grid",
      viewAllHref: "/products?sort=rating",
    },
    {
      id: id(),
      type: "testimonials",
      title: "What lifters say",
      description: "",
      enabled: true,
      testimonials: [
        { author: "Rahul S.", role: "Verified buyer", rating: 5, body: "Mixes clean, tastes great and I've seen real strength gains. My go-to whey now." },
        { author: "Ananya P.", role: "Verified buyer", rating: 5, body: "Fast delivery and the lab-test reports gave me total confidence. Zero bloating." },
        { author: "Vikram R.", role: "Verified buyer", rating: 4, body: "Great value for a genuine, tested product. The creatine stack is excellent." },
      ],
    },
  ],
};

async function run() {
  await mongoose.connect(URI, { dbName: "fivexl" });
  await HomeContent.updateOne({ key: "home" }, { $set: doc }, { upsert: true });
  console.log(`✓ Seeded homepage with ${doc.sections.length} dynamic sections (safe: HomeContent only).`);
  await mongoose.disconnect();
  process.exit(0);
}

run().catch((e) => {
  console.error("seed:home failed:", e);
  process.exit(1);
});
