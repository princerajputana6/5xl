import type { QueryFilter } from "mongoose";
import { connectDB } from "@/server/db";
import { Product, type ProductDoc } from "@/server/models/Product";
import { Category } from "@/server/models/Category";
import { Brand } from "@/server/models/Brand";
import type {
  ProductCardDTO,
  ProductDetailDTO,
  FacetDTO,
  ListResult,
  SortValue,
} from "@/types/catalog";
import { productFamilyKey, parseFlavour, parseSize } from "@/lib/product-options";

const PAGE_SIZE = 12;

type PopulatedRef = { name?: string; slug?: string } | null | undefined;

/**
 * The imported catalogue's supplier brand doc ("Beastlife") gets restored by
 * the external import job on every reseed, so renaming it in the database
 * doesn't stick. The storefront always sells under 5XL, so the display name
 * is normalized here instead — the one place every listing/detail view reads
 * brandName from.
 */
function displayBrandName(rawName: string | undefined): string | null {
  return rawName ? "5XL Nutrition" : null;
}

function toCardDTO(p: Record<string, unknown>): ProductCardDTO {
  const brand = p.brand as PopulatedRef;
  const category = p.category as PopulatedRef;
  const images = (p.images as string[]) ?? [];
  return {
    id: String(p._id),
    name: p.name as string,
    slug: p.slug as string,
    image: images[0] ?? null,
    price: p.price as number,
    mrp: p.mrp as number,
    rating: (p.rating as number) ?? 0,
    reviewCount: (p.reviewCount as number) ?? 0,
    brandName: displayBrandName(brand?.name),
    categorySlug: category?.slug ?? null,
    shortDescription: p.shortDescription as string | undefined,
    isBestseller: Boolean(p.isBestseller),
    inStock: ((p.stock as number) ?? 0) > 0,
  };
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
  await connectDB();

  const filter: QueryFilter<ProductDoc> = { status: "active" };

  if (params.category) {
    const cat = await Category.findOne({ slug: params.category }).select("_id").lean();
    if (cat) filter.category = cat._id;
    else return emptyResult(params.page);
  }
  if (params.brand) {
    const brand = await Brand.findOne({ slug: params.brand }).select("_id").lean();
    if (brand) filter.brand = brand._id;
    else return emptyResult(params.page);
  }
  if (params.goal) filter.goals = params.goal;
  if (params.q) filter.$text = { $search: params.q };
  if (params.minPrice != null || params.maxPrice != null) {
    const price: { $gte?: number; $lte?: number } = {};
    if (params.minPrice != null) price.$gte = params.minPrice;
    if (params.maxPrice != null) price.$lte = params.maxPrice;
    filter.price = price;
  }

  const sort = sortToMongo(params.sort);
  const page = Math.max(1, params.page ?? 1);
  const skip = (page - 1) * PAGE_SIZE;

  const [docs, total] = await Promise.all([
    Product.find(filter)
      .populate("brand", "name slug")
      .populate("category", "name slug")
      .sort(sort)
      .skip(skip)
      .limit(PAGE_SIZE)
      .lean(),
    Product.countDocuments(filter),
  ]);

  return {
    items: docs.map(toCardDTO),
    total,
    page,
    pages: Math.max(1, Math.ceil(total / PAGE_SIZE)),
    pageSize: PAGE_SIZE,
  };
}

function emptyResult(page = 1): ListResult {
  return { items: [], total: 0, page, pages: 1, pageSize: PAGE_SIZE };
}

function sortToMongo(sort?: SortValue): Record<string, 1 | -1> {
  switch (sort) {
    case "price-asc":
      return { price: 1 };
    case "price-desc":
      return { price: -1 };
    case "rating":
      return { rating: -1, reviewCount: -1 };
    case "newest":
      return { createdAt: -1 };
    default:
      return { isBestseller: -1, rating: -1 };
  }
}

