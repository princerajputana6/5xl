import { and, asc, count, desc, eq, gte, inArray, like, lte, max, min, ne, or, sql } from "drizzle-orm";
import { db } from "@/server/db";
import { products, brands, categories } from "@/server/schema";
import type {
  ProductCardDTO,
  ProductDetailDTO,
  FacetDTO,
  ListResult,
  SortValue,
} from "@/types/catalog";
import { productFamilyKey, parseFlavour, parseSize } from "@/lib/product-options";

const PAGE_SIZE = 12;

/**
 * The imported catalogue's supplier brand doc ("Beastlife") gets restored by
 * the external import job on every reseed, so renaming it in the database
 * doesn't stick. The storefront always sells under 5XL, so the display name
 * is normalized here instead — the one place every listing/detail view reads
 * brandName from.
 */
function displayBrandName(rawName: string | null | undefined): string | null {
  return rawName ? "5XL Nutrition" : null;
}

/** Columns needed to render a product card, with brand name + category slug joined. */
const cardColumns = {
  id: products.id,
  name: products.name,
  slug: products.slug,
  images: products.images,
  price: products.price,
  mrp: products.mrp,
  rating: products.rating,
  reviewCount: products.reviewCount,
  shortDescription: products.shortDescription,
  isBestseller: products.isBestseller,
  stock: products.stock,
  brandName: brands.name,
  categorySlug: categories.slug,
} as const;

type CardRow = {
  id: string;
  name: string;
  slug: string;
  images: string[];
  price: number;
  mrp: number;
  rating: number;
  reviewCount: number;
  shortDescription: string | null;
  isBestseller: boolean;
  stock: number;
  brandName: string | null;
  categorySlug: string | null;
};

function toCardDTO(p: CardRow): ProductCardDTO {
  return {
    id: p.id,
    name: p.name,
    slug: p.slug,
    image: p.images?.[0] ?? null,
    price: p.price,
    mrp: p.mrp,
    rating: p.rating ?? 0,
    reviewCount: p.reviewCount ?? 0,
    brandName: displayBrandName(p.brandName),
    categorySlug: p.categorySlug ?? null,
    shortDescription: p.shortDescription ?? undefined,
    isBestseller: Boolean(p.isBestseller),
    inStock: (p.stock ?? 0) > 0,
  };
}

/** A card-shaped SELECT joined to brand + category (reused across queries). */
function cardQuery() {
  return db()
    .select(cardColumns)
    .from(products)
    .leftJoin(brands, eq(products.brandId, brands.id))
    .leftJoin(categories, eq(products.categoryId, categories.id));
}

export type ListParams = {
  category?: string;
  brand?: string;
  goal?: string;
  q?: string;
  minPrice?: number;
  maxPrice?: number;
  sort?: SortValue;
  page?: number;
};

export async function listProducts(params: ListParams): Promise<ListResult> {
  const conds = [eq(products.status, "active")];

  if (params.category) {
    const cat = await db()
      .select({ id: categories.id })
      .from(categories)
      .where(eq(categories.slug, params.category))
      .get();
    if (!cat) return emptyResult(params.page);
    conds.push(eq(products.categoryId, cat.id));
  }
  if (params.brand) {
    const brand = await db()
      .select({ id: brands.id })
      .from(brands)
      .where(eq(brands.slug, params.brand))
      .get();
    if (!brand) return emptyResult(params.page);
    conds.push(eq(products.brandId, brand.id));
  }
  if (params.goal) conds.push(jsonArrayHas(products.goals, params.goal));
  if (params.q) conds.push(textSearch(params.q));
  if (params.minPrice != null) conds.push(gte(products.price, params.minPrice));
  if (params.maxPrice != null) conds.push(lte(products.price, params.maxPrice));

  const where = and(...conds);
  const page = Math.max(1, params.page ?? 1);
  const offset = (page - 1) * PAGE_SIZE;

  const [rows, totalRow] = await Promise.all([
    cardQuery().where(where).orderBy(...sortOrder(params.sort)).limit(PAGE_SIZE).offset(offset).all(),
    db().select({ n: count() }).from(products).where(where).get(),
  ]);

  const total = totalRow?.n ?? 0;
  return {
    items: (rows as CardRow[]).map(toCardDTO),
    total,
    page,
    pages: Math.max(1, Math.ceil(total / PAGE_SIZE)),
    pageSize: PAGE_SIZE,
  };
}

function emptyResult(page = 1): ListResult {
  return { items: [], total: 0, page, pages: 1, pageSize: PAGE_SIZE };
}

/** SQLite `json_each` membership test for a JSON string[] column. */
function jsonArrayHas(column: typeof products.goals | typeof products.tags, value: string) {
  return sql`EXISTS (SELECT 1 FROM json_each(${column}) WHERE value = ${value})`;
}

/** Catalogue search across name / short description / tags. */
function textSearch(q: string) {
  const term = `%${q.trim()}%`;
  return or(
    like(products.name, term),
    like(products.shortDescription, term),
    like(products.tags, term)
  )!;
}

