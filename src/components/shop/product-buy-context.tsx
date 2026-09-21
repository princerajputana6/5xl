"use client";

import * as React from "react";
import type { ProductDetailDTO, VariantDTO } from "@/types/catalog";

/**
 * Shared buy-state for a single product detail page. Both the inline purchase
 * panel and the sticky add-to-cart bar read/write the same selected variant
 * and quantity so they never drift out of sync.
 */
type ProductBuyValue = {
  product: ProductDetailDTO;
  variantIdx: number;
  setVariantIdx: (i: number) => void;
  qty: number;
  setQty: (n: number) => void;
  variant: VariantDTO | null;
  price: number;
  mrp: number;
  stock: number;
  inStock: boolean;
};

const ProductBuyContext = React.createContext<ProductBuyValue | null>(null);

export function ProductBuyProvider({
  product,
  children,
}: {
  product: ProductDetailDTO;
  children: React.ReactNode;
}) {
  const [variantIdx, setVariantIdx] = React.useState(0);
  const [qty, setQty] = React.useState(1);

  const variant =
    product.variants.length > 0 ? product.variants[variantIdx] ?? null : null;
  const stock = variant ? variant.stock : product.inStock ? 1 : 0;
  const inStock = stock > 0;
  const price = variant?.price ?? product.price;
  const mrp = variant?.mrp ?? product.mrp;

  const value: ProductBuyValue = {
    product,
    variantIdx,
    setVariantIdx,
    qty,
    setQty,
    variant,
    price,
    mrp,
    stock,
    inStock,
  };

  return (
    <ProductBuyContext.Provider value={value}>
      {children}
    </ProductBuyContext.Provider>
  );
}

export function useProductBuy(): ProductBuyValue {
  const ctx = React.useContext(ProductBuyContext);
  if (!ctx) {
    throw new Error("useProductBuy must be used within a ProductBuyProvider");
  }
  return ctx;
}
