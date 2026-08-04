import type { Metadata } from "next";
import { Heart } from "lucide-react";
import { requireUser } from "@/lib/session";
import { getWishlistProducts } from "@/server/services/wishlist.service";
import { ProductCard } from "@/components/shop/product-card";
import { EmptyState } from "@/components/shared/empty-state";

export const metadata: Metadata = { title: "My Wishlist" };

export default async function WishlistPage() {
  const user = await requireUser();
  const products = await getWishlistProducts(user.id);

  return (
    <div className="container-5xl py-10">
      <h1 className="mb-6 font-display text-3xl font-extrabold uppercase tracking-tight">
        My Wishlist
      </h1>

      {products.length === 0 ? (
        <EmptyState
          icon={<Heart className="size-10" />}
          title="Your wishlist is empty"
          description="Save products you love and find them here anytime."
          actionLabel="Explore products"
          actionHref="/products"
        />
      ) : (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {products.map((p) => (
            <ProductCard key={p.id} product={p} inWishlist />
          ))}
        </div>
      )}
    </div>
  );
}
