"use client";

import * as React from "react";
import type { ProductDetailDTO } from "@/types/catalog";
import { cn } from "@/lib/utils";
import { formatINR } from "@/lib/format";
import { ProductImage } from "@/components/shop/product-image";
import { QuantitySelector } from "./quantity-selector";
import { AddToCartButton } from "./add-to-cart-button";
import { BuyNowButton } from "./buy-now-button";
import { useProductBuy } from "./product-buy-context";
import { useCart } from "@/components/providers/cart-provider";

/**
 * Sticky add-to-cart bar for the product detail page. It appears once the
 * inline purchase panel scrolls out of view (tracked via an Intersection
 * Observer on the `#buy-anchor` sentinel) so the primary CTA is always one tap
 * away. It shares selected variant + quantity with the inline panel through
 * ProductBuyContext. On mobile it floats just above the bottom tab bar and
 * steps aside for the "added to cart" popup.
 */
export function ProductStickyBar({ product }: { product: ProductDetailDTO }) {
  const { variant, price, mrp, qty, setQty, inStock } = useProductBuy();
  const { barOpen } = useCart();
  const [visible, setVisible] = React.useState(false);

  React.useEffect(() => {
    const anchor = document.getElementById("buy-anchor");
    if (!anchor) return;
    const io = new IntersectionObserver(
      ([entry]) => setVisible(!entry.isIntersecting),
      { rootMargin: "0px 0px -20% 0px" }
    );
    io.observe(anchor);
    return () => io.disconnect();
  }, []);

  const cartProduct = {
    id: product.id,
    slug: product.slug,
    name: product.name,
    image: product.image,
    price: product.price,
    mrp: product.mrp,
  };
  const cartVariant = variant
    ? { id: variant.id, label: variant.label, price: variant.price, mrp: variant.mrp }
    : null;

  const showDiscount = mrp > price;

  return (
    <div
      className={cn(
        "fixed inset-x-0 bottom-16 z-30 border-t border-border bg-card/95 backdrop-blur transition-all duration-300 lg:bottom-0",
        visible && !barOpen
          ? "translate-y-0 opacity-100"
          : "pointer-events-none translate-y-full opacity-0"
      )}
      style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
    >
      <div className="container-5xl flex items-center gap-3 py-2.5">
        <span className="relative hidden size-11 shrink-0 overflow-hidden rounded-lg bg-muted sm:block">
          <ProductImage
            src={product.image}
            alt={product.name}
            fill
            sizes="44px"
            className="object-cover"
          />
        </span>

        <div className="min-w-0 flex-1">
          <p className="line-clamp-1 text-sm font-semibold">{product.name}</p>
          <p className="flex items-center gap-2 text-sm">
            <span className="font-display font-bold">{formatINR(price)}</span>
            {showDiscount && (
              <span className="text-xs text-muted-foreground line-through">
                {formatINR(mrp)}
              </span>
            )}
          </p>
        </div>

        <div className="hidden sm:block">
          <QuantitySelector value={qty} onChange={setQty} />
        </div>

        <AddToCartButton
          product={cartProduct}
          variant={cartVariant}
          qty={qty}
          disabled={!inStock}
          className="h-11 flex-1 sm:flex-none sm:min-w-40"
        />
        <BuyNowButton
          product={cartProduct}
          variant={cartVariant}
          qty={qty}
          disabled={!inStock}
          className="hidden h-11 min-w-32 md:inline-flex"
        />
      </div>
    </div>
  );
}
