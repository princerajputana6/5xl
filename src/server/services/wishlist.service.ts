import { connectDB } from "@/server/db";
import { Wishlist } from "@/server/models/Wishlist";
import { Product } from "@/server/models/Product";
import type { ProductCardDTO } from "@/types/catalog";

export async function getWishlistProductIds(userId: string): Promise<string[]> {
  await connectDB();
  const wl = await Wishlist.findOne({ user: userId }).select("products").lean();
  return (wl?.products ?? []).map((p) => String(p));
}

/** Toggle a product in the user's wishlist. Returns the new state. */
export async function toggleWishlist(
  userId: string,
  productId: string
): Promise<{ inWishlist: boolean }> {
  await connectDB();
  const wl = await Wishlist.findOne({ user: userId });

  if (!wl) {
    await Wishlist.create({ user: userId, products: [productId] });
    return { inWishlist: true };
  }

  const exists = wl.products.some((p) => String(p) === productId);
  if (exists) {
    wl.products = wl.products.filter((p) => String(p) !== productId);
    await wl.save();
    return { inWishlist: false };
  }
  wl.products.push(productId as never);
  await wl.save();
  return { inWishlist: true };
}

export async function getWishlistProducts(userId: string): Promise<ProductCardDTO[]> {
  await connectDB();
  const wl = await Wishlist.findOne({ user: userId }).lean();
  if (!wl || wl.products.length === 0) return [];

  const ids = wl.products.map((p) => String(p));
  const docs = await Product.find({ _id: { $in: ids }, status: "active" })
    .populate("brand", "name slug")
    .populate("category", "name slug")
    .lean();

  return docs.map((p) => {
    const brand = p.brand as { name?: string } | null;
    const category = p.category as { slug?: string } | null;
    const images = (p.images as string[]) ?? [];
    return {
      id: String(p._id),
      name: p.name,
      slug: p.slug,
      image: images[0] ?? null,
      price: p.price,
      mrp: p.mrp,
      rating: p.rating ?? 0,
      reviewCount: p.reviewCount ?? 0,
      brandName: brand?.name ?? null,
      categorySlug: category?.slug ?? null,
      shortDescription: p.shortDescription ?? undefined,
      isBestseller: Boolean(p.isBestseller),
      inStock: (p.stock ?? 0) > 0,
    };
  });
}
