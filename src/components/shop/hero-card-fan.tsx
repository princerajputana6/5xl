"use client";

import * as React from "react";
import Link from "next/link";
import { motion, useReducedMotion } from "motion/react";
import { Dumbbell, Star } from "lucide-react";
import type { ProductCardDTO } from "@/types/catalog";
import { formatINR, discountPct } from "@/lib/format";
import { ProductImage } from "./product-image";

/**
 * Teen-patti-style fanned "hand" of featured products: cards are dealt in an
 * arc with rotation, and the hand auto-shuffles so each product takes a turn at
 * the front. Shown on every breakpoint — the arc offsets and card size scale
 * down on phones so the same fan fits a mobile screen. Honors reduced motion.
 */
export function HeroCardFan({ products }: { products: ProductCardDTO[] }) {
  const reduce = useReducedMotion();
  const cards = products.slice(0, 3);
  const n = cards.length;
  const [offset, setOffset] = React.useState(0);
  const [mobile, setMobile] = React.useState(false);

  // Scale the fan geometry down on phones (set after mount to avoid a
  // hydration mismatch; the spring smooths the one-time adjustment).
  React.useEffect(() => {
    const mq = window.matchMedia("(max-width: 767px)");
    const onChange = () => setMobile(mq.matches);
    onChange();
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, []);

  React.useEffect(() => {
    if (reduce || n < 2) return;
    const id = setInterval(() => setOffset((o) => (o + 1) % n), 2600);
    return () => clearInterval(id);
  }, [reduce, n]);

  if (n === 0) return null;

  const center = (n - 1) / 2;
  const xStep = mobile ? 58 : 132;
  const rotStep = mobile ? 8 : reduce ? 9 : 11;
  const yStep = mobile ? 16 : 26;

  return (
    <div
      className="relative mx-auto block aspect-square w-full max-w-[22rem] md:max-w-xl"
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
                rotate: d * rotStep,
                x: d * xStep,
                y: Math.abs(d) * yStep,
                scale: 1 - Math.abs(d) * 0.08,
              }}
              transition={{ type: "spring", stiffness: 120, damping: 18 }}
              style={{ zIndex: Math.round(100 - Math.abs(d) * 10) }}
            >
              <Link
                href={`/products/${p.slug}`}
                className="group relative block w-60 overflow-hidden rounded-2xl border border-white/70 bg-white text-neutral-900 shadow-2xl ring-1 ring-black/5 md:w-[30rem] md:rounded-3xl"
                data-cursor="grow"
              >
                {/* corner pip like a playing card */}
                <div className="pointer-events-none absolute left-3 top-3 z-10 flex size-9 items-center justify-center rounded-full bg-primary text-neutral-900 shadow-lg md:left-4 md:top-4 md:size-12">
                  <Dumbbell className="size-5 md:size-6" />
                </div>
                {pct > 0 && (
                  <div className="pointer-events-none absolute right-3 top-3 z-10 rounded-full bg-neutral-900 px-2.5 py-1 text-xs font-bold text-white md:right-4 md:top-4 md:px-3.5 md:py-1.5 md:text-sm">
                    {pct}% OFF
                  </div>
                )}

                <div className="relative aspect-[16/10] overflow-hidden bg-neutral-100">
                  <ProductImage
                    src={p.image}
                    alt={p.name}
                    fill
                    sizes="(max-width: 767px) 240px, 480px"
                    className="object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                </div>

                <div className="p-4 md:p-5">
                  {p.brandName && (
                    <p className="text-xs font-semibold uppercase tracking-widest text-neutral-500 md:text-sm">
                      {p.brandName}
                    </p>
                  )}
                  <p className="mt-1 line-clamp-1 font-display text-lg font-bold uppercase leading-tight md:text-2xl">
                    {p.name}
                  </p>
                  <div className="mt-2 flex items-center justify-between md:mt-3">
                    <div className="flex items-baseline gap-2 md:gap-2.5">
                      <span className="font-display text-xl font-extrabold md:text-3xl">
                        {formatINR(p.price)}
                      </span>
                      {p.mrp > p.price && (
                        <span className="text-sm text-neutral-400 line-through md:text-lg">
                          {formatINR(p.mrp)}
                        </span>
                      )}
                    </div>
                    <span className="flex items-center gap-1 text-sm font-semibold text-neutral-700 md:text-lg">
                      <Star className="size-4 fill-primary text-primary md:size-5" />
                      {p.rating.toFixed(1)}
                    </span>
                  </div>
                </div>

                {/* Fade veil for the side cards (kept opaque so overlaps never
                    bleed; the veil just washes them out). */}
                <div
                  className="pointer-events-none absolute inset-0 rounded-2xl bg-white transition-opacity duration-500 md:rounded-3xl"
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