function sortOrder(sort?: SortValue) {
  switch (sort) {
    case "price-asc":
      return [asc(products.price)];
    case "price-desc":
      return [desc(products.price)];
    case "rating":
      return [desc(products.rating), desc(products.reviewCount)];
    case "newest":
      return [desc(products.createdAt)];
    default:
      return [desc(products.isBestseller), desc(products.rating)];
  }
}

export async function getProductBySlug(slug: string): Promise<ProductDetailDTO | null> {
  const p = await db()
    .select({
      ...cardColumns,
      sku: products.sku,
      description: products.description,
      gstPct: products.gstPct,
      variants: products.variants,
      nutritionFacts: products.nutritionFacts,
      ingredients: products.ingredients,
      benefits: products.benefits,
      keyBenefits: products.keyBenefits,
      usage: products.usage,
      tags: products.tags,
      goals: products.goals,
      brandSlug: brands.slug,
      categoryName: categories.name,
    })
    .from(products)
    .leftJoin(brands, eq(products.brandId, brands.id))
    .leftJoin(categories, eq(products.categoryId, categories.id))
    .where(and(eq(products.slug, slug), eq(products.status, "active")))
    .get();
  if (!p) return null;

  const card = toCardDTO(p as unknown as CardRow);

  return {
    ...card,
    sku: p.sku,
    description: p.description ?? undefined,
    images: p.images ?? [],
    gstPct: p.gstPct ?? 18,
    variants: (p.variants ?? []).map((v, i) => ({
      id: v.id || `${p.slug}-v${i}`,
      label: v.label,
      flavour: v.flavour ?? undefined,
      size: v.size ?? undefined,
      sku: v.sku,
      price: v.price,
      mrp: v.mrp,
      stock: v.stock ?? 0,
    })),
    nutritionFacts: (p.nutritionFacts ?? []).map((n) => ({ label: n.label, value: n.value })),
    ingredients: p.ingredients ?? [],
    benefits: p.benefits ?? [],
    keyBenefits: (p.keyBenefits ?? []).map((k) => ({
      title: k.title ?? "",
      description: k.description ?? "",
      images: k.images ?? [],
    })),
    usage: p.usage ?? undefined,
    tags: p.tags ?? [],
    goals: p.goals ?? [],
    brandSlug: p.brandSlug ?? null,
    categoryName: p.categoryName ?? null,
  };
}

export async function getRelatedProducts(
  slug: string,
  categorySlug: string | null,
  limit = 4
): Promise<ProductCardDTO[]> {
  if (!categorySlug) return [];
  const cat = await db()
    .select({ id: categories.id })
    .from(categories)
    .where(eq(categories.slug, categorySlug))
    .get();
  if (!cat) return [];
  const rows = await cardQuery()
    .where(
      and(eq(products.categoryId, cat.id), ne(products.slug, slug), eq(products.status, "active"))
    )
    .orderBy(desc(products.rating))
    .limit(limit)
    .all();
  return (rows as CardRow[]).map(toCardDTO);
}

async function findByFlag(flag: "isFeatured" | "isBestseller", limit: number) {
  const col = flag === "isFeatured" ? products.isFeatured : products.isBestseller;
  const rows = await cardQuery()
    .where(and(eq(col, true), eq(products.status, "active")))
    .orderBy(desc(products.rating))
    .limit(limit)
    .all();
  return (rows as CardRow[]).map(toCardDTO);
}

export const getFeaturedProducts = (limit = 8) => findByFlag("isFeatured", limit);
export const getBestsellers = (limit = 8) => findByFlag("isBestseller", limit);

/** Products for the given slugs, preserving the requested order (CMS picker). */
export async function getProductsBySlugs(slugs: string[]): Promise<ProductCardDTO[]> {
  const wanted = slugs.filter(Boolean);
  if (wanted.length === 0) return [];
  const rows = await cardQuery()
    .where(and(inArray(products.slug, wanted), eq(products.status, "active")))
    .all();
  const bySlug = new Map((rows as CardRow[]).map((d) => [d.slug, toCardDTO(d)]));
  return wanted.map((s) => bySlug.get(s)).filter((p): p is ProductCardDTO => Boolean(p));
}

/** Active products within a category (by slug), newest first. */
export async function getProductsByCategorySlug(
  slug: string,
  limit = 8
): Promise<ProductCardDTO[]> {
  if (!slug) return [];
  const cat = await db()
    .select({ id: categories.id })
    .from(categories)
    .where(eq(categories.slug, slug))
    .get();
  if (!cat) return [];
  const rows = await cardQuery()
    .where(and(eq(products.categoryId, cat.id), eq(products.status, "active")))
    .orderBy(desc(products.createdAt))
    .limit(limit)
    .all();
  return (rows as CardRow[]).map(toCardDTO);
}

/** Lightweight product list for admin pickers: `{ slug, name }`. */
export async function listProductsForPicker(): Promise<{ slug: string; name: string }[]> {
  const rows = await db()
    .select({ slug: products.slug, name: products.name })
    .from(products)
    .where(eq(products.status, "active"))
    .orderBy(asc(products.name))
    .all();
  return rows.map((d) => ({ slug: d.slug, name: d.name }));
}

