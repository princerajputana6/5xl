// Categorise migrated blog posts from their title/excerpt/tags. Run with:
//   npm run categorize:blogs            # apply
//   npm run categorize:blogs -- --dry   # preview the distribution only
//
// SAFE: only updates the `category` field on documents in the `posts`
// collection. Never touches products, categories, or any other data.
import mongoose from "mongoose";

const URI = process.env.MONGODB_URI;
if (!URI) {
  console.error("MONGODB_URI missing. Run via `npm run categorize:blogs` (loads .env.local).");
  process.exit(1);
}

const DRY = process.argv.slice(2).includes("--dry");

const { Schema } = mongoose;
const Post = mongoose.model("Post", new Schema({}, { strict: false, timestamps: true }));

/**
 * Ordered rules — the first whose keyword appears in the haystack wins, so put
 * the most specific categories first.
 */
const RULES = [
  ["Testosterone Support", ["testosterone", "pct", "estrogen", "aromatase", "d-aspartic", "daa", "mucuna", "libido", "t:e ratio", "prolactin"]],
  ["Sleep & Recovery", ["sleep", "melatonin", "insomnia", "recovery supplement", "ashwagandha"]],
  ["Creatine", ["creatine"]],
  ["Mass Gainer", ["mass gainer", "weight gain", "weight gainer", "bulking", "bulk up"]],
  ["Pre-Workout", ["pre-workout", "pre workout", "preworkout", "pump", "citrulline", "caffeine"]],
  ["Amino Acids", ["bcaa", "eaa", "amino acid", "aminos", "glutamine"]],
  ["Protein", ["protein", "whey", "isolate", "concentrate", "casein"]],
  ["Fat Loss", ["fat loss", "fat burner", "fat-burner", "weight loss", "lean", "cutting"]],
  ["Beauty & Collagen", ["collagen", "biotin", "skin", "hair", "beauty"]],
  ["Gut & Digestion", ["gut", "probiotic", "prebiotic", "digest", "enzyme", "fiber", "fibre"]],
  ["Wellness", ["kidney", "liver", "blood pressure", "cholesterol", "heart", "immun", "multivitamin", "vitamin", "omega", "fish oil", "wellness", "health", "mineral", "magnesium", "zinc", "gummies"]],
  ["Nutrition & Diet", ["diet", "meal", "nutrition", "calorie", "macro", "recipe"]],
];

function categorise(post) {
  const hay = [
    post.title ?? "",
    post.excerpt ?? "",
    Array.isArray(post.tags) ? post.tags.join(" ") : "",
  ]
    .join(" ")
    .toLowerCase();
  for (const [cat, keys] of RULES) {
    if (keys.some((k) => hay.includes(k))) return cat;
  }
  return "Guides";
}

async function run() {
  await mongoose.connect(URI, { dbName: "fivexl" });
  const posts = await Post.find({}).select("_id title excerpt tags category").lean();

  const dist = {};
  const ops = [];
  for (const p of posts) {
    const cat = categorise(p);
    dist[cat] = (dist[cat] ?? 0) + 1;
    if (p.category !== cat) {
      ops.push({ updateOne: { filter: { _id: p._id }, update: { $set: { category: cat } } } });
    }
  }

  console.log(`Scanned ${posts.length} posts. Distribution:`);
  Object.entries(dist)
    .sort((a, b) => b[1] - a[1])
    .forEach(([c, n]) => console.log(`  ${String(n).padStart(4)}  ${c}`));
  console.log(`\n${ops.length} posts need re-categorising.`);

  if (!DRY && ops.length) {
    const res = await Post.bulkWrite(ops);
    console.log(`✓ Updated ${res.modifiedCount} posts.`);
  } else if (DRY) {
    console.log("(dry run — no changes written)");
  }

  await mongoose.disconnect();
  process.exit(0);
}

run().catch((e) => {
  console.error("categorize:blogs failed:", e);
  process.exit(1);
});
