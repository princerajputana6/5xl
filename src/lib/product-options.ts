/**
 * The imported catalogue models flavours and pack sizes as separate products
 * rather than mongo variants ("… | Blueberry | 115G" vs "… | Shikanji | 305G").
 * These helpers parse those names so the detail page can show flavour and size
 * swatches that link across to the matching sibling product.
 */

const SIZE_RE = /^\d[\d.]*\s*(?:g|gm|gms|kg|ml|l|n)$/i;

const FLAVOURS = [
  "unflavoured",
  "unflavored",
  "blueberry",
  "shikanji",
  "tropical tango",
  "watermelon",
  "peach",
  "litchi",
  "lychee",
  "chocolate",
  "rich chocolate",
  "double chocolate",
  "cold coffee",
  "coffee",
  "malai kulfi",
  "kesar",
  "elaichi",
  "paan",
  "mango",
  "orange",
  "lemon",
  "lemonade",
  "strawberry",
  "vanilla",
  "cookies & cream",
  "cookies and cream",
  "guava",
  "green apple",
  "apple",
  "pineapple",
  "cola",
  "mixed fruit",
  "banana",
  "butterscotch",
];

export function nameTokens(name: string): string[] {
  return name
    .split("|")
    .map((t) => t.replace(/\s+/g, " ").trim())
    .filter(Boolean);
}

/** The grouping key shared by every flavour/size of the same product line. */
export function productFamilyKey(name: string): string {
  return (nameTokens(name)[0] ?? name).toLowerCase();
}

export function parseSize(name: string): string | null {
  for (const t of nameTokens(name)) {
    if (SIZE_RE.test(t)) return t.toUpperCase().replace(/\s+/g, "");
  }
  const each = name.match(/\(([\d.]+\s*(?:g|gm|kg|ml))\s*each\)/i);
  if (each) return each[1].toUpperCase().replace(/\s+/g, "");
  return null;
}

export function parseFlavour(name: string): string | null {
  for (const t of nameTokens(name)) {
    const lower = t.toLowerCase();
    const hit = FLAVOURS.find((f) => lower === f);
    if (hit) return titleCase(t);
  }
  // Fall back to a contained match for names that bundle the flavour with copy.
  const lower = name.toLowerCase();
  const hit = FLAVOURS.find((f) => lower.includes(` ${f} `) || lower.endsWith(` ${f}`));
  return hit ? titleCase(hit) : null;
}

function titleCase(s: string): string {
  return s
    .toLowerCase()
    .split(" ")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}
