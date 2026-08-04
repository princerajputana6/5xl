"use client";

import * as React from "react";
import Link from "next/link";
import Image from "next/image";
import { motion, useReducedMotion } from "motion/react";
import { Dumbbell, Star } from "lucide-react";
import type { ProductCardDTO } from "@/types/catalog";
import { formatINR, discountPct } from "@/lib/format";

/**
 * Teen-patti-style fanned "hand" of featured products for the hero's right
 * side: cards are dealt in an arc with rotation, and the hand auto-shuffles so
 * each product takes a turn at the front. Honors reduced motion (static fan).
 */
export function HeroCardFan({ products }: { products: ProductCardDTO[] }) {
  const reduce = useReducedMotion();
  const cards = products.slice(0, 5);
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
      className="relative mx-auto hidden aspect-[4/5] w-full max-w-sm md:block"
      style={{ perspective: "1200px" }}
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
                rotate: reduce ? d * 8 : d * 9,
                x: d * 40,
                y: Math.abs(d) * 13,
                scale: 1 - Math.abs(d) * 0.06,
              }}
              transition={{ type: "spring", stiffness: 120, damping: 18 }}
              style={{ zIndex: Math.round(100 - Math.abs(d) * 10) }}
            >
              <Link
                href={`/products/${p.slug}`}
                className="group relative block w-48 overflow-hidden rounded-2xl border border-white/70 bg-white text-neutral-900 shadow-2xl ring-1 ring-black/5"
                data-cursor="grow"
              >
                {/* corner pip like a playing card */}
                <div className="pointer-events-none absolute left-2 top-2 z-10 flex size-7 items-center justify-center rounded-full bg-primary text-neutral-900 shadow">
                  <Dumbbell className="size-4" />
                </div>
                {pct > 0 && (
                  <div className="pointer-events-none absolute right-2 top-2 z-10 rounded-full bg-neutral-900 px-2 py-0.5 text-[0.65rem] font-bold text-white">
                    {pct}% OFF
                  </div>
                )}

                <div className="relative aspect-square overflow-hidden bg-neutral-100">
                  {p.image ? (
                    <Image
                      src={p.image}
                      alt={p.name}
                      fill
                      sizes="192px"
                      className="object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                  ) : (
                    <div className="grid h-full place-items-center text-5xl">🥤</div>
                  )}
                </div>

                <div className="p-3">
                  {p.brandName && (
                    <p className="text-[0.65rem] font-semibold uppercase tracking-widest text-neutral-500">
                      {p.brandName}
                    </p>
                  )}
                  <p className="mt-0.5 line-clamp-1 font-display text-sm font-bold uppercase leading-tight">
                    {p.name}
                  </p>
                  <div className="mt-1.5 flex items-center justify-between">
                    <div className="flex items-baseline gap-1.5">
                      <span className="font-display text-base font-extrabold">
                        {formatINR(p.price)}
                      </span>
                      {p.mrp > p.price && (
                        <span className="text-xs text-neutral-400 line-through">
                          {formatINR(p.mrp)}
                        </span>
                      )}
                    </div>
                    <span className="flex items-center gap-0.5 text-xs font-semibold text-neutral-700">
                      <Star className="size-3 fill-primary text-primary" />
                      {p.rating.toFixed(1)}
                    </span>
                  </div>
                </div>
              </Link>
            </motion.div>
          );
        })}
      </motion.div>
    </div>
  );
}
