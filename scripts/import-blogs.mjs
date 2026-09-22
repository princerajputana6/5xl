// Migrate legacy blog posts from the5xlnutrition.com into the Post collection.
//
// Usage:
//   npm run import:blogs                 # import all (skips slugs already present)
//   npm run import:blogs -- --limit 5    # only the first 5 (good for a test run)
//   npm run import:blogs -- --force      # re-import & overwrite existing slugs
//   npm run import:blogs -- --dry        # fetch + parse, but do not write to the DB
//
// Reads the URL list from scripts/blog-urls.json. Extraction is best-effort
// (WordPress `.entry-content`); admins can refine any post afterwards in the
// admin Blog editor.

import mongoose from "mongoose";
import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const __dirname = dirname(fileURLToPath(import.meta.url));

const URI = process.env.MONGODB_URI;
if (!URI) {
  console.error("MONGODB_URI missing. Run via `npm run import:blogs` (loads .env.local).");
  process.exit(1);
}

const args = process.argv.slice(2);
const DRY = args.includes("--dry");
const FORCE = args.includes("--force");
const limitArg = args.indexOf("--limit");
const LIMIT = limitArg !== -1 ? Number(args[limitArg + 1]) : Infinity;
const CONCURRENCY = 4;

const { Schema } = mongoose;
const Post = mongoose.model(
  "Post",
  new Schema({}, { strict: false, timestamps: true })
);

/* ----------------------------- helpers ----------------------------- */

function meta(html, prop) {
  // property="og:x" or name="x"
  const re = new RegExp(
    `<meta[^>]+(?:property|name)=["']${prop}["'][^>]*content=["']([^"']*)["']`,
    "i"
  );
  const m = html.match(re);
  if (m) return decode(m[1]);
  const re2 = new RegExp(
    `<meta[^>]+content=["']([^"']*)["'][^>]*(?:property|name)=["']${prop}["']`,
    "i"
  );
  const m2 = html.match(re2);
  return m2 ? decode(m2[1]) : "";
}

function decode(s) {
  return (s || "")
    .replace(/&amp;/g, "&")
    .replace(/&#0?39;|&apos;/g, "'")
    .replace(/&quot;/g, '"')
    .replace(/&#8217;|&#x2019;/g, "’")
    .replace(/&#8216;|&#x2018;/g, "‘")
    .replace(/&#8211;/g, "–")
    .replace(/&#8212;/g, "—")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&nbsp;/g, " ")
    .trim();
}

function slugFromUrl(url) {
  try {
    return new URL(url).pathname.replace(/^\/|\/$/g, "").split("/").pop() || "";
  } catch {
    return "";
  }
}

function extractContent(html) {
  const start = html.search(/class=["']entry-content["'][^>]*>/i);
  if (start === -1) return "";
  const open = html.indexOf(">", start) + 1;
  // Content ends at the entry footer / post footer.
  const footer = html.slice(open).search(/<footer|class=["']entry-footer/i);
  let body = footer !== -1 ? html.slice(open, open + footer) : html.slice(open);
  // Trim to the last closing </div> so we don't keep a dangling opener.
  const lastClose = body.lastIndexOf("</div>");
  if (lastClose !== -1) body = body.slice(0, lastClose);
  return cleanup(body);
}

function cleanup(html) {
  return (
    html
      // strip scripts, styles, noscript, comments
      .replace(/<script[\s\S]*?<\/script>/gi, "")
      .replace(/<style[\s\S]*?<\/style>/gi, "")
      .replace(/<noscript[\s\S]*?<\/noscript>/gi, "")
      .replace(/<!--[\s\S]*?-->/g, "")
      // drop the duplicate WP post-title block (the page renders the title itself)
      .replace(/<h[1-3][^>]*class=["'][^"']*wp-block-post-title[^"']*["'][^>]*>[\s\S]*?<\/h[1-3]>/gi, "")
      // lazy-loaded images -> real src
      .replace(/data-lazy-src=/gi, "src=")
      .replace(/data-src=/gi, "src=")
      // drop inline event handlers
      .replace(/\son\w+=["'][^"']*["']/gi, "")
      // common WP share / ad / related blocks (best-effort, non-nested)
      .replace(/<div[^>]*class=["'][^"']*(sharedaddy|addtoany|code-block|yarpp|wp-block-post-comments)[^"']*["'][\s\S]*?<\/div>/gi, "")
      .replace(/\n{3,}/g, "\n\n")
      .trim()
  );
}

function jsonLdSection(html) {
  const m = html.match(/"articleSection":\s*\[?\s*"([^"]+)"/i);
  return m ? decode(m[1]) : "";
}

function readingMinutes(html) {
  const words = html.replace(/<[^>]+>/g, " ").split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.round(words / 200));
}

async function fetchPost(url) {
  const res = await fetch(url, {
    headers: { "user-agent": "Mozilla/5.0 (5XL blog importer)" },
    redirect: "follow",
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const html = await res.text();

  const slug = slugFromUrl(url);
  const rawTitle = meta(html, "og:title") || (html.match(/<title>([^<]*)<\/title>/i)?.[1] ?? "");
  const title = decode(rawTitle).replace(/\s*[|–-]\s*The 5XL Nutrition\s*$/i, "").trim();
  const contentHtml = extractContent(html);
  const publishedRaw = meta(html, "article:published_time");
  const category = jsonLdSection(html) || "Blog";

  return {
    slug,
    title: title || slug,
    excerpt: meta(html, "og:description") || meta(html, "description") || "",
    coverImage: meta(html, "og:image") || "",
    contentHtml,
    category: category === "Blog" ? "General" : category,
    author: "The 5XL Nutrition",
    status: "published",
    publishedAt: publishedRaw ? new Date(publishedRaw) : new Date(),
    readingMinutes: readingMinutes(contentHtml),
    sourceUrl: url,
  };
}

/* ------------------------------ run ------------------------------ */

async function run() {
  await mongoose.connect(URI, { dbName: "fivexl" });
  const urls = JSON.parse(await readFile(join(__dirname, "blog-urls.json"), "utf8")).slice(0, LIMIT);

  console.log(`Importing ${urls.length} posts (dry=${DRY}, force=${FORCE})…`);

  let ok = 0;
  let skipped = 0;
  let failed = 0;

  // simple bounded-concurrency pool
  let idx = 0;
  async function worker() {
    while (idx < urls.length) {
      const url = urls[idx++];
      const slug = slugFromUrl(url);
      try {
        if (!FORCE) {
          const exists = await Post.findOne({ slug }).select("_id").lean();
          if (exists) {
            skipped++;
            continue;
          }
        }
        const doc = await fetchPost(url);
        if (!doc.contentHtml || doc.contentHtml.length < 200) {
          console.warn(`  ⚠ thin content: ${slug} (${doc.contentHtml.length} chars)`);
        }
        if (!DRY) {
          await Post.updateOne({ slug }, { $set: doc }, { upsert: true });
        }
        ok++;
        if (ok % 20 === 0) console.log(`  …${ok} imported`);
      } catch (err) {
        failed++;
        console.warn(`  ✗ ${slug}: ${err.message}`);
      }
    }
  }

  await Promise.all(Array.from({ length: CONCURRENCY }, worker));

  console.log(`\nDone. imported=${ok} skipped=${skipped} failed=${failed}`);
  await mongoose.disconnect();
  process.exit(0);
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
