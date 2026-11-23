import { and, eq, inArray } from "drizzle-orm";
import { db } from "@/server/db";
import { wishlists, products, brands, categories } from "@/server/schema";
import type { ProductCardDTO } from "@/types/catalog";

export async function getWishlistProductIds(userId: string): Promise<string[]> {
  const wl = await db()
    .select({ productIds: wishlists.productIds })
    .from(wishlists)
    .where(eq(wishlists.userId, userId))
    .get();
  return wl?.productIds ?? [];
}

/** Toggle a product in the user's wishlist. Returns the new state. */
export async function toggleWishlist(
  userId: string,
  productId: string
): Promise<{ inWishlist: boolean }> {
  const wl = await db().select().from(wishlists).where(eq(wishlists.userId, userId)).get();

  if (!wl) {
    await db().insert(wishlists).values({ userId, productIds: [productId] });
    return { inWishlist: true };
  }

  const current = wl.productIds ?? [];
  const exists = current.includes(productId);
  const next = exists ? current.filter((p) => p !== productId) : [...current, productId];
  await db().update(wishlists).set({ productIds: next }).where(eq(wishlists.userId, userId));
  return { inWishlist: !exists };
}

export async function getWishlistProducts(userId: string): Promise<ProductCardDTO[]> {
  const ids = await getWishlistProductIds(userId);
  if (ids.length === 0) return [];

  const docs = await db()
    .select({
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
    })
    .from(products)
    .leftJoin(brands, eq(products.brandId, brands.id))
    .leftJoin(categories, eq(products.categoryId, categories.id))
    .where(and(inArray(products.id, ids), eq(products.status, "active")))
    .all();

  return docs.map((p) => ({
    id: p.id,
    name: p.name,
    slug: p.slug,
    image: (p.images ?? [])[0] ?? null,
    price: p.price,
    mrp: p.mrp,
    rating: p.rating ?? 0,
    reviewCount: p.reviewCount ?? 0,
    brandName: p.brandName ?? null,
    categorySlug: p.categorySlug ?? null,
    shortDescription: p.shortDescription ?? undefined,
    isBestseller: Boolean(p.isBestseller),
    inStock: (p.stock ?? 0) > 0,
  }));
}
