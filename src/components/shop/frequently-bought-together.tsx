"use client";

import * as React from "react";
import Link from "next/link";
import { Plus, ShoppingBag } from "lucide-react";
import { toast } from "sonner";
import type { ProductCardDTO } from "@/types/catalog";
import { useCart } from "@/components/providers/cart-provider";
import { Button } from "@/components/ui/button";
import { ProductImage } from "./product-image";
import { formatINR } from "@/lib/format";
import { cn } from "@/lib/utils";

const BUNDLE_DISCOUNT = 0.05;

/**
 * "Buy it together" bundle: the product being viewed plus a couple of picks
 * from the same category, with an extra discount for taking the whole set.
 */
export function FrequentlyBoughtTogether({
  product,
  suggestions,
}: {
  product: ProductCardDTO;
  suggestions: ProductCardDTO[];
}) {
  const picks = React.useMemo(() => suggestions.slice(0, 2), [suggestions]);
  const all = React.useMemo(() => [product, ...picks], [product, picks]);
  const { addItem } = useCart();

  const [selected, setSelected] = React.useState<Set<string>>(
    () => new Set(all.map((p) => p.id))
  );

  if (picks.length === 0) return null;

  const chosen = all.filter((p) => selected.has(p.id));
  const mrpTotal = chosen.reduce((s, p) => s + p.mrp, 0);
  const priceTotal = chosen.reduce((s, p) => s + p.price, 0);
  const bundleTotal =
    chosen.length > 1 ? Math.round(priceTotal * (1 - BUNDLE_DISCOUNT)) : priceTotal;

  function toggle(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function addBundle() {
    for (const p of chosen) {
      addItem({
        productId: p.id,
        slug: p.slug,
        name: p.name,
        image: p.image,
        variantId: null,
        variantLabel: null,
        price: p.price,
        mrp: p.mrp,
      });
    }
    toast.success(`Added ${chosen.length} item${chosen.length > 1 ? "s" : ""} to your cart`);
  }

  return (
    <section className="mt-14">
      <h2 className="font-display text-2xl font-extrabold uppercase tracking-tight">
        Frequently Bought Together
      </h2>
      <p className="mt-1 text-sm text-muted-foreground">
        Bundle up and get an extra {Math.round(BUNDLE_DISCOUNT * 100)}% off.
      </p>

      <div className="mt-6 rounded-xl border border-border p-5">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center">
          {/* Product row */}
          <div className="flex flex-1 flex-wrap items-center gap-3">
            {all.map((p, i) => (
              <React.Fragment key={p.id}>
                {i > 0 && <Plus className="size-4 shrink-0 text-muted-foreground" />}
                <label
                  className={cn(
                    "flex w-[13rem] cursor-pointer items-center gap-3 rounded-lg border p-2.5 transition-all duration-200",
                    selected.has(p.id)
                      ? "border-primary bg-accent/50 shadow-sm"
                      : "border-border opacity-60 hover:opacity-100"
                  )}
                >
                  <input
                    type="checkbox"
                    checked={selected.has(p.id)}
                    onChange={() => toggle(p.id)}
                    className="size-4 shrink-0 accent-[var(--primary)]"
                    aria-label={`Include ${p.name} in the bundle`}
                  />
                  <span className="relative size-14 shrink-0 overflow-hidden rounded-md bg-muted">
                    <ProductImage src={p.image} alt={p.name} fill sizes="56px" className="object-cover" />
                  </span>
                  <span className="min-w-0 flex-1">
                    <Link
                      href={`/products/${p.slug}`}
                      className="line-clamp-2 text-xs font-medium leading-snug hover:text-primary"
                    >
                      {p.name}
                    </Link>
                    <span className="mt-1 block text-xs">
                      <span className="font-semibold">{formatINR(p.price)}</span>{" "}
                      <span className="text-muted-foreground line-through">{formatINR(p.mrp)}</span>
                    </span>
                  </span>
                </label>
              </React.Fragment>
            ))}
          </div>

          {/* Totals */}
          <div className="shrink-0 border-border lg:border-l lg:pl-6">
            <p className="text-sm text-muted-foreground">
              Bundle price
              {mrpTotal > bundleTotal && (
                <span className="ml-2 line-through">{formatINR(mrpTotal)}</span>
              )}
            </p>
            <p className="font-display text-3xl font-extrabold">{formatINR(bundleTotal)}</p>
            <Button
              onClick={addBundle}
              disabled={chosen.length === 0}
              size="lg"
              className="mt-3 w-full transition-transform active:scale-95"
            >
              <ShoppingBag className="mr-2 size-4" />
              Add bundle to cart
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
}
