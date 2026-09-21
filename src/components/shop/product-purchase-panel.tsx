"use client";

import { Wallet } from "lucide-react";
import type { ProductDetailDTO } from "@/types/catalog";
import { cn } from "@/lib/utils";
import { formatINR } from "@/lib/format";
import { QuantitySelector } from "./quantity-selector";
import { AddToCartButton } from "./add-to-cart-button";
import { BuyNowButton } from "./buy-now-button";
import { ShareButton } from "./share-button";
import { useProductBuy } from "./product-buy-context";

const CASHBACK_PCT = 0.01;

export function ProductPurchasePanel({ product }: { product: ProductDetailDTO }) {
  const { variantIdx, setVariantIdx, qty, setQty, variant, price, inStock } =
    useProductBuy();
  const hasVariants = product.variants.length > 1;
  const cashback = Math.round(price * qty * CASHBACK_PCT);

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

  return (
    <div className="space-y-4">
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
                    "rounded-md border px-3.5 py-2 text-sm transition-all duration-200",
                    "hover:-translate-y-0.5 hover:border-primary hover:shadow-sm",
                    i === variantIdx
                      ? "border-primary bg-accent font-semibold shadow-sm ring-1 ring-primary/30"
                      : "border-border",
                    disabled && "cursor-not-allowed opacity-40 line-through hover:translate-y-0"
                  )}
                >
                  {v.label}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {inStock && cashback > 0 && (
        <p className="flex items-center gap-2 rounded-lg bg-success/10 px-3 py-2 text-sm text-success">
          <Wallet className="size-4 shrink-0" />
          Earn <strong>{formatINR(cashback)}</strong> cashback on this purchase
        </p>
      )}

      <div className="space-y-3">
        <div className="flex flex-wrap items-center gap-3">
          <QuantitySelector value={qty} onChange={setQty} />
          <AddToCartButton
            product={cartProduct}
            variant={cartVariant}
            qty={qty}
            disabled={!inStock}
            size="lg"
            className="h-11 flex-1 transition-transform active:scale-95"
          />
          <ShareButton title={product.name} variant="full" className="shrink-0" />
        </div>

        <BuyNowButton
          product={cartProduct}
          variant={cartVariant}
          qty={qty}
          disabled={!inStock}
          className="h-11 w-full"
        />
      </div>
    </div>
  );
}
