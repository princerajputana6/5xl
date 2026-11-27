"use client";

import { PriceCard } from "./price-card";
import { useProductBuy } from "./product-buy-context";

/**
 * Price panel that reflects the currently selected variant. Reads the shared
 * ProductBuyContext so the headline price updates the moment a variant is
 * chosen in the purchase panel or sticky bar.
 */
export function ProductPrice() {
  const { price, mrp } = useProductBuy();
  return <PriceCard price={price} mrp={mrp} />;
}
