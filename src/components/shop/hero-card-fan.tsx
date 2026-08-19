"use client";

import * as React from "react";
import Link from "next/link";
import { motion, useReducedMotion } from "motion/react";
import { Dumbbell, Star } from "lucide-react";
import type { ProductCardDTO } from "@/types/catalog";
import { formatINR, discountPct } from "@/lib/format";
import { ProductImage } from "./product-image";

/**
 * Teen-patti-style fanned "hand" of featured products for the hero's right
 * side: cards are dealt in an arc with rotation, and the hand auto-shuffles so
 * each product takes a turn at the front. Honors reduced motion (static fan).
 */
export function HeroCardFan({ products }: { products: ProductCardDTO[] }) {
  const reduce = useReducedMotion();
  const cards = products.slice(0, 3);
  const n = cards.length;
  const [offset, setOffset] = React.useState(0);

  React.useEffect(() => {
    if (reduce || n < 2) return;
    const id = setInterval(() => setOffset((o) => (o + 1) % n), 2600);
    return () => clearInterval(id);
  }, [reduce, n]);

  if (n === 0) return null;

  const center = (n - 1) / 2;

  return (
    <div
      className="relative mx-auto hidden aspect-square w-full max-w-xl md:block"
      style={{ perspective: "1600px" }}
      aria-label="Featured products"
    >
      {/* soft glow behind the hand */}
      <div
        aria-hidden
        className="absolute inset-8 rounded-full"
        style={{
          background:
            "radial-gradient(circle, oklch(0.86 0.18 96 / 0.35), transparent 65%)",
          filter: "blur(30px)",
        }}
      />

      <motion.div
        className="absolute inset-0 grid place-items-center"
        animate={reduce ? undefined : { y: [0, -10, 0] }}
        transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
      >
        {cards.map((p, j) => {
          const slot = (j + offset) % n;
          const d = slot - center;
          const pct = discountPct(p.mrp, p.price);
          return (
            <motion.div
              key={p.id}
              className="absolute"
              initial={false}
              animate={{
                rotate: reduce ? d * 9 : d * 11,
                x: d * 132,
                y: Math.abs(d) * 26,
                scale: 1 - Math.abs(d) * 0.08,
              }}
              transition={{ type: "spring", stiffness: 120, damping: 18 }}
              style={{ zIndex: Math.round(100 - Math.abs(d) * 10) }}
            >
              <Link
                href={`/products/${p.slug}`}
                className="group relative block w-[30rem] overflow-hidden rounded-3xl border border-white/70 bg-white text-neutral-900 shadow-2xl ring-1 ring-black/5"
                data-cursor="grow"
              >
                {/* corner pip like a playing card */}
                <div className="pointer-events-none absolute left-4 top-4 z-10 flex size-12 items-center justify-center rounded-full bg-primary text-neutral-900 shadow-lg">
                  <Dumbbell className="size-6" />
                </div>
                {pct > 0 && (
                  <div className="pointer-events-none absolute right-4 top-4 z-10 rounded-full bg-neutral-900 px-3.5 py-1.5 text-sm font-bold text-white">
                    {pct}% OFF
                  </div>
                )}

                <div className="relative aspect-[16/10] overflow-hidden bg-neutral-100">
                  <ProductImage
                    src={p.image}
                    alt={p.name}
                    fill
                    sizes="480px"
                    className="object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                </div>

                <div className="p-5">
                  {p.brandName && (
                    <p className="text-sm font-semibold uppercase tracking-widest text-neutral-500">
                      {p.brandName}
                    </p>
                  )}
                  <p className="mt-1 line-clamp-1 font-display text-2xl font-bold uppercase leading-tight">
                    {p.name}
                  </p>
                  <div className="mt-3 flex items-center justify-between">
                    <div className="flex items-baseline gap-2.5">
                      <span className="font-display text-3xl font-extrabold">
                        {formatINR(p.price)}
                      </span>
                      {p.mrp > p.price && (
                        <span className="text-lg text-neutral-400 line-through">
                          {formatINR(p.mrp)}
                        </span>
                      )}
                    </div>
                    <span className="flex items-center gap-1 text-lg font-semibold text-neutral-700">
                      <Star className="size-5 fill-primary text-primary" />
                      {p.rating.toFixed(1)}
                    </span>
                  </div>
                </div>

                {/* Fade veil for the side cards (kept opaque so overlaps never
                    bleed; the veil just washes them out). */}
                <div
                  className="pointer-events-none absolute inset-0 rounded-3xl bg-white transition-opacity duration-500"
                  style={{ opacity: Math.abs(d) * 0.4 }}
                />
              </Link>
            </motion.div>
          );
        })}
      </motion.div>
    </div>
  );
}