export async function getProductBySlug(slug: string): Promise<ProductDetailDTO | null> {
  await connectDB();
  const p = await Product.findOne({ slug, status: "active" })
    .populate("brand", "name slug")
    .populate("category", "name slug")
    .lean();
  if (!p) return null;

  const brand = p.brand as PopulatedRef;
  const category = p.category as PopulatedRef;
  const card = toCardDTO(p as Record<string, unknown>);

  return {
    ...card,
    sku: p.sku,
    description: p.description ?? undefined,
    images: (p.images as string[]) ?? [],
    gstPct: p.gstPct ?? 18,
    variants: (p.variants ?? []).map((v, i) => ({
      id: v._id ? String(v._id) : `${p.slug}-v${i}`,
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
    usage: p.usage ?? undefined,
    tags: p.tags ?? [],
    goals: p.goals ?? [],
    brandSlug: brand?.slug ?? null,
    categoryName: category?.name ?? null,
  };
}

export async function getRelatedProducts(
  slug: string,
  categorySlug: string | null,
  limit = 4
): Promise<ProductCardDTO[]> {
  await connectDB();
  if (!categorySlug) return [];
  const cat = await Category.findOne({ slug: categorySlug }).select("_id").lean();
  if (!cat) return [];
  const docs = await Product.find({ category: cat._id, slug: { $ne: slug }, status: "active" })
    .populate("brand", "name slug")
    .populate("category", "name slug")
    .sort({ rating: -1 })
    .limit(limit)
    .lean();
  return docs.map(toCardDTO);
}

async function findByFlag(flag: "isFeatured" | "isBestseller", limit: number) {
  await connectDB();
  const docs = await Product.find({ [flag]: true, status: "active" })
    .populate("brand", "name slug")
    .populate("category", "name slug")
    .sort({ rating: -1 })
    .limit(limit)
    .lean();
  return docs.map(toCardDTO);
}

export const getFeaturedProducts = (limit = 8) => findByFlag("isFeatured", limit);
export const getBestsellers = (limit = 8) => findByFlag("isBestseller", limit);

export type ProductOption = {
  label: string;
  slug: string;
  inStock: boolean;
  isCurrent: boolean;
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
  await connectDB();

  const family = productFamilyKey(name);
  const currentFlavour = parseFlavour(name);
  const currentSize = parseSize(name);

  const docs = await Product.find({
    status: "active",
    name: { $regex: `^${escapeRegex(family)}`, $options: "i" },
  })
    .select("name slug stock")
    .limit(40)
    .lean();

  const flavours = new Map<string, ProductOption>();
  const sizes = new Map<string, ProductOption>();

  for (const d of docs) {
    const inStock = ((d.stock as number) ?? 0) > 0;
    const isCurrent = d.slug === slug;

    const flavour = parseFlavour(d.name);
    if (flavour && (!flavours.has(flavour) || isCurrent)) {
      flavours.set(flavour, { label: flavour, slug: d.slug, inStock, isCurrent });
    }

    const size = parseSize(d.name);
    // Only offer sizes within the flavour the shopper is already looking at,
    // otherwise switching size would silently change flavour too.
    const sameFlavour = !currentFlavour || flavour === currentFlavour;
    if (size && sameFlavour && (!sizes.has(size) || isCurrent)) {
      sizes.set(size, { label: size, slug: d.slug, inStock, isCurrent });
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

function escapeRegex(s: string) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

export async function getFacets(): Promise<FacetDTO> {
  await connectDB();
  const [categories, brands, priceAgg] = await Promise.all([
    Category.find({ isActive: true }).sort({ order: 1 }).lean(),
    Brand.find({ isActive: true }).sort({ name: 1 }).lean(),
    Product.aggregate<{ _id: null; min: number; max: number }>([
      { $match: { status: "active" } },
      { $group: { _id: null, min: { $min: "$price" }, max: { $max: "$price" } } },
    ]),
  ]);

  return {
    categories: categories.map((c) => ({ name: c.name, slug: c.slug, emoji: c.emoji ?? undefined })),
    brands: brands.map((b) => ({ name: displayBrandName(b.name) ?? b.name, slug: b.slug })),
    priceRange: {
      min: priceAgg[0]?.min ?? 0,
      max: priceAgg[0]?.max ?? 5000,
    },
  };
}

export async function listBrands() {
  await connectDB();
  const [brands, counts] = await Promise.all([
    Brand.find({ isActive: true }).sort({ name: 1 }).lean(),
    Product.aggregate<{ _id: string; count: number }>([
      { $match: { status: "active" } },
      { $group: { _id: "$brand", count: { $sum: 1 } } },
    ]),
  ]);
  const countMap = new Map(counts.map((c) => [String(c._id), c.count]));
  return brands.map((b) => ({
    id: String(b._id),
    name: displayBrandName(b.name) ?? b.name,
    slug: b.slug,
    description: b.description ?? null,
    logo: b.logo ?? null,
    productCount: countMap.get(String(b._id)) ?? 0,
  }));
}
