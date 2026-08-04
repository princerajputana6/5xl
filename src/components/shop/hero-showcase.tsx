"use client";

import * as React from "react";
import { motion, useReducedMotion } from "motion/react";
import { Zap, ShieldCheck, Star } from "lucide-react";

/**
 * Animated hero visual for the right side of the homepage hero: a floating
 * protein tub with a soft volt glow, orbiting stat badges, and a gentle
 * pointer parallax. Purely decorative (aria-hidden). Honors reduced motion.
 */
export function HeroShowcase() {
  const reduce = useReducedMotion();
  const [tilt, setTilt] = React.useState({ x: 0, y: 0 });

  const onMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (reduce) return;
    const r = e.currentTarget.getBoundingClientRect();
    const px = (e.clientX - r.left) / r.width - 0.5;
    const py = (e.clientY - r.top) / r.height - 0.5;
    setTilt({ x: px * 16, y: py * -16 });
  };

  const float = (delay = 0, dist = 14) =>
    reduce
      ? {}
      : {
          animate: { y: [0, -dist, 0] },
          transition: {
            duration: 5,
            repeat: Infinity,
            ease: "easeInOut" as const,
            delay,
          },
        };

  return (
    <div
      aria-hidden
      onMouseMove={onMove}
      onMouseLeave={() => setTilt({ x: 0, y: 0 })}
      className="relative mx-auto hidden aspect-square w-full max-w-md md:block"
      style={{ perspective: "1000px" }}
    >
      {/* Glow */}
      <motion.div
        className="absolute inset-6 rounded-full"
        style={{
          background:
            "radial-gradient(circle, oklch(0.86 0.18 96 / 0.55), transparent 62%)",
          filter: "blur(28px)",
        }}
        {...(reduce
          ? {}
          : {
              animate: { scale: [1, 1.08, 1], opacity: [0.7, 1, 0.7] },
              transition: { duration: 4.5, repeat: Infinity, ease: "easeInOut" as const },
            })}
      />

      {/* Concentric rings */}
      <div className="absolute inset-0 grid place-items-center">
        <div className="absolute size-[86%] rounded-full border border-foreground/10" />
        <div className="absolute size-[64%] rounded-full border border-foreground/10" />
      </div>

      {/* The tub */}
      <motion.div
        className="absolute inset-0 grid place-items-center"
        style={{
          transform: `rotateY(${tilt.x}deg) rotateX(${tilt.y}deg)`,
          transformStyle: "preserve-3d",
          transition: "transform 0.2s ease-out",
        }}
      >
        <motion.div {...float(0, 16)} className="relative">
          <div className="relative h-64 w-48 overflow-hidden rounded-[2rem] bg-gradient-to-b from-neutral-800 to-neutral-950 shadow-2xl ring-1 ring-white/10">
            {/* rim light */}
            <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-primary/70 to-transparent" />
            {/* lid */}
            <div className="absolute inset-x-3 -top-4 h-10 rounded-2xl bg-gradient-to-b from-neutral-700 to-neutral-800 ring-1 ring-white/10" />
            {/* label */}
            <div className="absolute inset-x-4 top-16 rounded-xl bg-primary/95 p-4 text-center shadow-lg">
              <p className="font-display text-3xl font-extrabold uppercase leading-none tracking-tight text-neutral-900">
                5XL
              </p>
              <p className="mt-1 font-display text-[0.7rem] font-bold uppercase tracking-[0.2em] text-neutral-900/80">
                Whey Isolate
              </p>
              <div className="mx-auto mt-2 h-px w-10 bg-neutral-900/30" />
              <p className="mt-2 text-[0.6rem] font-semibold uppercase tracking-widest text-neutral-900/70">
                30g Protein · 1kg
              </p>
            </div>
            {/* volt streak */}
            <div className="absolute -right-6 bottom-6 h-24 w-24 rotate-12 rounded-full bg-primary/20 blur-xl" />
          </div>
        </motion.div>
      </motion.div>

      {/* Orbiting badges */}
      <motion.div
        {...float(0.6, 18)}
        className="absolute left-1 top-10 flex items-center gap-1.5 rounded-full border border-white/10 bg-neutral-900/80 px-3 py-1.5 text-xs font-semibold text-white shadow-lg backdrop-blur"
      >
        <Zap className="size-3.5 text-primary" /> 30g Protein
      </motion.div>

      <motion.div
        {...float(1.1, 16)}
        className="absolute right-0 top-24 flex items-center gap-1.5 rounded-full border border-white/10 bg-neutral-900/80 px-3 py-1.5 text-xs font-semibold text-white shadow-lg backdrop-blur"
      >
        <ShieldCheck className="size-3.5 text-primary" /> Lab-Tested
      </motion.div>

      <motion.div
        {...float(0.9, 20)}
        className="absolute bottom-12 left-2 flex items-center gap-1.5 rounded-full border border-white/10 bg-neutral-900/80 px-3 py-1.5 text-xs font-semibold text-white shadow-lg backdrop-blur"
      >
        <Star className="size-3.5 fill-primary text-primary" /> 4.9 / 5
      </motion.div>

      {/* Molecule mark */}
      <motion.svg
        {...float(1.4, 14)}
        viewBox="0 0 60 60"
        className="absolute bottom-8 right-4 size-16 text-primary/80"
        fill="none"
      >
        <circle cx="30" cy="12" r="5" fill="currentColor" />
        <circle cx="14" cy="40" r="5" fill="currentColor" />
        <circle cx="46" cy="40" r="5" fill="currentColor" />
        <path d="M30 12 14 40M30 12l16 28M14 40h32" stroke="currentColor" strokeWidth="2" />
      </motion.svg>
    </div>
  );
}
