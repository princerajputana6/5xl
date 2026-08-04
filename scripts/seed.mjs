// Seed the 5XL catalogue. Run with: npm run seed
// Loads env from .env.local via node --env-file (see package.json script).
import mongoose from "mongoose";

const { Schema } = mongoose;
const URI = process.env.MONGODB_URI;
if (!URI) {
  console.error("MONGODB_URI missing. Run via `npm run seed` (loads .env.local).");
  process.exit(1);
}

/* ---- Loose schemas (seed-only; app uses the typed models in src/server/models) ---- */
const Category = mongoose.model("Category", new Schema({}, { strict: false, timestamps: true }));
const Brand = mongoose.model("Brand", new Schema({}, { strict: false, timestamps: true }));
const Product = mongoose.model("Product", new Schema({}, { strict: false, timestamps: true }));

const img = (slug, n) => `https://picsum.photos/seed/5xl-${slug}-${n}/900/900`;
const rnd = (min, max) => Math.round(min + Math.random() * (max - min));
const rating = () => Math.round((3.9 + Math.random() * 1.0) * 10) / 10;

const CATEGORIES = [
  { name: "Whey Protein", slug: "protein", emoji: "🥛", description: "Fast-absorbing protein to build and repair muscle." },
  { name: "Creatine", slug: "creatine", emoji: "⚡", description: "The most researched supplement for strength and power." },
  { name: "Mass Gainer", slug: "mass-gainer", emoji: "🍚", description: "High-calorie formulas for serious size and bulking." },
  { name: "Pre-Workout", slug: "pre-workout", emoji: "🔥", description: "Explosive energy, focus and pumps for your training." },
  { name: "BCAA & EAA", slug: "bcaa", emoji: "🧬", description: "Amino acids to fuel recovery and reduce muscle breakdown." },
  { name: "Vitamins", slug: "vitamins", emoji: "💊", description: "Daily essentials to support overall health and performance." },
];

const BRANDS = [
  { name: "5XL", slug: "5xl", description: "Our own lab-tested, athlete-grade line. Zero compromise." },
  { name: "MuscleForge", slug: "muscleforge", description: "Hardcore formulas for the dedicated lifter." },
  { name: "PurePeak", slug: "purepeak", description: "Clean-label nutrition with nothing to hide." },
  { name: "ApexFuel", slug: "apexfuel", description: "Performance fuel engineered for endurance athletes." },
  { name: "VitalCore", slug: "vitalcore", description: "Everyday wellness, backed by science." },
];

const WHEY_FLAVOURS = ["Chocolate", "Vanilla", "Cafe Mocha", "Strawberry"];
const PWO_FLAVOURS = ["Blue Raspberry", "Watermelon", "Fruit Punch", "Green Apple"];

function nutrition(protein, calories, carbs, fat) {
  return [
    { label: "Serving Size", value: "1 scoop (33g)" },
    { label: "Energy", value: `${calories} kcal` },
    { label: "Protein", value: `${protein} g` },
    { label: "Carbohydrates", value: `${carbs} g` },
    { label: "Total Fat", value: `${fat} g` },
  ];
}