export type ProductOption = {
  label: string;
  slug: string;
  inStock: boolean;
  isCurrent: boolean;
  image: string | null;
  price: number | null;
  /** For size options: price per kg, when the label resolves to a weight. */
  pricePerKg: number | null;
};

export type ProductOptions = {
  flavours: ProductOption[];
  sizes: ProductOption[];
  currentFlavour: string | null;
  currentSize: string | null;
};

/**
 * Flavour and pack-size swatches for a product. The catalogue stores each
 * flavour/size as its own product, so options are gathered from siblings that
 * share the same product-family prefix and link across to that product's page.
 */
export async function getProductOptions(
  name: string,
  slug: string
): Promise<ProductOptions> {
  const family = productFamilyKey(name);
  const currentFlavour = parseFlavour(name);
  const currentSize = parseSize(name);

  // Gather siblings sharing the same product-family prefix. D1 rejects long
  // LIKE patterns ("pattern too complex"), and the family key can be ~50+ chars,
  // so group in-JS over the (small) active catalogue instead of a prefix LIKE.
  const all = await db()
    .select({
      name: products.name,
      slug: products.slug,
      stock: products.stock,
      images: products.images,
      price: products.price,
    })
    .from(products)
    .where(eq(products.status, "active"))
    .all();
  const docs = all.filter((d) => productFamilyKey(d.name) === family).slice(0, 40);

  const flavours = new Map<string, ProductOption>();
  const sizes = new Map<string, ProductOption>();

  for (const d of docs) {
    const inStock = (d.stock ?? 0) > 0;
    const isCurrent = d.slug === slug;
    const image = (d.images ?? [])[0] ?? null;
    const price = d.price ?? null;

    const flavour = parseFlavour(d.name);
    if (flavour && (!flavours.has(flavour) || isCurrent)) {
      flavours.set(flavour, {
        label: flavour,
        slug: d.slug,
        inStock,
        isCurrent,
        image,
        price,
        pricePerKg: null,
      });
    }

    const size = parseSize(d.name);
    // Only offer sizes within the flavour the shopper is already looking at,
    // otherwise switching size would silently change flavour too.
    const sameFlavour = !currentFlavour || flavour === currentFlavour;
    if (size && sameFlavour && (!sizes.has(size) || isCurrent)) {
      sizes.set(size, {
        label: size,
        slug: d.slug,
        inStock,
        isCurrent,
        image,
        price,
        pricePerKg: price != null ? pricePerKg(size, price) : null,
      });
    }
  }

  return {
    flavours: [...flavours.values()].sort(byLabel),
    sizes: [...sizes.values()].sort(bySize),
    currentFlavour,
    currentSize,
  };
}

function byLabel(a: ProductOption, b: ProductOption) {
  return a.label.localeCompare(b.label);
}

function bySize(a: ProductOption, b: ProductOption) {
  return (parseFloat(a.label) || 0) - (parseFloat(b.label) || 0);
}

/** Converts a size label (e.g. "2KG", "500G") + price into a ₹/kg figure. */
function pricePerKg(sizeLabel: string, price: number): number | null {
  const m = sizeLabel.match(/^([\d.]+)\s*(KG|G|GM|GMS)$/i);
  if (!m) return null;
  const value = parseFloat(m[1]);
  if (!value) return null;
  const unit = m[2].toUpperCase();
  const kg = unit === "KG" ? value : value / 1000;
  if (kg <= 0) return null;
  return Math.round(price / kg);
}

export async function getFacets(): Promise<FacetDTO> {
  const [cats, brs, priceAgg] = await Promise.all([
    db().select().from(categories).where(eq(categories.isActive, true)).orderBy(asc(categories.order)).all(),
    db().select().from(brands).where(eq(brands.isActive, true)).orderBy(asc(brands.name)).all(),
    db()
      .select({ min: min(products.price), max: max(products.price) })
      .from(products)
      .where(eq(products.status, "active"))
      .get(),
  ]);

  return {
    categories: cats.map((c) => ({ name: c.name, slug: c.slug, emoji: c.emoji ?? undefined })),
    brands: brs.map((b) => ({ name: displayBrandName(b.name) ?? b.name, slug: b.slug })),
    priceRange: {
      min: priceAgg?.min ?? 0,
      max: priceAgg?.max ?? 5000,
    },
  };
}

export async function listBrands() {
  const [brs, counts] = await Promise.all([
    db().select().from(brands).where(eq(brands.isActive, true)).orderBy(asc(brands.name)).all(),
    db()
      .select({ brandId: products.brandId, n: count() })
      .from(products)
      .where(eq(products.status, "active"))
      .groupBy(products.brandId)
      .all(),
  ]);
  const countMap = new Map(counts.map((c) => [c.brandId, c.n]));
  return brs.map((b) => ({
    id: b.id,
    name: displayBrandName(b.name) ?? b.name,
    slug: b.slug,
    description: b.description ?? null,
    logo: b.logo ?? null,
    productCount: countMap.get(b.id) ?? 0,
  }));
}
