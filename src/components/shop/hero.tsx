"use client";

import * as React from "react";
import Link from "next/link";
import { motion, useReducedMotion, useScroll, useTransform } from "motion/react";
import { ArrowRight, ShieldCheck, Star, Zap, FlaskConical } from "lucide-react";
import { Button } from "@/components/ui/button";
import { HeroParticles } from "@/components/shop/hero-particles";

const stats = [
  { icon: Zap, value: "50K+", label: "Athletes fueled" },
  { icon: FlaskConical, value: "100%", label: "Lab-tested" },
  { icon: Star, value: "4.9", label: "Avg. rating" },
  { icon: ShieldCheck, value: "24h", label: "Fast dispatch" },
];

const ease = [0.22, 1, 0.36, 1] as const;

/**
 * Cinematic homepage hero: a full-bleed muscle-building stock video behind a
 * drifting three.js particle field, layered gradients for legibility, and
 * motion-animated copy. Dark by design for contrast; the rest of the page
 * stays on the light brand surface. Honors reduced motion throughout.
 */
export function Hero() {
  const reduce = useReducedMotion();
  const sectionRef = React.useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ["start start", "end start"],
  });
  // Background drifts down slower than the page scrolls (classic parallax),
  // and the copy fades as the hero leaves.
  const bgY = useTransform(scrollYProgress, [0, 1], ["0%", "22%"]);
  const bgScale = useTransform(scrollYProgress, [0, 1], [1, 1.12]);
  const copyY = useTransform(scrollYProgress, [0, 1], [0, 120]);
  const copyOpacity = useTransform(scrollYProgress, [0, 0.8], [1, 0]);

  const container = {
    hidden: {},
    show: {
      transition: { staggerChildren: 0.08, delayChildren: 0.1 },
    },
  };
  const item = reduce
    ? { hidden: { opacity: 1 }, show: { opacity: 1 } }
    : {
        hidden: { opacity: 0, y: 24 },
        show: { opacity: 1, y: 0, transition: { duration: 0.7, ease } },
      };

  return (
    <section
      ref={sectionRef}
      className="relative isolate overflow-hidden bg-neutral-950 text-white"
    >
      {/* Background video (parallax) */}
      <motion.video
        className="absolute inset-0 -z-20 h-[120%] w-full object-cover"
        style={reduce ? undefined : { y: bgY, scale: bgScale }}
        autoPlay
        muted
        loop
        playsInline
        preload="metadata"
        poster="/videos/hero-poster.jpg"
      >
        <source src="/videos/hero-gym.mp4" type="video/mp4" />
      </motion.video>

      {/* three.js dumbbell field */}
      <HeroParticles className="absolute inset-0 -z-10 h-full w-full overflow-hidden mix-blend-screen [mask-image:linear-gradient(to_right,transparent,black_35%)]" />

      {/* Legibility + brand gradients */}
      <div
        aria-hidden
        className="absolute inset-0 -z-10"
        style={{
          background:
            "linear-gradient(90deg, oklch(0.16 0 0 / 0.95) 0%, oklch(0.16 0 0 / 0.72) 42%, oklch(0.16 0 0 / 0.35) 100%)",
        }}
      />
      <div
        aria-hidden
        className="absolute inset-0 -z-10"
        style={{
          background:
            "radial-gradient(60% 70% at 8% 20%, oklch(0.86 0.18 96 / 0.28), transparent 60%), linear-gradient(to top, oklch(0.16 0 0 / 0.9), transparent 45%)",
        }}
      />
      {/* Subtle grain/vignette */}
      <div
        aria-hidden
        className="absolute inset-0 -z-10 opacity-60"
        style={{
          background:
            "radial-gradient(120% 120% at 50% 0%, transparent 55%, oklch(0.12 0 0 / 0.9) 100%)",
        }}
      />

      <div className="container-5xl relative flex min-h-[92vh] flex-col justify-center py-24 md:py-32">
        <motion.div
          variants={container}
          initial="hidden"
          animate="show"
          style={reduce ? undefined : { y: copyY, opacity: copyOpacity }}
          className="flex max-w-2xl flex-col items-start gap-6"
        >
          <motion.span
            variants={item}
            className="inline-flex items-center gap-2 rounded-full border border-primary/60 bg-primary/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-primary backdrop-blur-sm"
          >
            <span className="relative flex size-1.5">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-primary opacity-75" />
              <span className="relative inline-flex size-1.5 rounded-full bg-primary" />
            </span>
            Premium Sports Nutrition
          </motion.span>

          <motion.h1
            variants={item}
            className="font-display text-5xl font-extrabold uppercase leading-[0.92] tracking-tight sm:text-6xl md:text-8xl"
          >
            Fuel beyond{" "}
            <span className="relative inline-block">
              <span className="relative z-10 -skew-x-6 px-2 text-neutral-950">
                limits
              </span>
              <motion.span
                aria-hidden
                initial={reduce ? { scaleX: 1 } : { scaleX: 0 }}
                animate={{ scaleX: 1 }}
                transition={{ duration: 0.6, ease, delay: 0.6 }}
                className="absolute inset-0 origin-left -skew-x-6 bg-primary"
              />
            </span>
          </motion.h1>

          <motion.p
            variants={item}
            className="max-w-xl text-lg text-white/80 md:text-xl"
          >
            Lab-tested whey, creatine and mass gainers engineered for serious
            athletes. Authentic supplements, delivered fast across India.
          </motion.p>

          <motion.div variants={item} className="flex flex-wrap gap-3">
            <Button
              asChild
              size="lg"
              className="group shadow-lg shadow-primary/20"
            >
              <Link href="/products">
                Shop all products
                <ArrowRight className="ml-1 size-4 transition-transform group-hover:translate-x-1" />
              </Link>
            </Button>
            <Button
              asChild
              size="lg"
              variant="outline"
              className="border-white/25 bg-white/5 text-white backdrop-blur-sm hover:bg-white/15 hover:text-white"
            >
              <Link href="/subscriptions">Start a subscription</Link>
            </Button>
          </motion.div>

          {/* Stat row */}
          <motion.dl
            variants={item}
            className="mt-6 grid w-full max-w-xl grid-cols-2 gap-x-6 gap-y-5 border-t border-white/15 pt-6 sm:grid-cols-4"
          >
            {stats.map((s) => (
              <div key={s.label} className="flex flex-col">
                <div className="flex items-center gap-1.5">
                  <s.icon className="size-4 text-primary" />
                  <dt className="font-display text-2xl font-extrabold tracking-tight">
                    {s.value}
                  </dt>
                </div>
                <dd className="mt-0.5 text-xs uppercase tracking-wider text-white/55">
                  {s.label}
                </dd>
              </div>
            ))}
          </motion.dl>
        </motion.div>
      </div>

      {/* Scroll cue */}
      {!reduce && (
        <motion.div
          aria-hidden
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.2 }}
          className="absolute inset-x-0 bottom-6 flex justify-center"
        >
          <div className="flex h-9 w-5 items-start justify-center rounded-full border border-white/30 p-1">
            <motion.span
              animate={{ y: [0, 10, 0], opacity: [1, 0.2, 1] }}
              transition={{ duration: 1.6, repeat: Infinity, ease: "easeInOut" }}
              className="block h-1.5 w-1 rounded-full bg-primary"
            />
          </div>
        </motion.div>
      )}
    </section>
  );
}