// Product blueprint per category -> generator
function buildProducts(catMap, brandMap) {
  const P = [];
  const push = (o) => P.push(o);

  const brandIds = BRANDS.map((b) => brandMap[b.slug]);
  const pickBrand = (i) => brandIds[i % brandIds.length];

  // Protein
  [
    ["Gold Whey Isolate", 27, 120, 2, 1],
    ["Raw Whey Concentrate", 24, 130, 4, 2],
    ["Hydro Whey Ultra", 30, 115, 1, 0.5],
    ["Lean Protein Blend", 25, 110, 3, 1.5],
    ["Plant Protein Pro", 22, 125, 5, 3],
  ].forEach((row, i) => {
    const [name, protein, cal, carbs, fat] = row;
    const slug = `${name.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`;
    const price = rnd(1799, 3499);
    push({
      name, slug, sku: `WHEY-${1000 + i}`,
      shortDescription: `${protein}g protein per scoop · ${cal} kcal · lab-tested`,
      description: `${name} delivers ${protein}g of premium protein per serving to support muscle growth and recovery. Instantised for easy mixing, third-party tested for purity and banned-substance free.`,
      brand: pickBrand(i), category: catMap["protein"],
      images: [img(slug, 1), img(slug, 2), img(slug, 3)],
      price, mrp: price + rnd(300, 900), gstPct: 18,
      variants: WHEY_FLAVOURS.slice(0, 3).map((f, vi) => ({
        label: `1kg · ${f}`, flavour: f, size: "1kg", sku: `WHEY-${1000 + i}-${vi}`,
        price, mrp: price + rnd(300, 900), stock: rnd(0, 60),
      })),
      stock: rnd(20, 120),
      nutritionFacts: nutrition(protein, cal, carbs, fat),
      ingredients: ["Whey Protein Isolate", "Whey Protein Concentrate", "Cocoa", "Natural Flavours", "Digestive Enzymes", "Stevia"],
      benefits: ["Supports lean muscle growth", "Fast post-workout recovery", "Low in sugar & fat", "Easy to digest"],
      usage: "Mix 1 scoop with 200-250ml water or milk. Consume post-workout or between meals.",
      tags: ["protein", "whey", "muscle", "recovery"],
      goals: ["muscle", "performance"],
      rating: rating(), reviewCount: rnd(12, 480),
      isFeatured: i < 2, isBestseller: i === 0 || i === 2,
      status: "active",
    });
  });

  // Creatine
  [
    ["Creatine Monohydrate", "Micronized 100% pure creatine monohydrate."],
    ["Creatine HCL", "Highly soluble creatine hydrochloride, no loading needed."],
    ["Creatine + Electrolytes", "Creatine blended with hydration electrolytes."],
    ["Micronized Creatine XL", "Ultra-fine creatine for maximum absorption."],
  ].forEach((row, i) => {
    const [name, desc] = row;
    const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, "-");
    const price = rnd(699, 1599);
    push({
      name, slug, sku: `CREA-${2000 + i}`,
      shortDescription: "3g creatine per serving · unflavoured · 100 servings",
      description: `${desc} Creatine is the most researched sports supplement, proven to increase strength, power output and lean mass.`,
      brand: pickBrand(i + 1), category: catMap["creatine"],
      images: [img(slug, 1), img(slug, 2), img(slug, 3)],
      price, mrp: price + rnd(150, 500), gstPct: 18,
      variants: [
        { label: "250g · Unflavoured", flavour: "Unflavoured", size: "250g", sku: `CREA-${2000 + i}-0`, price, mrp: price + rnd(150, 500), stock: rnd(10, 80) },
        { label: "500g · Unflavoured", flavour: "Unflavoured", size: "500g", sku: `CREA-${2000 + i}-1`, price: price + 500, mrp: price + 900, stock: rnd(10, 80) },
      ],
      stock: rnd(30, 150),
      nutritionFacts: [
        { label: "Serving Size", value: "3g (1 scoop)" },
        { label: "Creatine Monohydrate", value: "3 g" },
        { label: "Servings", value: "83" },
      ],
      ingredients: ["Creatine Monohydrate (Creapure®)"],
      benefits: ["Increases strength & power", "Boosts muscle volume", "Improves high-intensity performance", "No loading required"],
      usage: "Mix 1 scoop (3g) with water or your favourite beverage daily.",
      tags: ["creatine", "strength", "power"],
      goals: ["muscle", "performance"],
      rating: rating(), reviewCount: rnd(20, 600),
      isFeatured: i === 0, isBestseller: i < 2, status: "active",
    });
  });

  // Mass Gainer
  [
    ["Serious Mass Gainer", 1250, 50],
    ["Lean Mass Complex", 620, 35],
    ["Bulk XXL Gainer", 1100, 45],
  ].forEach((row, i) => {
    const [name, cal, protein] = row;
    const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, "-");
    const price = rnd(1999, 3999);
    push({
      name, slug, sku: `GAIN-${3000 + i}`,
      shortDescription: `${cal} kcal & ${protein}g protein per serving`,
      description: `${name} packs ${cal} calories and ${protein}g of protein per serving to help hard-gainers pack on size. Blended with complex carbs and creatine.`,
      brand: pickBrand(i + 2), category: catMap["mass-gainer"],
      images: [img(slug, 1), img(slug, 2), img(slug, 3)],
      price, mrp: price + rnd(400, 1200), gstPct: 18,
      variants: [
        { label: "3kg · Chocolate", flavour: "Chocolate", size: "3kg", sku: `GAIN-${3000 + i}-0`, price, mrp: price + rnd(400, 1200), stock: rnd(5, 40) },
        { label: "5kg · Chocolate", flavour: "Chocolate", size: "5kg", sku: `GAIN-${3000 + i}-1`, price: price + 1200, mrp: price + 2000, stock: rnd(5, 40) },
      ],
      stock: rnd(10, 60),
      nutritionFacts: nutrition(protein, cal, cal > 1000 ? 250 : 120, 6),
      ingredients: ["Maltodextrin", "Whey Protein Concentrate", "Oat Flour", "Creatine Monohydrate", "MCT", "Digestive Enzymes"],
      benefits: ["High-calorie mass support", "Complex carbs for clean bulking", "Added creatine", "Great for hard-gainers"],
      usage: "Blend 2 scoops with 400ml milk. Take between meals or post-workout.",
      tags: ["mass gainer", "bulking", "weight gain"],
      goals: ["muscle"],
      rating: rating(), reviewCount: rnd(15, 320),
      isFeatured: i === 0, isBestseller: i === 0, status: "active",
    });
  });

  // Pre-Workout
  [
    ["Nitro Pre-Workout", "High-stim pre-workout with 300mg caffeine and citrulline."],
    ["Pump Fuel Non-Stim", "Stimulant-free pump formula for evening training."],
    ["Focus Ignite Pre", "Balanced energy and nootropics for laser focus."],
  ].forEach((row, i) => {
    const [name, desc] = row;
    const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, "-");
    const price = rnd(1299, 2499);
    push({
      name, slug, sku: `PRE-${4000 + i}`,
      shortDescription: "Explosive energy · pumps · focus · 30 servings",
      description: `${desc} Formulated to deliver clean energy, skin-splitting pumps and razor focus without the crash.`,
      brand: pickBrand(i + 3), category: catMap["pre-workout"],
      images: [img(slug, 1), img(slug, 2), img(slug, 3)],
      price, mrp: price + rnd(200, 700), gstPct: 18,
      variants: PWO_FLAVOURS.slice(0, 3).map((f, vi) => ({
        label: `300g · ${f}`, flavour: f, size: "300g", sku: `PRE-${4000 + i}-${vi}`,
        price, mrp: price + rnd(200, 700), stock: rnd(0, 50),
      })),
      stock: rnd(15, 90),
      nutritionFacts: [
        { label: "Serving Size", value: "1 scoop (10g)" },
        { label: "L-Citrulline", value: "6 g" },
        { label: "Beta-Alanine", value: "3.2 g" },
        { label: "Caffeine", value: name.includes("Non-Stim") ? "0 mg" : "300 mg" },
      ],
      ingredients: ["L-Citrulline", "Beta-Alanine", "Betaine", "Caffeine Anhydrous", "L-Theanine", "Natural Flavours"],
      benefits: ["Explosive training energy", "Massive muscle pumps", "Enhanced focus", "Delays fatigue"],
      usage: "Mix 1 scoop with 250ml water 20-30 minutes before training.",
      tags: ["pre-workout", "energy", "pump", "focus"],
      goals: ["performance", "muscle"],
      rating: rating(), reviewCount: rnd(18, 400),
      isFeatured: i === 0, isBestseller: i === 0, status: "active",
    });
  });

  // BCAA & EAA
  [
    ["BCAA 2:1:1 Recovery", "Classic 2:1:1 branched-chain aminos for recovery."],
    ["EAA Complete", "All nine essential amino acids for full-spectrum recovery."],
    ["Intra-Workout Aminos", "Aminos plus electrolytes to sip during training."],
  ].forEach((row, i) => {
    const [name, desc] = row;
    const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, "-");
    const price = rnd(999, 1899);
    push({
      name, slug, sku: `AMINO-${5000 + i}`,
      shortDescription: "Recover faster · reduce soreness · 30 servings",
      description: `${desc} Sip during or after training to support recovery and reduce muscle breakdown.`,
      brand: pickBrand(i), category: catMap["bcaa"],
      images: [img(slug, 1), img(slug, 2), img(slug, 3)],
      price, mrp: price + rnd(150, 500), gstPct: 18,
      variants: ["Watermelon", "Green Apple", "Lemon Iced Tea"].map((f, vi) => ({
        label: `250g · ${f}`, flavour: f, size: "250g", sku: `AMINO-${5000 + i}-${vi}`,
        price, mrp: price + rnd(150, 500), stock: rnd(0, 55),
      })),
      stock: rnd(20, 100),
      nutritionFacts: [
        { label: "Serving Size", value: "1 scoop (8g)" },
        { label: "Total BCAAs", value: "5 g" },
        { label: "L-Glutamine", value: "1 g" },
      ],
      ingredients: ["L-Leucine", "L-Isoleucine", "L-Valine", "L-Glutamine", "Electrolytes", "Natural Flavours"],
      benefits: ["Speeds up recovery", "Reduces muscle soreness", "Supports hydration", "Anti-catabolic"],
      usage: "Mix 1 scoop with 300-400ml water. Sip during or after training.",
      tags: ["bcaa", "eaa", "recovery", "amino"],
      goals: ["performance", "muscle"],
      rating: rating(), reviewCount: rnd(10, 260),
      isFeatured: i === 1, isBestseller: i === 0, status: "active",
    });
  });

  // Vitamins
  [
    ["Daily Multivitamin", "23 essential vitamins & minerals for active people."],
    ["Omega-3 Fish Oil", "Triple-strength omega-3 for heart, joint and brain health."],
    ["Vitamin D3 + K2", "Sunshine vitamin with K2 for bone and immune support."],
    ["ZMA Recovery", "Zinc, magnesium and B6 for sleep and recovery."],
  ].forEach((row, i) => {
    const [name, desc] = row;
    const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, "-");
    const price = rnd(499, 1299);
    push({
      name, slug, sku: `VIT-${6000 + i}`,
      shortDescription: "Daily health support · 60 servings",
      description: `${desc} A daily essential to fill nutritional gaps and support overall health and performance.`,
      brand: brandMap["vitalcore"], category: catMap["vitamins"],
      images: [img(slug, 1), img(slug, 2), img(slug, 3)],
      price, mrp: price + rnd(100, 400), gstPct: 18,
      variants: [
        { label: "60 Capsules", size: "60 caps", sku: `VIT-${6000 + i}-0`, price, mrp: price + rnd(100, 400), stock: rnd(20, 120) },
        { label: "120 Capsules", size: "120 caps", sku: `VIT-${6000 + i}-1`, price: price + 400, mrp: price + 700, stock: rnd(20, 120) },
      ],
      stock: rnd(40, 200),
      nutritionFacts: [
        { label: "Serving Size", value: "1 capsule" },
        { label: "Servings", value: "60" },
      ],
      ingredients: ["Vitamin & Mineral Blend", "Vegetable Capsule"],
      benefits: ["Supports daily health", "Fills nutritional gaps", "Boosts immunity", "Aids recovery"],
      usage: "Take 1 capsule daily with a meal, or as directed by your physician.",
      tags: ["vitamins", "health", "wellness", "immunity"],
      goals: ["wellness"],
      rating: rating(), reviewCount: rnd(8, 200),
      isFeatured: i === 0, isBestseller: i === 1, status: "active",
    });
  });

  return P;
}

async function run() {
  await mongoose.connect(URI, { dbName: "fivexl" });
  console.log("Connected. Seeding…");

  await Promise.all([
    Category.deleteMany({}),
    Brand.deleteMany({}),
    Product.deleteMany({}),
  ]);

  const cats = await Category.insertMany(
    CATEGORIES.map((c, i) => ({ ...c, order: i, isActive: true }))
  );
  const brands = await Brand.insertMany(BRANDS.map((b) => ({ ...b, isActive: true })));

  const catMap = Object.fromEntries(cats.map((c) => [c.slug, c._id]));
  const brandMap = Object.fromEntries(brands.map((b) => [b.slug, b._id]));

  const products = buildProducts(catMap, brandMap);
  // Embedded variants need explicit _ids (loose schema won't auto-generate them).
  for (const p of products) {
    p.variants = (p.variants ?? []).map((v) => ({
      _id: new mongoose.Types.ObjectId(),
      ...v,
    }));
  }
  await Product.insertMany(products);

  console.log(`✓ Seeded ${cats.length} categories, ${brands.length} brands, ${products.length} products.`);
  await mongoose.connection.close();
  process.exit(0);
}

run().catch((e) => {
  console.error("Seed failed:", e);
  process.exit(1);
});
