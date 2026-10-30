"use client";

import Link from "next/link";
import { Dumbbell, Star } from "lucide-react";
import type { ProductCardDTO } from "@/types/catalog";
import { formatINR, discountPct } from "@/lib/format";
import { ProductImage } from "./product-image";

/**
 * Mobile-only presentation of the hero's featured products — the same white
 * "playing card" design as the desktop fan, laid out as a swipeable row of up
 * to three cards (the fan's rotation/overlap doesn't fit a phone width).
 */
export function HeroCardsMobile({ products }: { products: ProductCardDTO[] }) {
  const cards = products.slice(0, 3);
  if (cards.length === 0) return null;

  return (
    <div
      className="-mx-4 flex snap-x snap-mandatory gap-3 overflow-x-auto px-4 pb-1 md:hidden [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      aria-label="Featured products"
    >
      {cards.map((p) => {
        const pct = discountPct(p.mrp, p.price);
        return (
          <Link
            key={p.id}
            href={`/products/${p.slug}`}
            className="group relative block w-[78%] shrink-0 snap-start overflow-hidden rounded-2xl border border-white/70 bg-white text-neutral-900 shadow-xl ring-1 ring-black/5"
          >
            <div className="pointer-events-none absolute left-3 top-3 z-10 flex size-9 items-center justify-center rounded-full bg-primary text-neutral-900 shadow">
              <Dumbbell className="size-5" />
            </div>
            {pct > 0 && (
              <div className="pointer-events-none absolute right-3 top-3 z-10 rounded-full bg-neutral-900 px-2.5 py-1 text-xs font-bold text-white">
                {pct}% OFF
              </div>
            )}

            <div className="relative aspect-[16/10] overflow-hidden bg-neutral-100">
              <ProductImage
                src={p.image}
                alt={p.name}
                fill
                sizes="320px"
                className="object-cover transition-transform duration-500 group-hover:scale-105"
              />
            </div>

            <div className="p-4">
              {p.brandName && (
                <p className="text-xs font-semibold uppercase tracking-widest text-neutral-500">
                  {p.brandName}
                </p>
              )}
              <p className="mt-1 line-clamp-1 font-display text-lg font-bold uppercase leading-tight">
                {p.name}
              </p>
              <div className="mt-2 flex items-center justify-between">
                <div className="flex items-baseline gap-2">
                  <span className="font-display text-xl font-extrabold">{formatINR(p.price)}</span>
                  {p.mrp > p.price && (
                    <span className="text-sm text-neutral-400 line-through">
                      {formatINR(p.mrp)}
                    </span>
                  )}
                </div>
                <span className="flex items-center gap-1 text-sm font-semibold text-neutral-700">
                  <Star className="size-4 fill-primary text-primary" />
                  {p.rating.toFixed(1)}
                </span>
              </div>
            </div>
          </Link>
        );
      })}
    </div>
  );
}
