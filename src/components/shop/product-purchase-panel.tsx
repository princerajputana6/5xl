"use client";

import * as React from "react";
import type { ProductDetailDTO } from "@/types/catalog";
import { cn } from "@/lib/utils";
import { PriceBox } from "./price-box";
import { QuantitySelector } from "./quantity-selector";
import { AddToCartButton } from "./add-to-cart-button";
import { WishlistButton } from "./wishlist-button";

export function ProductPurchasePanel({
  product,
  initialInWishlist,
}: {
  product: ProductDetailDTO;
  initialInWishlist: boolean;
}) {
  const hasVariants = product.variants.length > 0;
  const [variantIdx, setVariantIdx] = React.useState(0);
  const [qty, setQty] = React.useState(1);

  const variant = hasVariants ? product.variants[variantIdx] : null;
  const price = variant?.price ?? product.price;
  const mrp = variant?.mrp ?? product.mrp;
  const stock = variant ? variant.stock : product.inStock ? 1 : 0;
  const inStock = stock > 0;

  return (
    <div className="space-y-5">
      <PriceBox price={price} mrp={mrp} size="lg" />

      <p className={cn("text-sm font-medium", inStock ? "text-success" : "text-destructive")}>
        {inStock ? "✓ In stock — ready to ship" : "Out of stock"}
      </p>

      {hasVariants && (
        <div>
          <p className="mb-2 text-sm font-semibold">Choose variant</p>
          <div className="flex flex-wrap gap-2">
            {product.variants.map((v, i) => {
              const disabled = v.stock <= 0;
              return (
                <button
                  key={v.id}
                  type="button"
                  disabled={disabled}
                  onClick={() => setVariantIdx(i)}
                  className={cn(
                    "rounded-md border px-3 py-2 text-sm transition-colors",
                    i === variantIdx
                      ? "border-primary bg-accent font-medium"
                      : "border-border hover:border-primary/50",
                    disabled && "cursor-not-allowed opacity-40 line-through"
                  )}
                >
                  {v.label}
                </button>
              );
            })}
          </div>
        </div>
      )}

      <div className="flex flex-wrap items-center gap-3">
        <QuantitySelector value={qty} onChange={setQty} />
        <AddToCartButton
          product={{
            id: product.id,
            slug: product.slug,
            name: product.name,
            image: product.image,
            price: product.price,
            mrp: product.mrp,
          }}
          variant={variant ? { id: variant.id, label: variant.label, price: variant.price, mrp: variant.mrp } : null}
          qty={qty}
          disabled={!inStock}
          size="lg"
          className="flex-1"
        />
        <WishlistButton
          productId={product.id}
          initialInWishlist={initialInWishlist}
          variant="full"
        />
      </div>
    </div>
  );
}
