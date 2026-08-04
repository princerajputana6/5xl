import Link from "next/link";
import Image from "next/image";
import type { ProductCardDTO } from "@/types/catalog";
import { Rating } from "./rating";
import { PriceBox } from "./price-box";
import { AddToCartButton } from "./add-to-cart-button";
import { WishlistButton } from "./wishlist-button";
import { discountPct } from "@/lib/format";

export function ProductCard({
  product,
  inWishlist = false,
}: {
  product: ProductCardDTO;
  inWishlist?: boolean;
}) {
  const pct = discountPct(product.mrp, product.price);

  return (
    <div className="group relative flex flex-col overflow-hidden rounded-xl border border-border bg-card transition-colors hover:border-primary/60">
      {/* Media */}
      <div className="relative aspect-square overflow-hidden bg-muted">
        <Link
          href={`/products/${product.slug}`}
          aria-label={product.name}
          className="absolute inset-0 block"
        >
          {product.image ? (
            <Image
              src={product.image}
              alt={product.name}
              fill
              sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
              className="object-cover transition-transform duration-300 group-hover:scale-105"
            />
          ) : (
            <div className="grid h-full place-items-center text-4xl">🥤</div>
          )}
        </Link>

        <div className="absolute left-2 top-2 flex flex-col gap-1">
          {product.isBestseller && (
            <span className="rounded-full bg-primary px-2 py-0.5 text-[0.65rem] font-bold uppercase tracking-wide text-primary-foreground">
              Bestseller
            </span>
          )}
          {pct > 0 && (
            <span className="rounded-full bg-neutral-900 px-2 py-0.5 text-[0.65rem] font-bold uppercase tracking-wide text-white">
              {pct}% off
            </span>
          )}
        </div>

        <div className="absolute right-2 top-2">
          <WishlistButton productId={product.id} initialInWishlist={inWishlist} />
        </div>
      </div>

      {/* Body */}
      <div className="flex flex-1 flex-col gap-2 p-4">
        {product.brandName && (
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            {product.brandName}
          </p>
        )}
        <Link href={`/products/${product.slug}`} className="line-clamp-2 font-medium leading-snug hover:text-primary">
          {product.name}
        </Link>
        <Rating value={product.rating} count={product.reviewCount} />
        <PriceBox price={product.price} mrp={product.mrp} className="mt-auto pt-1" />
        <AddToCartButton
          product={{
            id: product.id,
            slug: product.slug,
            name: product.name,
            image: product.image,
            price: product.price,
            mrp: product.mrp,
          }}
          disabled={!product.inStock}
          size="sm"
          className="mt-1 w-full"
        />
      </div>
    </div>
  );
}
